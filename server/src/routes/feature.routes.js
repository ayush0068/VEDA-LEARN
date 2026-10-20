const { Router } = require('express');
const { listFeatures } = require('../controllers/feature.controller');

const router = Router();

router.get('/', listFeatures);

module.exports = router;