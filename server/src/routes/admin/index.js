const { Router } = require('express');
const { protect, restrictTo } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const studentRoutes = require('./students.routes');

const router = Router();

const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 240, message: 'Too many requests. Please slow down.' });

// everything under /api/admin needs a signed-in ADMIN
router.use(limiter, protect, restrictTo('admin'));

router.use('/students', studentRoutes);

module.exports = router;