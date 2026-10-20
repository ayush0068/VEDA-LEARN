const { Router } = require('express');
const { subscribe } = require('../controllers/newsletter.controller');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

// 5 attempts per minute per IP
const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 5, message: 'Too many attempts. Please try again in a minute.' });

router.post('/subscribe', limiter, subscribe);

module.exports = router;