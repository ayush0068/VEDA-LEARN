const { Router } = require('express');
const { getCourse, listCourses } = require('../controllers/course.controller');

const router = Router();

router.get('/', listCourses);
router.get('/:slug', getCourse);

module.exports = router;