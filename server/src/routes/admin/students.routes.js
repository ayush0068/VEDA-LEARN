const { Router } = require('express');
const controller = require('../../controllers/adminStudent.controller');

const router = Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.details);
router.patch('/:id', controller.update);
router.post('/:id/reset-password', controller.resetPassword);
router.post('/:id/email-credentials', controller.emailCredentials);
router.delete('/:id', controller.remove);

module.exports = router;