const { Router } = require('express');
const { protect, restrictTo } = require('../../middleware/auth');
const { createRateLimiter } = require('../../middleware/rateLimit');
const courseRoutes = require('./courses.routes');
const liveRoutes = require('./live.routes');
const instructorRoutes = require('./instructors.routes');
const studentRoutes = require('./students.routes');

const router = Router();

const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 240, message: 'Too many requests. Please slow down.' });

// everything under /api/admin needs a signed-in ADMIN
router.use(limiter, protect, restrictTo('admin'));

router.use('/students', studentRoutes);
router.use('/instructors', instructorRoutes);
router.use('/courses', courseRoutes);
router.use('/live-classes', liveRoutes);

module.exports = router;