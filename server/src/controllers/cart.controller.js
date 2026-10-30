const { getDbState } = require('../config/db');
const {
  addItem,
  applyCoupon,
  buildCartView,
  clearCart,
  cleanSlugs,
  getCartState,
  mergeCart,
  removeCoupon,
  removeItem,
} = require('../services/cart.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const bodyOf = (req) => (req.body && typeof req.body === 'object' ? req.body : {});
const asString = (value) => (typeof value === 'string' ? value : '');

const assertDb = () => {
  if (getDbState() !== 'connected') throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
};

// every cart response is private to the user
const send = (res, data, status = 200) => {
  res.set('Cache-Control', 'no-store');
  res.status(status).json({ success: true, data });
};

// GET /api/cart   (signed in) -> full cart view: items, summary, coupon, recommended
const getCart = asyncHandler(async (req, res) => {
  const state = await getCartState(req.user._id);
  const view = await buildCartView(state);
  // a coupon that stopped being valid (expired, cart total dropped...) is removed from the saved cart
  if (view.couponError && state.couponCode) await removeCoupon(req.user._id);
  send(res, view);
});

// POST /api/cart/items   body: { slug }
const addCartItem = asyncHandler(async (req, res) => {
  send(res, await addItem(req.user._id, asString(bodyOf(req).slug).trim().toLowerCase()), 201);
});

// DELETE /api/cart/items/:slug
const removeCartItem = asyncHandler(async (req, res) => {
  send(res, await removeItem(req.user._id, asString(req.params.slug).trim().toLowerCase()));
});

// DELETE /api/cart
const clearCartItems = asyncHandler(async (req, res) => {
  send(res, await clearCart(req.user._id));
});

// POST /api/cart/merge   body: { slugs: string[], couponCode? }   (guest cart -> account cart after login)
const mergeGuestCart = asyncHandler(async (req, res) => {
  const body = bodyOf(req);
  send(res, await mergeCart(req.user._id, { slugs: body.slugs, couponCode: asString(body.couponCode) }));
});

// PUT /api/cart/coupon   body: { code }
const setCartCoupon = asyncHandler(async (req, res) => {
  send(res, await applyCoupon(req.user._id, asString(bodyOf(req).code)));
});

// DELETE /api/cart/coupon
const deleteCartCoupon = asyncHandler(async (req, res) => {
  send(res, await removeCoupon(req.user._id));
});

// POST /api/cart/preview   body: { slugs: string[], couponCode? }   (public: cart page for guests)
const previewCart = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const view = await buildCartView({ slugs: cleanSlugs(body.slugs), couponCode: asString(body.couponCode).trim() });
  send(res, view);
});

module.exports = {
  getCart,
  addCartItem,
  removeCartItem,
  clearCartItems,
  mergeGuestCart,
  setCartCoupon,
  deleteCartCoupon,
  previewCart,
};