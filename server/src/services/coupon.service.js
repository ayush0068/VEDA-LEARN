const { COUPON_SEEDS } = require('../data/coupons.seed');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

const CODE_RE = /^[A-Z0-9_-]{3,30}$/;

const normalizeCode = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');
const inr = (amount) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

/**
 * Checks a coupon against the cart total (after course discounts) and returns
 * { code, label, amount } where amount is the rupees taken off. Throws a 400 ApiError with a
 * user-friendly message when the code can't be used.
 */
const resolveCoupon = async (rawCode, saleTotal) => {
  const code = normalizeCode(rawCode);
  if (!CODE_RE.test(code)) throw new ApiError(400, 'Invalid coupon code');

  const coupon = await Coupon.findOne({ code, isActive: true }).lean();
  if (!coupon || (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())) {
    throw new ApiError(400, 'This coupon is invalid or has expired');
  }
  if (saleTotal < (coupon.minOrder || 0)) {
    throw new ApiError(400, `This coupon needs a minimum order of ${inr(coupon.minOrder)}`);
  }

  let amount = coupon.discountType === 'percent' ? Math.round((saleTotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) amount = Math.min(amount, coupon.maxDiscount);
  amount = Math.min(amount, saleTotal);

  const label = coupon.description || (coupon.discountType === 'percent' ? `${coupon.value}% off` : `${inr(coupon.value)} off`);
  return { code, label, amount };
};

// Inserts missing sample coupons; never overwrites existing ones (admin edits are kept).
const seedCoupons = async () => {
  const result = await Coupon.bulkWrite(
    COUPON_SEEDS.map((item) => ({
      updateOne: { filter: { code: item.code }, update: { $setOnInsert: { ...item, isActive: true } }, upsert: true },
    })),
    { ordered: false },
  );
  return result.upsertedCount;
};

const seedCouponsIfEmpty = async () => {
  if ((await Coupon.estimatedDocumentCount()) > 0) return 0;
  return seedCoupons();
};

module.exports = { resolveCoupon, normalizeCode, seedCoupons, seedCouponsIfEmpty };