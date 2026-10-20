const { Router } = require('express');
const { listCourses } = require('../controllers/course.controller');

const router = Router();

router.get('/', listCourses);

module.exports = router;