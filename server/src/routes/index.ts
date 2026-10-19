import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

router.use('/health', healthRoutes);

// Future milestones plug in here, e.g.:
// router.use('/courses', courseRoutes);
// router.use('/auth', authRoutes);
// router.use('/admin', adminRoutes);   // used by the future admin/ panel

export default router;
