const { COURSE_SEEDS } = require('../data/courses.seed');
const Course = require('../models/Course');

// Fields that older databases (homepage-only courses) don't have yet.
const CATALOG_FIELDS = ['category', 'image', 'description', 'weeks', 'lessons', 'level', 'language', 'order'];
// "Old" course = no description yet (created before the Explore Courses page existed)
const MISSING_DESCRIPTION = { $in: [null, ''] };

const pickFields = (item, fields) => Object.fromEntries(fields.map((key) => [key, item[key]]));

/**
 * Insert any missing seed course. Existing documents are never overwritten (e.g. edited later via admin),
 * except old homepage-only courses that have no description yet: they only get the new Explore-page
 * fields (category, description, weeks, lessons, level, language, order, image). Price / rating /
 * badge / popularity are left alone.
 */
const seedCourses = async () => {
  const result = await Course.bulkWrite(
    COURSE_SEEDS.flatMap((item) => [
      {
        updateOne: {
          filter: { slug: item.slug },
          update: { $setOnInsert: { ...item, isActive: true } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { slug: item.slug, description: MISSING_DESCRIPTION },
          update: { $set: pickFields(item, CATALOG_FIELDS) },
        },
      },
    ]),
    { ordered: true },
  );
  return result.upsertedCount;
};

const seedCoursesIfEmpty = async () => {
  if ((await Course.estimatedDocumentCount()) > 0) return 0;
  return seedCourses();
};

// Startup helper: seed an empty collection, and also upgrade a database that still holds the old
// 4 homepage courses (so the Explore page works without running `npm run seed` by hand).
const seedCoursesIfNeeded = async () => {
  if ((await Course.estimatedDocumentCount()) === 0) return seedCourses();
  const hasOldCourses = await Course.exists({
    slug: { $in: COURSE_SEEDS.map((c) => c.slug) },
    description: MISSING_DESCRIPTION,
  });
  return hasOldCourses ? seedCourses() : 0;
};

// ---------------------------------------------------------------------------------------------
// Querying (same rules as the filters on the Explore Courses page)
// ---------------------------------------------------------------------------------------------

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DURATION_FILTERS = {
  short: { $lte: 8 },
  medium: { $gte: 9, $lte: 12 },
  long: { $gte: 13 },
};

const PRICE_FILTERS = {
  low: { $lt: 1500 },
  mid: { $gte: 1500, $lte: 2500 },
  high: { $gt: 2500 },
};

const SORTS = {
  popular: { order: 1, _id: 1 },
  rating: { rating: -1, studentsCount: -1, order: 1 },
  newest: { createdAt: -1, order: 1 },
  'price-asc': { price: 1, order: 1 },
  'price-desc': { price: -1, order: 1 },
};

const buildCourseFilter = ({ category, popular, q, level, language, duration, price } = {}) => {
  const filter = { isActive: true };
  const and = [];

  if (category) filter.category = category;
  if (popular) filter.isPopular = true;
  if (level && Course.LEVELS.includes(level)) filter.level = level;
  if (price && PRICE_FILTERS[price]) filter.price = PRICE_FILTERS[price];

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    and.push({ $or: [{ title: regex }, { description: regex }] });
  }
  // courses without a language / duration are never hidden by those filters
  if (language) and.push({ $or: [{ language: null }, { language: '' }, { language }] });
  if (duration && DURATION_FILTERS[duration]) {
    and.push({ $or: [{ weeks: null }, { weeks: DURATION_FILTERS[duration] }] });
  }

  if (and.length > 0) filter.$and = and;
  return filter;
};

/**
 * @param {{
 *   category?: string, popular?: boolean, q?: string, level?: string, language?: string,
 *   duration?: 'short'|'medium'|'long', price?: 'low'|'mid'|'high',
 *   sort?: 'popular'|'rating'|'newest'|'price-asc'|'price-desc',
 *   page?: number, limit?: number
 * }} options
 * @returns {Promise<{ items: object[], total?: number, page?: number, pages?: number }>}
 *   total / page / pages are only returned when `page` is given.
 */
const getActiveCourses = async ({ sort = 'popular', page, limit = 50, ...filters } = {}) => {
  const query = Course.find(buildCourseFilter(filters))
    .sort(SORTS[sort] || SORTS.popular)
    .select(
      'slug title category image icon description weeks lessons level language rating studentsCount price originalPrice badge order createdAt -_id',
    );

  if (!page) {
    return { items: await query.limit(limit).lean() };
  }

  const [items, total] = await Promise.all([
    query.skip((page - 1) * limit).limit(limit).lean(),
    Course.countDocuments(buildCourseFilter(filters)),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
};

module.exports = {
  seedCourses,
  seedCoursesIfEmpty,
  seedCoursesIfNeeded,
  getActiveCourses,
  buildCourseFilter,
  SORTS,
};