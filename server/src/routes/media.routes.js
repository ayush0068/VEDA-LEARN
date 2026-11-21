const { Router } = require('express');
const { serve } = require('../controllers/media.controller');

const router = Router();

router.get('/:id', serve);

module.exports = router;