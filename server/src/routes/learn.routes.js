const { Router } = require('express');
const c = require('../controllers/learn.controller');
const { protect } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

router.use(createRateLimiter({ windowMs: 60 * 1000, max: 240, message: 'Too many requests. Please slow down.' }));
router.use(protect);

router.get('/courses/:slug', c.course);
router.get('/lessons/:id', c.lesson);
router.post('/lessons/:id/complete', c.complete);

module.exports = router;