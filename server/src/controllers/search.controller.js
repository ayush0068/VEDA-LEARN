const { getDbState } = require('../config/db');
const { searchCourses, getSearchOverview } = require('../services/search.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// only plain strings are accepted (blocks query-operator injection like ?q[$ne]=x)
const str = (value, maxLength = 80) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined;

// GET /api/search            -> { trending: string[], suggested: Course[] }   (search box opened, nothing typed yet)
// GET /api/search?q=gita     -> { query, total, results: Course[] }           (live search, public - no login needed)
const search = asyncHandler(async (req, res) => {
  // Fail fast instead of letting mongoose buffer for 10s when the DB is down.
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');

  const q = str(req.query.q);

  if (!q) {
    const data = await getSearchOverview();
    res.set('Cache-Control', 'public, max-age=120');
    return res.json({ success: true, data });
  }

  const { items, total } = await searchCourses(q, 8);
  res.set('Cache-Control', 'public, max-age=30');
  return res.json({ success: true, data: { query: q, total, results: items } });
});

module.exports = { search };