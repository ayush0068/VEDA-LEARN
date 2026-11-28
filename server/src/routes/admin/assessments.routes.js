const { Router } = require('express');
const c = require('../../controllers/adminAssessment.controller');

const router = Router();

router.get('/courses', c.courses);
router.get('/overview', c.overview);

// quizzes
router.get('/quizzes', c.listQuizzes);
router.post('/quizzes', c.createQuiz);
router.get('/quizzes/:id', c.getQuiz);
router.patch('/quizzes/:id', c.updateQuiz);
router.delete('/quizzes/:id', c.deleteQuiz);
router.post('/quizzes/:id/duplicate', c.duplicateQuiz);
router.get('/quizzes/:id/analytics', c.quizAnalytics);

// assignments + grading
router.get('/assignments', c.listAssignments);
router.post('/assignments', c.createAssignment);
router.get('/assignments/:id', c.getAssignment);
router.patch('/assignments/:id', c.updateAssignment);
router.delete('/assignments/:id', c.deleteAssignment);
router.post('/assignments/:id/duplicate', c.duplicateAssignment);
router.get('/assignments/:id/submissions', c.submissions);
router.patch('/submissions/:id', c.grade);

module.exports = router;