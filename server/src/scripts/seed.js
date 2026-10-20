const { connectDB, disconnectDB, getDbState } = require('../config/db');
const { seedAll } = require('../services/seed.service');

// Usage: npm run seed
const run = async () => {
  await connectDB();
  if (getDbState() !== 'connected') {
    console.error('[seed] Database not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }
  const result = await seedAll();
  Object.entries(result).forEach(([name, count]) =>
    console.log(`[seed] ${name}: ${count} inserted (existing ones left untouched)`),
  );
  await disconnectDB();
};

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});