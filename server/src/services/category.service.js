const { CATEGORY_SEEDS } = require('../data/categories.seed');
const Category = require('../models/Category');

// Insert any missing seed items. Existing documents (e.g. edited later via admin) are never overwritten.
const seedCategories = async () => {
  const result = await Category.bulkWrite(
    CATEGORY_SEEDS.map((item) => ({
      updateOne: {
        filter: { slug: item.slug },
        update: { $setOnInsert: { ...item, isActive: true } },
        upsert: true,
      },
    })),
  );
  return result.upsertedCount;
};

const seedCategoriesIfEmpty = async () => {
  if ((await Category.estimatedDocumentCount()) > 0) return 0;
  return seedCategories();
};

const getActiveCategories = () =>
  Category.find({ isActive: true })
    .sort({ order: 1 })
    .select('slug name description image icon order -_id')
    .lean();

module.exports = { seedCategories, seedCategoriesIfEmpty, getActiveCategories };