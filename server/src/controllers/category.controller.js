const { getDbState } = require('../config/db');
const { getActiveCategories } = require('../services/category.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/categories
const listCategories = asyncHandler(async (_req, res) => {
  // Fail fast instead of letting mongoose buffer for 10s when the DB is down.
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');

  const categories = await getActiveCategories();

  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, count: categories.length, data: categories });
});

module.exports = { listCategories };