const { Router } = require('express');
const { getStudentDashboard } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

router.use(createRateLimiter({ windowMs: 60 * 1000, max: 120, message: 'Too many requests. Please slow down.' }));
router.get('/', protect, getStudentDashboard);

module.exports = router;