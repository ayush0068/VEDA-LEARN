const service = require('../services/profile.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const GENDERS = ['', 'male', 'female', 'other', 'prefer-not-to-say'];
const AVATAR_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const AVATAR_MAX_CHARS = 400_000; // ~300 KB (the browser sends a 256px picture, usually 20-40 KB)

// only plain strings / booleans are accepted (blocks operator injection like { "email": { "$ne": "" } })
const asString = (value) => (typeof value === 'string' ? value : '');
const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});
const has = (body, key) => Object.prototype.hasOwnProperty.call(body, key);

const send = (res, data, message) => {
  res.set('Cache-Control', 'no-store'); // private, always fresh
  res.json({ success: true, ...(message ? { message } : {}), data });
};

const parseDate = (value) => {
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return real ? date : null;
};

// 8+ characters, at least one letter and one number (bcrypt only uses the first 72 bytes)
const assertStrongPassword = (password) => {
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  if (Buffer.byteLength(password, 'utf8') > 72) throw new ApiError(400, 'Password is too long (max 72 characters)');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError(400, 'Password must contain at least one letter and one number');
  }
};

/** Validates only the fields that were sent, returns the cleaned values. */
const cleanProfileFields = (body) => {
  const out = {};

  if (has(body, 'name')) {
    const name = asString(body.name).trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 60) throw new ApiError(400, 'Please enter your full name (2-60 characters)');
    out.name = name;
  }

  if (has(body, 'phone')) {
    const phone = asString(body.phone).trim();
    const digits = phone.replace(/\D/g, '').length;
    if (phone && (!PHONE_RE.test(phone) || digits < 7 || digits > 15)) throw new ApiError(400, 'Please enter a valid phone number');
    out.phone = phone;
  }

  if (has(body, 'dateOfBirth')) {
    const raw = asString(body.dateOfBirth).trim();
    if (!raw) {
      out.dateOfBirth = undefined; // clears it
    } else {
      const date = parseDate(raw);
      if (!date || date > new Date() || date.getUTCFullYear() < 1900) throw new ApiError(400, 'Please enter a valid date of birth');
      out.dateOfBirth = date;
    }
  }

  if (has(body, 'gender')) {
    const gender = asString(body.gender).trim().toLowerCase();
    if (!GENDERS.includes(gender)) throw new ApiError(400, 'Please choose a valid gender option');
    out.gender = gender;
  }

  if (has(body, 'location')) {
    const location = asString(body.location).trim().replace(/\s+/g, ' ');
    if (location.length > 100) throw new ApiError(400, 'Location is too long (max 100 characters)');
    out.location = location;
  }

  if (has(body, 'bio')) {
    const bio = asString(body.bio).trim();
    if (bio.length > 300) throw new ApiError(400, 'Bio is too long (max 300 characters)');
    out.bio = bio;
  }

  return out;
};

/** Keeps only the allowed keys, and only real booleans. */
const cleanToggles = (body, keys) => {
  const out = {};
  keys.forEach((key) => {
    if (has(body, key)) {
      if (typeof body[key] !== 'boolean') throw new ApiError(400, 'Invalid setting value');
      out[key] = body[key];
    }
  });
  if (!Object.keys(out).length) throw new ApiError(400, 'Nothing to update');
  return out;
};

// GET /api/profile
const getProfile = asyncHandler(async (req, res) => {
  send(res, { profile: await service.getProfile(req.user) });
});

// PATCH /api/profile   body: any of { name, phone, dateOfBirth, gender, location, bio }
const updateProfile = asyncHandler(async (req, res) => {
  const fields = cleanProfileFields(bodyOf(req));
  if (!Object.keys(fields).length) throw new ApiError(400, 'Nothing to update');
  send(res, { profile: await service.updateProfile(req.user, fields) }, 'Profile updated');
});

// PUT /api/profile/avatar   body: { image: "data:image/jpeg;base64,..." }
const updateAvatar = asyncHandler(async (req, res) => {
  const image = asString(bodyOf(req).image);
  if (!AVATAR_RE.test(image)) throw new ApiError(400, 'Please upload a PNG, JPG or WebP picture');
  if (image.length > AVATAR_MAX_CHARS) throw new ApiError(413, 'This picture is too large. Please choose a smaller one.');
  send(res, await service.setAvatar(req.user, image), 'Profile photo updated');
});

// DELETE /api/profile/avatar
const removeAvatar = asyncHandler(async (req, res) => {
  send(res, await service.setAvatar(req.user, ''), 'Profile photo removed');
});

// PATCH /api/profile/email   body: { email, password }
const updateEmail = asyncHandler(async (req, res) => {
  const body = bodyOf(req);
  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');
  if (!password) throw new ApiError(400, 'Please enter your current password to confirm');
  if (password.length > 200) throw new ApiError(400, 'Your current password is not correct');

  send(res, await service.changeEmail(req.user, { email, password }), 'Email updated');
});

// PATCH /api/profile/password   body: { currentPassword, newPassword, remember? }
const updatePassword = asyncHandler(async (req, res) => {
  const body = bodyOf(req);
  const currentPassword = asString(body.currentPassword);
  const newPassword = asString(body.newPassword);

  if (!currentPassword) throw new ApiError(400, 'Please enter your current password');
  if (currentPassword.length > 200) throw new ApiError(400, 'Your current password is not correct');
  assertStrongPassword(newPassword);

  const result = await service.changePassword(req.user, { currentPassword, newPassword, remember: body.remember === true });
  send(res, result, 'Password changed successfully');
});

// PATCH /api/profile/notifications   body: any of { liveClasses, courseUpdates, assignments, offers, emailNotifications }
const updateNotifications = asyncHandler(async (req, res) => {
  const values = cleanToggles(bodyOf(req), service.NOTIFICATION_KEYS);
  send(res, { notifications: await service.updateNotifications(req.user, values) }, 'Notification preferences saved');
});

// PATCH /api/profile/privacy   body: any of { profileVisible, showEmail, showProgress }
const updatePrivacy = asyncHandler(async (req, res) => {
  const values = cleanToggles(bodyOf(req), service.PRIVACY_KEYS);
  send(res, { privacy: await service.updatePrivacy(req.user, values) }, 'Privacy settings saved');
});

// PATCH /api/profile/preferences   body: { searchSide: 'left' | 'right' }
const updatePreferences = asyncHandler(async (req, res) => {
  const searchSide = asString(bodyOf(req).searchSide);
  if (searchSide !== 'left' && searchSide !== 'right') throw new ApiError(400, 'Please choose left or right');
  send(res, await service.updateSearchSide(req.user, searchSide), 'Preference saved');
});

// GET /api/profile/orders
const getOrders = asyncHandler(async (req, res) => {
  send(res, { orders: await service.listOrders(req.user) });
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  removeAvatar,
  updateEmail,
  updatePassword,
  updateNotifications,
  updatePrivacy,
  updatePreferences,
  getOrders,
};