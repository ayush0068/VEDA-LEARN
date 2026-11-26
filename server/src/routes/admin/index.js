const { Router } = require('express');
const { protect, restrictTo } = require('../../middleware/auth');
const { requireAnyPermission, requirePermission, requireSuper, trackAdmin } = require('../../middleware/adminAccess');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { upload } = require('../../controllers/adminUpload.controller');
const courseRoutes = require('./courses.routes');
const curriculumRoutes = require('./curriculum.routes');
const liveRoutes = require('./live.routes');
const instructorRoutes = require('./instructors.routes');
const studentRoutes = require('./students.routes');
const teamRoutes = require('./team.routes');

const router = Router();

const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 240, message: 'Too many requests. Please slow down.' });

// everything under /api/admin needs a signed-in ADMIN; trackAdmin keeps the record book (who did what, when)
router.use(limiter, protect, restrictTo('admin'), trackAdmin);

// ...and then the right to use that module (GET = view, POST / PATCH = edit, DELETE = full). The super admin may do everything.
router.use('/students', requirePermission('students'), studentRoutes);
router.use('/instructors', requirePermission('instructors'), instructorRoutes);
// file uploads are shared by Courses (cover image, preview video, syllabus) and Modules & Lessons (lesson media)
router.post('/courses/upload/:kind', requireAnyPermission(['courses', 'curriculum'], { level: 'edit' }), upload);
router.use('/courses', requirePermission('courses'), courseRoutes);
router.use('/curriculum', requirePermission('curriculum'), curriculumRoutes);
router.use('/live-classes', requirePermission('liveClasses'), liveRoutes);

// Admins & Roles: the super admin only
router.use('/team', requireSuper, teamRoutes);

module.exports = router;