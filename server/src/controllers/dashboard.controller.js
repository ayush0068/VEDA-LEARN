const { getDashboard } = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/dashboard  (signed-in student) -> stats, enrolled courses, recommendations, assignments, recent activity
const getStudentDashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user);
  res.set('Cache-Control', 'no-store'); // private, always fresh
  res.json({ success: true, data });
});

module.exports = { getStudentDashboard };