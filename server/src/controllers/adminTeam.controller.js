const { getDbState } = require('../config/db');
const { MODULE_KEYS, PRESETS, PRESET_VALUES, presetFor } = require('../config/adminAccess');
const service = require('../services/adminTeam.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LEVEL_VALUES = ['none', 'view', 'edit', 'full'];

// only plain strings are accepted (blocks query-operator injection)
const asString = (value) => (typeof value === 'string' ? value : '');
const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

const assertDb = () => {
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
};

const send = (res, data, status = 200) => {
  res.set('Cache-Control', 'no-store');
  res.status(status).json({ success: true, data });
};

// ---- cleaners ----
const cleanName = (value) => {
  const name = asString(value).trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 60) throw new ApiError(400, 'Please enter the full name (2-60 characters)');
  return name;
};

const cleanEmail = (value) => {
  const email = asString(value).trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');
  return email;
};

const cleanPhone = (value) => {
  const phone = asString(value).trim();
  if (phone && !PHONE_RE.test(phone)) throw new ApiError(400, 'Please enter a valid phone number');
  return phone;
};

const cleanTitle = (value) => {
  const title = asString(value).trim().replace(/\s+/g, ' ');
  if (title.length > 60) throw new ApiError(400, 'The role name can be at most 60 characters');
  return title;
};

const cleanPreset = (value) => {
  const preset = asString(value);
  if (!PRESET_VALUES.includes(preset)) throw new ApiError(400, 'Please choose a valid role');
  return preset;
};

const cleanPermissions = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Permissions must be an object');
  const out = {};
  MODULE_KEYS.forEach((key) => {
    const level = value[key] === undefined ? 'none' : value[key];
    if (!LEVEL_VALUES.includes(level)) throw new ApiError(400, 'Unknown access level');
    out[key] = level;
  });
  if (!MODULE_KEYS.some((key) => out[key] !== 'none')) throw new ApiError(400, 'Give this admin access to at least one section (or suspend the account instead)');
  return out;
};

const cleanId = (value) => {
  const id = asString(value);
  return /^[a-f0-9]{24}$/i.test(id) ? id : '';
};

const cleanDay = (value) => {
  const day = asString(value);
  return DATE_RE.test(day) && !Number.isNaN(new Date(`${day}T00:00:00Z`).getTime()) ? day : '';
};

// ---- handlers ----
// GET /api/admin/team/options
const options = asyncHandler(async (_req, res) => {
  assertDb();
  send(res, service.getOptions());
});

// GET /api/admin/team/overview   -> numbers, 14-day chart, most active, things that need attention
const overview = asyncHandler(async (_req, res) => {
  assertDb();
  send(res, await service.overview());
});

// GET /api/admin/team?q=&status=&preset=&sort=
const list = asyncHandler(async (req, res) => {
  assertDb();
  const preset = asString(req.query.preset);
  send(res, {
    admins: await service.listTeam({
      q: asString(req.query.q).trim().slice(0, 80),
      status: asString(req.query.status),
      preset: PRESET_VALUES.includes(preset) ? preset : '',
      sort: asString(req.query.sort),
    }),
  });
});

// GET /api/admin/team/activity?admin=&module=&outcome=&type=&q=&from=&to=&page=&limit=
const activity = asyncHandler(async (req, res) => {
  assertDb();
  const q = req.query;
  const module = asString(q.module);
  const outcome = asString(q.outcome);
  const type = asString(q.type);
  send(
    res,
    await service.listActivity({
      admin: cleanId(q.admin),
      module: [...MODULE_KEYS, 'team'].includes(module) ? module : '',
      outcome: ['success', 'denied', 'failed'].includes(outcome) ? outcome : '',
      type: ['auth', 'change'].includes(type) ? type : '',
      q: asString(q.q).trim().slice(0, 80),
      from: cleanDay(q.from),
      to: cleanDay(q.to),
      page: Number.parseInt(asString(q.page), 10) || 1,
      limit: Number.parseInt(asString(q.limit), 10) || 20,
    }),
  );
});

// GET /api/admin/team/:id
const details = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getDetails(req.params.id));
});

// POST /api/admin/team   body: { name, email, phone?, title?, preset?, permissions? }  -> { admin, temporaryPassword }
const create = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const preset = body.preset === undefined ? 'custom' : cleanPreset(body.preset);
  const permissions = cleanPermissions(body.permissions === undefined ? presetFor(preset) : body.permissions);
  const presetLabel = (PRESETS.find((p) => p.value === preset) || {}).label || 'Admin';

  send(
    res,
    await service.createAdmin({
      name: cleanName(body.name),
      email: cleanEmail(body.email),
      phone: cleanPhone(body.phone),
      title: cleanTitle(body.title) || presetLabel,
      preset,
      permissions,
      by: req.user,
    }),
    201,
  );
});

// PATCH /api/admin/team/:id   body: any of { name, phone, title, preset, permissions, isActive }
const update = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const fields = {};
  if (body.name !== undefined) fields.name = cleanName(body.name);
  if (body.phone !== undefined) fields.phone = cleanPhone(body.phone);
  if (body.title !== undefined) fields.title = cleanTitle(body.title);
  if (body.preset !== undefined) fields.preset = cleanPreset(body.preset);
  if (body.permissions !== undefined) fields.permissions = cleanPermissions(body.permissions);
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw new ApiError(400, 'isActive must be true or false');
    fields.isActive = body.isActive;
  }
  if (Object.keys(fields).length === 0) throw new ApiError(400, 'Nothing to update');
  send(res, { admin: await service.updateAdmin(req.params.id, fields) });
});

// POST /api/admin/team/:id/reset-password   -> { admin, temporaryPassword }
const resetPassword = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.resetPassword(req.params.id));
});

// POST /api/admin/team/:id/email-credentials   body: { password }
const emailCredentials = asyncHandler(async (req, res) => {
  assertDb();
  const password = asString(bodyOf(req).password);
  if (!password || password.length > 72) throw new ApiError(400, 'Temporary password is required');
  await service.emailCredentials(req.params.id, password);
  send(res, { sent: true });
});

// POST /api/admin/team/:id/sign-out   -> signs the admin out of every device
const signOut = asyncHandler(async (req, res) => {
  assertDb();
  send(res, { admin: await service.signOutEverywhere(req.params.id) });
});

// DELETE /api/admin/team/:id
const remove = asyncHandler(async (req, res) => {
  assertDb();
  await service.removeAdmin(req.params.id);
  send(res, { deleted: true });
});

module.exports = { options, overview, list, activity, details, create, update, resetPassword, emailCredentials, signOut, remove };