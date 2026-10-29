const { getDbState } = require('../config/db');
const { getActiveCourses } = require('../services/course.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// only plain strings are accepted (blocks query-operator injection like ?category[$ne]=x)
const str = (value, maxLength = 100) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined;

const toInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
};

// GET /api/courses
//   ?popular=true&category=vastu-shastra&limit=4                        (homepage / simple lists)
//   ?q=gita&level=Beginner&language=Hindi&duration=short&price=low       (Explore Courses filters)
//   &sort=popular|rating|newest|price-asc|price-desc&page=1&limit=8     (optional pagination)
// With no params it returns every active course (up to 50), sorted by `order`.
const listCourses = asyncHandler(async (req, res) => {
  // Fail fast instead of letting mongoose buffer for 10s when the DB is down.
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');

  const { category, popular, q, level, language, duration, price, sort, page, limit } = req.query;

  const parsedPage = toInt(page);
  const parsedLimit = toInt(limit);
  const safePage = parsedPage && parsedPage > 0 ? Math.min(parsedPage, 1000) : undefined;
  const defaultLimit = safePage ? 8 : 50;

  const { items, total, page: currentPage, pages } = await getActiveCourses({
    category: str(category)?.toLowerCase(),
    popular: popular === 'true',
    q: str(q),
    level: str(level),
    language: str(language),
    duration: str(duration),
    price: str(price),
    sort: str(sort),
    page: safePage,
    limit: parsedLimit ? Math.min(Math.max(parsedLimit, 1), 50) : defaultLimit,
  });

  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    success: true,
    count: items.length,
    ...(total !== undefined ? { total, page: currentPage, pages } : {}),
    data: items,
  });
});

module.exports = { listCourses };