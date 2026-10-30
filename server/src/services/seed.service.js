const { seedCategories, seedCategoriesIfEmpty } = require('./category.service');
const { seedCoupons, seedCouponsIfEmpty } = require('./coupon.service');
const { seedCourses, seedCoursesIfNeeded } = require('./course.service');
const { seedFeatures, seedFeaturesIfEmpty } = require('./feature.service');

// One place that seeds every collection. Add new seeders here as sections are built.
const seedAll = async () => ({
  features: await seedFeatures(),
  categories: await seedCategories(),
  courses: await seedCourses(),
  coupons: await seedCoupons(),
});

const seedAllIfEmpty = async () => ({
  features: await seedFeaturesIfEmpty(),
  categories: await seedCategoriesIfEmpty(),
  // also upgrades older courses with the newer fields (see course.service.js)
  courses: await seedCoursesIfNeeded(),
  coupons: await seedCouponsIfEmpty(),
});

module.exports = { seedAll, seedAllIfEmpty };