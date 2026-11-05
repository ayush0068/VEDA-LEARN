const { Router } = require('express');
const controller = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

const generalLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120, message: 'Too many requests. Please slow down.' });
// password / email changes need the current password, so they get a much lower limit (per IP, per minute)
const credentialsLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 8, message: 'Too many attempts. Please try again in a minute.' });

router.use(generalLimiter, protect);

router.get('/', controller.getProfile);
router.patch('/', controller.updateProfile);

router.put('/avatar', controller.updateAvatar);
router.delete('/avatar', controller.removeAvatar);

router.patch('/email', credentialsLimiter, controller.updateEmail);
router.patch('/password', credentialsLimiter, controller.updatePassword);

router.patch('/notifications', controller.updateNotifications);
router.patch('/privacy', controller.updatePrivacy);

router.patch('/preferences', controller.updatePreferences);

router.get('/orders', controller.getOrders);

module.exports = router;