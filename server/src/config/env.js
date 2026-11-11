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

  // First dashboard visit of a student with no learning data: fill it with sample courses / activity so the
  // page is not empty. ON outside production by default; set DEMO_DASHBOARD=false to start students empty.
  demoDashboard: toBool(process.env.DEMO_DASHBOARD, !isProduction),

  // Where students sign in (used in the credentials e-mail). Defaults to the first allowed frontend.
  publicSiteUrl: (process.env.PUBLIC_SITE_URL || toList(process.env.CLIENT_URLS, ['http://localhost:5173'])[0]).replace(/\/+$/, ''),

  // Optional SMTP settings. Without them the admin panel falls back to the admin's own mail app (mailto:).
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRememberExpiresIn:
    process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
};

module.exports = { env };