const { seedCategories, seedCategoriesIfEmpty } = require('./category.service');
const { seedCourses, seedCoursesIfNeeded } = require('./course.service');
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
  // also upgrades the old 4 homepage courses with the Explore-page fields (see course.service.js)
  courses: await seedCoursesIfNeeded(),
});

module.exports = { seedAll, seedAllIfEmpty };