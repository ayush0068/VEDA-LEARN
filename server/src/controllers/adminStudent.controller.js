const { getDbState } = require('../config/db');
const service = require('../services/adminStudent.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

// only plain strings are accepted (blocks query-operator injection)
const asString = (value) => (typeof value === 'string' ? value : '');
const bodyOf = (req) => (req.body && typeof req.body === 'object' ? req.body : {});

const assertDb = () => {
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
};

const cleanName = (value) => {
  const name = asString(value).trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 60) throw new ApiError(400, 'Please enter the full name (2-60 characters)');
  return name;
};

const cleanPhone = (value) => {
  const phone = asString(value).trim();
  if (phone && !PHONE_RE.test(phone)) throw new ApiError(400, 'Please enter a valid phone number');
  return phone;
};

const send = (res, data, status = 200) => {
  res.set('Cache-Control', 'no-store');
  res.status(status).json({ success: true, data });
};

// GET /api/admin/students?q=&status=all|active|pending|disabled&sort=&page=&limit=
const list = asyncHandler(async (req, res) => {
  assertDb();
  const q = asString(req.query.q).trim().slice(0, 80);
  const status = asString(req.query.status);
  const sort = asString(req.query.sort);
  const page = Number.parseInt(asString(req.query.page), 10) || 1;
  const limit = Number.parseInt(asString(req.query.limit), 10) || 10;

  const [result, stats] = await Promise.all([service.listStudents({ q, status, sort, page, limit }), service.getStats()]);
  send(res, { ...result, stats, emailConfigured: service.isMailConfigured() });
});

// GET /api/admin/students/:id
const details = asyncHandler(async (req, res) => {
  assertDb();
  send(res, { student: await service.getStudentDetails(req.params.id) });
});

// POST /api/admin/students   body: { name, email, phone? }   -> { student, temporaryPassword }
const create = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const name = cleanName(body.name);
  const email = asString(body.email).trim().toLowerCase();
  const phone = cleanPhone(body.phone);

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');

  send(res, await service.createStudent({ name, email, phone }), 201);
});

// PATCH /api/admin/students/:id   body: { name?, phone?, isActive? }
const update = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const changes = {};

  if (body.name !== undefined) changes.name = cleanName(body.name);
  if (body.phone !== undefined) changes.phone = cleanPhone(body.phone);
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw new ApiError(400, 'isActive must be true or false');
    changes.isActive = body.isActive;
  }
  if (Object.keys(changes).length === 0) throw new ApiError(400, 'Nothing to update');

  send(res, { student: await service.updateStudent(req.params.id, changes) });
});

// POST /api/admin/students/:id/reset-password   -> { student, temporaryPassword }
const resetPassword = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.resetStudentPassword(req.params.id));
});

// POST /api/admin/students/:id/email-credentials   body: { password }
const emailCredentials = asyncHandler(async (req, res) => {
  assertDb();
  const password = asString(bodyOf(req).password);
  if (!password || password.length > 72) throw new ApiError(400, 'Temporary password is required');

  await service.emailCredentials(req.params.id, password);
  send(res, { sent: true });
});

// DELETE /api/admin/students/:id
const remove = asyncHandler(async (req, res) => {
  assertDb();
  await service.deleteStudent(req.params.id);
  send(res, { deleted: true });
});

module.exports = { list, details, create, update, resetPassword, emailCredentials, remove };