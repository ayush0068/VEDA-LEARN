const { Router } = require('express');
const controller = require('../../controllers/adminTeam.controller');

const router = Router();

// (the whole router is behind requireSuper, see routes/admin/index.js)
// fixed paths first, so "options" / "overview" / "activity" are never read as an :id
router.get('/options', controller.options);
router.get('/overview', controller.overview);
router.get('/activity', controller.activity);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.details);
router.patch('/:id', controller.update);
router.post('/:id/reset-password', controller.resetPassword);
router.post('/:id/email-credentials', controller.emailCredentials);
router.post('/:id/sign-out', controller.signOut);
router.delete('/:id', controller.remove);

module.exports = router;