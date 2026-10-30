const Cart = require('../models/Cart');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');
const { resolveCoupon } = require('./coupon.service');

const MAX_ITEMS = 50;
const RECOMMENDED_COUNT = 4;
const COURSE_FIELDS =
  'slug title category image icon instructor description lessons weeks level language rating studentsCount price originalPrice badge -_id';

const SLUG_RE = /^[a-z0-9-]{1,100}$/;

/** Keeps only valid, unique slug strings (max 50). */
const cleanSlugs = (value) => {
  if (!Array.isArray(value)) return [];
  const slugs = value
    .filter((slug) => typeof slug === 'string')
    .map((slug) => slug.trim().toLowerCase())
    .filter((slug) => SLUG_RE.test(slug));
  return [...new Set(slugs)].slice(0, MAX_ITEMS);
};

const activeSlugs = async (slugs) => {
  if (slugs.length === 0) return [];
  const found = await Course.find({ slug: { $in: slugs }, isActive: true }).select('slug').lean();
  const ok = new Set(found.map((course) => course.slug));
  return slugs.filter((slug) => ok.has(slug));
};

// Atomic upsert (two requests creating the same cart at once can race on the unique index -> retry once)
const updateCart = async (userId, update) => {
  try {
    await Cart.updateOne({ user: userId }, update, { upsert: true });
  } catch (err) {
    if (err && err.code === 11000) {
      await Cart.updateOne({ user: userId }, update, { upsert: true });
      return;
    }
    throw err;
  }
};

/** { slugs, count, couponCode } for a signed-in user. Courses that no longer exist are dropped. */
const getCartState = async (userId) => {
  const doc = await Cart.findOne({ user: userId }).lean();
  const stored = doc ? doc.slugs : [];
  const slugs = await activeSlugs(stored);

  if (slugs.length !== stored.length) {
    const gone = stored.filter((slug) => !slugs.includes(slug));
    await Cart.updateOne({ user: userId }, { $pull: { slugs: { $in: gone } } });
  }
  return { slugs, count: slugs.length, couponCode: (doc && doc.couponCode) || null };
};

const addItem = async (userId, slug) => {
  if (!SLUG_RE.test(slug || '')) throw new ApiError(400, 'Invalid course');
  const [valid] = await activeSlugs([slug]);
  if (!valid) throw new ApiError(404, 'Course not found');

  const doc = await Cart.findOne({ user: userId }).lean();
  if (doc && !doc.slugs.includes(slug) && doc.slugs.length >= MAX_ITEMS) {
    throw new ApiError(400, `Your cart is full (max ${MAX_ITEMS} courses)`);
  }
  await updateCart(userId, { $addToSet: { slugs: slug } });
  return getCartState(userId);
};

const removeItem = async (userId, slug) => {
  await Cart.updateOne({ user: userId }, { $pull: { slugs: slug } });
  return getCartState(userId);
};

const clearCart = async (userId) => {
  await Cart.updateOne({ user: userId }, { $set: { slugs: [], couponCode: null } });
  return getCartState(userId);
};

/** Guest cart (from localStorage) -> signed-in cart, right after login. Idempotent. */
const mergeCart = async (userId, { slugs, couponCode }) => {
  const valid = await activeSlugs(cleanSlugs(slugs));
  const current = await getCartState(userId);

  const room = Math.max(0, MAX_ITEMS - current.slugs.length);
  const toAdd = valid.filter((slug) => !current.slugs.includes(slug)).slice(0, room);
  if (toAdd.length > 0) await updateCart(userId, { $addToSet: { slugs: { $each: toAdd } } });

  // keep the guest's coupon only if the cart has none yet and the code is still valid
  if (couponCode && !current.couponCode) {
    try {
      const state = await getCartState(userId);
      const { saleTotal } = await totals(state.slugs);
      const coupon = await resolveCoupon(couponCode, saleTotal);
      await updateCart(userId, { $set: { couponCode: coupon.code } });
    } catch {
      /* invalid guest coupon: ignore */
    }
  }
  return getCartState(userId);
};

const totals = async (slugs) => {
  const courses = slugs.length ? await Course.find({ slug: { $in: slugs }, isActive: true }).select('price originalPrice').lean() : [];
  const saleTotal = courses.reduce((sum, c) => sum + c.price, 0);
  const listTotal = courses.reduce((sum, c) => sum + (c.originalPrice > c.price ? c.originalPrice : c.price), 0);
  return { saleTotal, listTotal };
};

const applyCoupon = async (userId, rawCode) => {
  const state = await getCartState(userId);
  if (state.count === 0) throw new ApiError(400, 'Add a course to your cart first');

  const { saleTotal } = await totals(state.slugs);
  const coupon = await resolveCoupon(rawCode, saleTotal);
  await updateCart(userId, { $set: { couponCode: coupon.code } });
  return getCartState(userId);
};

const removeCoupon = async (userId) => {
  await Cart.updateOne({ user: userId }, { $set: { couponCode: null } });
  return getCartState(userId);
};

/**
 * Everything the cart page shows: items (in cart order), price summary, applied coupon and
 * "You may also like" suggestions. Works for any list of slugs (signed-in cart or guest preview).
 */
const buildCartView = async ({ slugs, couponCode }) => {
  const courses = slugs.length
    ? await Course.find({ slug: { $in: slugs }, isActive: true }).select(COURSE_FIELDS).lean()
    : [];
  const bySlug = new Map(courses.map((course) => [course.slug, course]));
  const items = slugs.filter((slug) => bySlug.has(slug)).map((slug) => bySlug.get(slug));

  const saleTotal = items.reduce((sum, c) => sum + c.price, 0);
  const listTotal = items.reduce((sum, c) => sum + (c.originalPrice > c.price ? c.originalPrice : c.price), 0);

  let coupon = null;
  let couponError;
  if (couponCode && items.length > 0) {
    try {
      coupon = await resolveCoupon(couponCode, saleTotal);
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      couponError = err.message;
    }
  }

  const couponDiscount = coupon ? coupon.amount : 0;
  const courseDiscount = listTotal - saleTotal;
  const savings = courseDiscount + couponDiscount;

  const recommended = await Course.find({ isActive: true, slug: { $nin: items.map((c) => c.slug) } })
    .sort({ isPopular: -1, order: 1 })
    .limit(RECOMMENDED_COUNT)
    .select(COURSE_FIELDS)
    .lean();

  return {
    items,
    summary: {
      itemCount: items.length,
      listTotal,
      courseDiscount,
      couponDiscount,
      total: saleTotal - couponDiscount,
      savings,
      savingsPercent: listTotal > 0 ? Math.round((savings / listTotal) * 100) : 0,
    },
    coupon,
    ...(couponError ? { couponError } : {}),
    recommended,
  };
};

module.exports = {
  cleanSlugs,
  getCartState,
  addItem,
  removeItem,
  clearCart,
  mergeCart,
  applyCoupon,
  removeCoupon,
  buildCartView,
};