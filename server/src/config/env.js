const path = require('path');
const dotenv = require('dotenv');

// Loads server/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const toBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const toList = (value, fallback) => {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const port = Number(process.env.PORT);
const isProduction = process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number.isFinite(port) && port > 0 ? port : 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vedalearn',
  mongoRequired: toBool(process.env.MONGODB_REQUIRED, false),
  // insert default homepage content on startup when the collection is empty (on by default outside production)
  autoSeed: toBool(process.env.AUTO_SEED, !isProduction),
  clientUrls: toList(process.env.CLIENT_URLS, [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]),
};

module.exports = { env };