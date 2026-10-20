const { seedCategories, seedCategoriesIfEmpty } = require('./category.service');
const { seedCourses, seedCoursesIfEmpty } = require('./course.service');
const { seedFeatures, seedFeaturesIfEmpty } = require('./feature.service');

// One place that seeds every collection. Add new seeders here as sections are built.
const seedAll = async () => ({
  features: await seedFeatures(),
  categories: await seedCategories(),
  courses: await seedCourses(),
});

const seedAllIfEmpty = async () => ({
  features: await seedFeaturesIfEmpty(),
  categories: await seedCategoriesIfEmpty(),
  courses: await seedCoursesIfEmpty(),
});

module.exports = { seedAll, seedAllIfEmpty };