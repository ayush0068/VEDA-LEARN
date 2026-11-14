const service = require('../services/liveClass.service');
const asyncHandler = require('../utils/asyncHandler');

const send = (res, data) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data });
};

// GET /api/live-classes   -> classes the signed-in student can see (live, upcoming, recent recordings)
const listMine = asyncHandler(async (req, res) => send(res, await service.listForStudent(req.user)));

// GET /api/live-classes/:id
const getOne = asyncHandler(async (req, res) => send(res, await service.getForStudent(req.user, String(req.params.id))));

module.exports = { listMine, getOne };