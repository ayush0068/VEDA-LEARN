const { Router } = require('express');
const { sendMessage } = require('../controllers/contact.controller');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

// 5 messages per minute per IP (stops spam / accidental double-submits)
const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 5, message: 'Too many messages. Please try again in a minute.' });

router.post('/', limiter, sendMessage);

module.exports = router;