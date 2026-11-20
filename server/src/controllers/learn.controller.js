const { getDbState } = require('../config/db');
const service = require('../services/learning.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const send = (res, data) => {
  res.set('Cache-Control', 'no-store'); // private, always fresh
  res.json({ success: true, data });
};

const assertDb = () => {
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
};

// GET /api/learn/courses/:slug
const course = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getCourseLearning(req.user, req.params.slug));
});

// GET /api/learn/lessons/:id
const lesson = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getLesson(req.user, req.params.id));
});

// POST /api/learn/lessons/:id/complete   body: { done: true | false }
const complete = asyncHandler(async (req, res) => {
  assertDb();
  const done = req.body && typeof req.body === 'object' ? req.body.done : undefined;
  if (typeof done !== 'boolean') throw new ApiError(400, 'done must be true or false');
  send(res, await service.setCompleted(req.user, req.params.id, done));
});

module.exports = { course, lesson, complete };