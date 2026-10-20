const { getDbState } = require('../config/db');
const { getActiveCourses } = require('../services/course.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/courses?popular=true&category=vastu-shastra&limit=4
const listCourses = asyncHandler(async (req, res) => {
  // Fail fast instead of letting mongoose buffer for 10s when the DB is down.
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');

  const { category, popular, limit } = req.query;

  const parsedLimit = Number.parseInt(limit, 10);
  const courses = await getActiveCourses({
    // only plain strings are accepted (blocks query-operator injection like ?category[$ne]=x)
    category: typeof category === 'string' && category.trim() ? category.trim().toLowerCase() : undefined,
    popular: popular === 'true',
    limit: Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 12,
  });

  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, count: courses.length, data: courses });
});

module.exports = { listCourses };