const { getDbState } = require('../config/db');
const { loginUser, registerUser, toPublicUser } = require('../services/auth.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// only plain strings are accepted (blocks operator injection like { "email": { "$ne": "" } })
const asString = (value) => (typeof value === 'string' ? value : '');
const bodyOf = (req) => (req.body && typeof req.body === 'object' ? req.body : {});

const cleanEmail = (value) => asString(value).trim().toLowerCase();

const assertEmail = (email) => {
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address');
  }
};

// 8+ characters, at least one letter and one number (bcrypt only uses the first 72 bytes)
const assertStrongPassword = (password) => {
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  if (Buffer.byteLength(password, 'utf8') > 72) throw new ApiError(400, 'Password is too long (max 72 characters)');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError(400, 'Password must contain at least one letter and one number');
  }
};

const assertDb = () => {
  // Fail fast instead of letting mongoose buffer for 10s when the DB is down.
  if (getDbState() !== 'connected') {
    throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');
  }
};

// POST /api/auth/register   body: { name, email, password }
const register = asyncHandler(async (req, res) => {
  const body = bodyOf(req);
  const name = asString(body.name).trim().replace(/\s+/g, ' ');
  const email = cleanEmail(body.email);
  const password = asString(body.password);

  if (name.length < 2 || name.length > 60) throw new ApiError(400, 'Please enter your full name (2-60 characters)');
  assertEmail(email);
  assertStrongPassword(password);
  assertDb();

  const { user, token } = await registerUser({ name, email, password });

  res.set('Cache-Control', 'no-store');
  res.status(201).json({ success: true, message: 'Account created successfully', data: { user, token } });
});

// POST /api/auth/login   body: { email, password, remember? }
const login = asyncHandler(async (req, res) => {
  const body = bodyOf(req);
  const email = cleanEmail(body.email);
  const password = asString(body.password);

  assertEmail(email);
  if (!password) throw new ApiError(400, 'Please enter your password');
  if (password.length > 200) throw new ApiError(401, 'Invalid email or password');
  assertDb();

  const { user, token } = await loginUser({ email, password, remember: body.remember === true });

  res.set('Cache-Control', 'no-store');
  res.json({ success: true, message: 'Signed in successfully', data: { user, token } });
});

// GET /api/auth/me   (Authorization: Bearer <token>)
const me = (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: { user: toPublicUser(req.user) } });
};

module.exports = { register, login, me };