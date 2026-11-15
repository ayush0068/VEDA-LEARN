const { Router } = require('express');
const { listMine, getOne, listPublic, getPublic } = require('../controllers/live.controller');
const { protect } = require('../middleware/auth');

const router = Router();

// open to everybody (before protect): the website's Live Classes page and class details
router.get('/public', listPublic);
router.get('/public/:id', getPublic);

router.use(protect);
router.get('/', listMine);
router.get('/:id', getOne);

module.exports = router;