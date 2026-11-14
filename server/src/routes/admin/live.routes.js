const { Router } = require('express');
const controller = require('../../controllers/adminLive.controller');

const router = Router();

router.get('/options', controller.options);
router.get('/', controller.listAll);
router.post('/', controller.create);
router.get('/:id', controller.details);
router.patch('/:id', controller.update);
router.post('/:id/cancel', controller.cancel);
router.delete('/:id', controller.remove);

// recording (sent by the host's browser while the class runs)
router.post('/:id/recording/start', controller.startRecording);
router.post('/:id/recording/:rid/chunk', controller.recordingChunk);
router.post('/:id/recording/:rid/finish', controller.finishRecording);
router.delete('/:id/recording', controller.deleteRecording);

module.exports = router;