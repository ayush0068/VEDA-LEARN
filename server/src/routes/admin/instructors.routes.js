const { Router } = require('express');
const controller = require('../../controllers/adminInstructor.controller');

const router = Router();

// fixed paths first, so "options" / "schedule" are never read as an :id
router.get('/options', controller.options);
router.get('/schedule', controller.scheduleOverview);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.details);
router.patch('/:id', controller.update);
router.post('/:id/reset-password', controller.resetPassword);
router.post('/:id/email-credentials', controller.emailCredentials);
router.delete('/:id', controller.remove);

module.exports = router;