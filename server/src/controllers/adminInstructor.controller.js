const { getDbState } = require('../config/db');
const { PERMISSION_KEYS, ROLE_VALUES, SLOT_KIND_VALUES, presetFor } = require('../config/instructorAccess');
const service = require('../services/adminInstructor.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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

// ---- field cleaners (throw 400 with a readable message) ----
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

const cleanTitle = (value) => {
  const title = asString(value).trim().replace(/\s+/g, ' ');
  if (title.length > 80) throw new ApiError(400, 'Title can be at most 80 characters');
  return title;
};

const cleanBio = (value) => {
  const bio = asString(value).trim();
  if (bio.length > 600) throw new ApiError(400, 'Bio can be at most 600 characters');
  return bio;
};

const cleanRole = (value) => {
  const role = asString(value);
  if (!ROLE_VALUES.includes(role)) throw new ApiError(400, 'Please choose a valid instructor role');
  return role;
};

const cleanExperience = (value) => {
  const years = Number(value);
  if (!Number.isInteger(years) || years < 0 || years > 60) throw new ApiError(400, 'Experience must be a whole number of years (0-60)');
  return years;
};

const cleanExpertise = (value) => {
  if (!Array.isArray(value)) throw new ApiError(400, 'Expertise must be a list');
  const tags = [...new Set(value.map((t) => asString(t).trim().replace(/\s+/g, ' ')).filter(Boolean))];
  if (tags.length > 8) throw new ApiError(400, 'Add at most 8 expertise tags');
  if (tags.some((t) => t.length > 30)) throw new ApiError(400, 'Each expertise tag can be at most 30 characters');
  return tags;
};

const cleanPermissions = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Permissions must be an object');
  return Object.fromEntries(PERMISSION_KEYS.map((key) => [key, value[key] === true]));
};

const cleanCourses = (value) => {
  if (!Array.isArray(value)) throw new ApiError(400, 'Courses must be a list');
  const slugs = [...new Set(value.map((s) => asString(s).trim().toLowerCase()).filter(Boolean))];
  if (slugs.length > 50) throw new ApiError(400, 'Too many courses selected');
  return slugs;
};

const cleanSchedule = (value) => {
  if (!Array.isArray(value)) throw new ApiError(400, 'Schedule must be a list');
  if (value.length > 40) throw new ApiError(400, 'A schedule can have at most 40 weekly sessions');

  return value.map((raw) => {
    const slot = raw && typeof raw === 'object' ? raw : {};
    const day = Number(slot.day);
    const start = asString(slot.start);
    const end = asString(slot.end);
    const kind = asString(slot.kind) || 'live-class';
    const title = asString(slot.title).trim();

    if (!Number.isInteger(day) || day < 0 || day > 6) throw new ApiError(400, 'Each session needs a valid day');
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) throw new ApiError(400, 'Session times must look like 18:30');
    if (end <= start) throw new ApiError(400, `End time must be after the start time (${start}-${end})`);
    if (!SLOT_KIND_VALUES.includes(kind)) throw new ApiError(400, 'Unknown session type');
    if (title.length > 60) throw new ApiError(400, 'Session title can be at most 60 characters');

    return { day, start, end, kind, title, courseSlug: asString(slot.courseSlug).trim().toLowerCase() };
  });
};

// ------------------------------------------------------------------------------------------------
// GET /api/admin/instructors/options   -> roles, permissions, session types, courses
const options = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getOptions());
});

// GET /api/admin/instructors?q=&status=&role=&sort=&page=&limit=
const list = asyncHandler(async (req, res) => {
  assertDb();
  const q = asString(req.query.q).trim().slice(0, 80);
  const roleParam = asString(req.query.role);
  const role = ROLE_VALUES.includes(roleParam) ? roleParam : '';
  const page = Number.parseInt(asString(req.query.page), 10) || 1;
  const limit = Number.parseInt(asString(req.query.limit), 10) || 9;

  const [result, stats] = await Promise.all([
    service.listInstructors({ q, status: asString(req.query.status), role, sort: asString(req.query.sort), page, limit }),
    service.getStats(),
  ]);
  send(res, { ...result, stats, emailConfigured: service.isMailConfigured() });
});

// GET /api/admin/instructors/schedule   -> every weekly session of every active instructor
const scheduleOverview = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getScheduleOverview());
});

// GET /api/admin/instructors/:id
const details = asyncHandler(async (req, res) => {
  assertDb();
  send(res, { instructor: await service.getInstructorDetails(req.params.id) });
});

// POST /api/admin/instructors   body: { name, email, phone?, title?, instructorRole?, permissions? }
const create = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);

  const name = cleanName(body.name);
  const email = asString(body.email).trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');

  const instructorRole = body.instructorRole === undefined ? 'instructor' : cleanRole(body.instructorRole);
  const permissions = body.permissions === undefined ? presetFor(instructorRole) : cleanPermissions(body.permissions);

  send(
    res,
    await service.createInstructor({
      name,
      email,
      phone: cleanPhone(body.phone),
      title: cleanTitle(body.title),
      instructorRole,
      permissions,
    }),
    201,
  );
});

// PATCH /api/admin/instructors/:id   body: any of { name, phone, isActive, title, bio, experienceYears, expertise,
//                                                    instructorRole, permissions, courses, schedule }
const update = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  const account = {};
  const profile = {};

  if (body.name !== undefined) account.name = cleanName(body.name);
  if (body.phone !== undefined) account.phone = cleanPhone(body.phone);
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') throw new ApiError(400, 'isActive must be true or false');
    account.isActive = body.isActive;
  }

  if (body.title !== undefined) profile.title = cleanTitle(body.title);
  if (body.bio !== undefined) profile.bio = cleanBio(body.bio);
  if (body.experienceYears !== undefined) profile.experienceYears = cleanExperience(body.experienceYears);
  if (body.expertise !== undefined) profile.expertise = cleanExpertise(body.expertise);
  if (body.instructorRole !== undefined) profile.instructorRole = cleanRole(body.instructorRole);
  if (body.permissions !== undefined) profile.permissions = cleanPermissions(body.permissions);
  if (body.courses !== undefined) profile.courses = cleanCourses(body.courses);
  if (body.schedule !== undefined) profile.schedule = cleanSchedule(body.schedule);

  if (Object.keys(account).length + Object.keys(profile).length === 0) throw new ApiError(400, 'Nothing to update');

  send(res, { instructor: await service.updateInstructor(req.params.id, { account, profile }) });
});

// POST /api/admin/instructors/:id/reset-password   -> { instructor, temporaryPassword }
const resetPassword = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.resetInstructorPassword(req.params.id));
});

// POST /api/admin/instructors/:id/email-credentials   body: { password }
const emailCredentials = asyncHandler(async (req, res) => {
  assertDb();
  const password = asString(bodyOf(req).password);
  if (!password || password.length > 72) throw new ApiError(400, 'Temporary password is required');

  await service.emailCredentials(req.params.id, password);
  send(res, { sent: true });
});

// DELETE /api/admin/instructors/:id
const remove = asyncHandler(async (req, res) => {
  assertDb();
  await service.deleteInstructor(req.params.id);
  send(res, { deleted: true });
});

module.exports = { options, list, scheduleOverview, details, create, update, resetPassword, emailCredentials, remove };