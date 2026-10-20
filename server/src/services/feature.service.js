const { FEATURE_SEEDS } = require('../data/features.seed');
const Feature = require('../models/Feature');

// Insert any missing seed items. Existing documents (e.g. edited later via admin) are never overwritten.
const seedFeatures = async () => {
  const result = await Feature.bulkWrite(
    FEATURE_SEEDS.map((item) => ({
      updateOne: {
        filter: { key: item.key },
        update: { $setOnInsert: { ...item, isActive: true } },
        upsert: true,
      },
    })),
  );
  return result.upsertedCount;
};

// Seed only when the collection is empty (used for auto-seed on startup).
const seedFeaturesIfEmpty = async () => {
  if ((await Feature.estimatedDocumentCount()) > 0) return 0;
  return seedFeatures();
};

const getActiveFeatures = () =>
  Feature.find({ isActive: true })
    .sort({ order: 1 })
    .select('key title description icon order -_id')
    .lean();

module.exports = { seedFeatures, seedFeaturesIfEmpty, getActiveFeatures };