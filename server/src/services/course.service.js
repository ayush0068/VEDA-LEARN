const { COURSE_SEEDS } = require('../data/courses.seed');
const Course = require('../models/Course');

// Insert any missing seed items. Existing documents (e.g. edited later via admin) are never overwritten.
const seedCourses = async () => {
  const result = await Course.bulkWrite(
    COURSE_SEEDS.map((item) => ({
      updateOne: {
        filter: { slug: item.slug },
        update: { $setOnInsert: { ...item, isActive: true } },
        upsert: true,
      },
    })),
  );
  return result.upsertedCount;
};

const seedCoursesIfEmpty = async () => {
  if ((await Course.estimatedDocumentCount()) > 0) return 0;
  return seedCourses();
};

/**
 * @param {{ category?: string, popular?: boolean, limit?: number }} options
 */
const getActiveCourses = ({ category, popular, limit = 12 } = {}) => {
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (popular) filter.isPopular = true;

  return Course.find(filter)
    .sort({ order: 1 })
    .limit(limit)
    .select('slug title category image icon rating studentsCount price originalPrice badge order -_id')
    .lean();
};

module.exports = { seedCourses, seedCoursesIfEmpty, getActiveCourses };