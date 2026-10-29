const { Router } = require('express');
const { login, me, register } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

// per IP, per minute
const registerLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10, message: 'Too many attempts. Please try again in a minute.' });
const loginLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10, message: 'Too many attempts. Please try again in a minute.' });

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, me);

module.exports = router;