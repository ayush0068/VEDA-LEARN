const { Router } = require('express');
const controller = require('../../controllers/adminCourse.controller');
const { upload } = require('../../controllers/adminUpload.controller');

const router = Router();

// fixed paths first, so "options" / "upload" are never read as a :slug
router.get('/options', controller.options);
router.post('/upload/:kind', upload);

router.get('/', controller.listAll);
router.post('/', controller.create);
router.get('/:slug', controller.details);
router.patch('/:slug', controller.update);
router.delete('/:slug', controller.remove);

module.exports = router;