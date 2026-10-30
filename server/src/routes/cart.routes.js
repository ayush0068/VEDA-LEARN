const { Router } = require('express');
const {
  addCartItem,
  clearCartItems,
  deleteCartCoupon,
  getCart,
  mergeGuestCart,
  previewCart,
  removeCartItem,
  setCartCoupon,
} = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

router.use(createRateLimiter({ windowMs: 60 * 1000, max: 120, message: 'Too many requests. Please slow down.' }));

// public: price summary for a guest's localStorage cart
router.post('/preview', previewCart);

// signed-in cart (stored in MongoDB)
router.use(protect);
router.get('/', getCart);
router.post('/items', addCartItem);
router.delete('/items/:slug', removeCartItem);
router.post('/merge', mergeGuestCart);
router.put('/coupon', setCartCoupon);
router.delete('/coupon', deleteCartCoupon);
router.delete('/', clearCartItems);

module.exports = router;