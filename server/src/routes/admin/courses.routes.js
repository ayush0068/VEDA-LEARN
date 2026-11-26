const { Router } = require('express');
const controller = require('../../controllers/adminCourse.controller');

const router = Router();

// fixed paths first, so "options" is never read as a :slug
// (file uploads, POST /upload/:kind, are wired in routes/admin/index.js because Lessons use them too)
router.get('/options', controller.options);

router.get('/', controller.listAll);
router.post('/', controller.create);
router.get('/:slug', controller.details);
router.patch('/:slug', controller.update);
router.delete('/:slug', controller.remove);

module.exports = router;