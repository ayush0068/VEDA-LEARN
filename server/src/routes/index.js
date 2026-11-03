const { Router } = require('express');
const authRoutes = require('./auth.routes');
const cartRoutes = require('./cart.routes');
const categoryRoutes = require('./category.routes');
const contactRoutes = require('./contact.routes');
const courseRoutes = require('./course.routes');
const dashboardRoutes = require('./dashboard.routes');
const featureRoutes = require('./feature.routes');
const healthRoutes = require('./health.routes');
const newsletterRoutes = require('./newsletter.routes');
const profileRoutes = require('./profile.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/features', featureRoutes);
router.use('/categories', categoryRoutes);
router.use('/courses', courseRoutes);
router.use('/cart', cartRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/contact', contactRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);

// Future milestones plug in here, e.g.:
// router.use('/admin', protect, restrictTo('admin'), adminRoutes);   // used by the future admin/ panel

module.exports = router;