const { Router } = require('express');
const { getCourse, getOutline, getPreviewLesson, listCourses } = require('../controllers/course.controller');

const router = Router();

router.get('/', listCourses);
router.get('/:slug/outline', getOutline);
router.get('/:slug/preview/:lessonId', getPreviewLesson);
router.get('/:slug', getCourse);

module.exports = router;