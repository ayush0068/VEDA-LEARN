const { Router } = require('express');
const c = require('../controllers/assessment.controller');
const { protect } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = Router();

router.use(createRateLimiter({ windowMs: 60 * 1000, max: 300, message: 'Too many requests. Please slow down.' }));
router.use(protect);

router.get('/', c.hub);

router.get('/quizzes/:id', c.quiz);
router.post('/quizzes/:id/start', c.start);
router.get('/attempts/:id', c.attempt);
router.put('/attempts/:id/answer', c.answer);
router.post('/attempts/:id/submit', c.submit);

router.get('/assignments/:id', c.assignment);
router.post('/assignments/:id/submit', createRateLimiter({ windowMs: 60 * 1000, max: 20, message: 'Too many hand-ins. Please wait a moment.' }), c.handIn);

router.post('/upload', createRateLimiter({ windowMs: 10 * 60 * 1000, max: 40, message: 'Too many uploads. Please wait a few minutes.' }), c.upload);

module.exports = router;