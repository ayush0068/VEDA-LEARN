const { Router } = require('express');
const adminRoutes = require('./admin');
const authRoutes = require('./auth.routes');
const cartRoutes = require('./cart.routes');
const categoryRoutes = require('./category.routes');
const contactRoutes = require('./contact.routes');
const courseRoutes = require('./course.routes');
const dashboardRoutes = require('./dashboard.routes');
const featureRoutes = require('./feature.routes');
const healthRoutes = require('./health.routes');
const liveRoutes = require('./live.routes');
const newsletterRoutes = require('./newsletter.routes');
const profileRoutes = require('./profile.routes');
const searchRoutes = require('./search.routes');

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
router.use('/live-classes', liveRoutes);
router.use('/profile', profileRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);

// Future milestones plug in here, e.g.:

module.exports = router;