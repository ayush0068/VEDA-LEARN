const { Router } = require('express');
const c = require('../../controllers/adminCurriculum.controller');

const router = Router();

// course picker + the whole curriculum of one course
router.get('/courses', c.courses);
router.get('/course/:slug', c.curriculum);

// modules
router.post('/course/:slug/modules', c.createModule);
router.post('/course/:slug/modules/reorder', c.reorderModules);
router.patch('/modules/:id', c.updateModule);
router.delete('/modules/:id', c.deleteModule);
router.post('/modules/:id/duplicate', c.duplicateModule);

// lessons
router.post('/modules/:id/lessons', c.createLesson);
router.post('/modules/:id/lessons/reorder', c.reorderLessons);
router.post('/lessons/bulk-status', c.bulkStatus);
router.patch('/lessons/:id', c.updateLesson);
router.delete('/lessons/:id', c.deleteLesson);
router.post('/lessons/:id/duplicate', c.duplicateLesson);
router.post('/lessons/:id/move', c.moveLesson);

module.exports = router;