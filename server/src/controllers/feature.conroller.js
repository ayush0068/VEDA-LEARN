const { getDbState } = require('../config/db');
const { getActiveFeatures } = require('../services/feature.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/features
const listFeatures = asyncHandler(async (_req, res) => {
  // Fail fast instead of letting mongoose buffer for 10s when the DB is down.
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');

  const features = await getActiveFeatures();

  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, count: features.length, data: features });
});

module.exports = { listFeatures };