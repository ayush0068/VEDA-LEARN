const { Router } = require('express');
const { listMine, getOne } = require('../controllers/live.controller');
const { protect } = require('../middleware/auth');

const router = Router();

router.use(protect);
router.get('/', listMine);
router.get('/:id', getOne);

module.exports = router;