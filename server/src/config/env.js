
const path = require('path');
const dotenv = require('dotenv');

// Loads server/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const toBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(
    String(value).toLowerCase()
  );
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

// JWT signing secret
const DEV_JWT_SECRET = 'vedalearn-dev-only-secret-change-me';
const jwtSecret =
  process.env.JWT_SECRET || (isProduction ? '' : DEV_JWT_SECRET);

if (isProduction && jwtSecret.length < 32) {
  throw new Error(
    'JWT_SECRET must be set to a random string of 32+ characters in production'
  );
}

if (!process.env.JWT_SECRET) {
  console.warn(
    '[env] JWT_SECRET is not set in server/.env - using an insecure development secret.'
  );
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number.isFinite(port) && port > 0 ? port : 5000,

  mongoUri:
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/vedalearn',

  mongoRequired: toBool(process.env.MONGODB_REQUIRED, false),

  // Auto-seed homepage content outside production by default
  autoSeed: toBool(process.env.AUTO_SEED, !isProduction),

  clientUrls: toList(process.env.CLIENT_URLS, [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]),

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRememberExpiresIn:
    process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
};

module.exports = { env };
