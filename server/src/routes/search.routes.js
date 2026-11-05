const { Router } = require('express');
const { search } = require('../controllers/search.controller');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

// live search fires while typing: 120 requests per minute per IP
const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 120, message: 'Too many searches. Please slow down a little.' });

router.get('/', limiter, search);

module.exports = router;