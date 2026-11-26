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
  // where admins sign in (the admin panel). Used in the e-mail that gives a new admin their login. Empty = the public site address.
  publicAdminUrl: (process.env.PUBLIC_ADMIN_URL || '').trim().replace(/\/+$/, ''),

  // Optional SMTP settings. Without them the admin panel falls back to the admin's own mail app (mailto:).
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },

  // New uploads from the admin panel are stored inside MongoDB (GridFS) and served at /api/media/<id>.
  // This folder only holds OLD uploads (served at /uploads) and the temporary pieces of a class recording while it is
  // running. Move old files into MongoDB with:  npm run migrate-uploads
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  // Public address of this API, used to build links to uploaded files. Leave empty to detect it from the request.
  publicApiUrl: (process.env.PUBLIC_API_URL || '').replace(/\/+$/, ''),

  // ---- Live classes (WebRTC) ----
  live: {
    // hard ceiling for "Max students" of one class (browser-to-browser video, see services/liveClass.service.js)
    maxStudentsLimit: Math.max(1, Number(process.env.LIVE_MAX_STUDENTS_LIMIT) || 100),
    defaultMaxStudents: Math.max(1, Number(process.env.LIVE_DEFAULT_MAX_STUDENTS) || 30),
    // STUN / TURN servers handed to the browsers. Add a TURN server for students behind strict firewalls / mobile networks:
    //   TURN_URL=turn:turn.example.com:3478  TURN_USERNAME=...  TURN_CREDENTIAL=...      (or ICE_SERVERS='[{"urls":"..."}]')
    iceServers: (() => {
      if (process.env.ICE_SERVERS) {
        try {
          const parsed = JSON.parse(process.env.ICE_SERVERS);
          if (Array.isArray(parsed) && parsed.length) return parsed;
        } catch {
          console.warn('[env] ICE_SERVERS is not valid JSON - using the default STUN servers.');
        }
      }
      const list = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
      if (process.env.TURN_URL) {
        list.push({ urls: toList(process.env.TURN_URL, []), username: process.env.TURN_USERNAME || '', credential: process.env.TURN_CREDENTIAL || '' });
      } else {
        // No TURN server configured: video / audio only works when both people are on the same network (e.g. localhost).
        // Public relay of metered.ca (for testing, shared and rate-limited). For a real site add your own TURN_* variables.
        console.warn('[env] TURN_URL is not set - live class video/audio will fail for many students on the internet. Using the shared test relay.');
        list.push({
          urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp', 'turns:openrelay.metered.ca:443?transport=tcp'],
          username: 'openrelayproject',
          credential: 'openrelayproject',
        });
      }
      return list;
    })(),
  },

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRememberExpiresIn:
    process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
};

module.exports = { env };