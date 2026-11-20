const { getDbState } = require('../config/db');
const Lesson = require('../models/Lesson');
const service = require('../services/curriculum.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const asString = (value) => (typeof value === 'string' ? value : '');
const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});
const has = (body, key) => Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined;

const assertDb = () => {
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
};

const send = (res, data, status = 200) => {
  res.set('Cache-Control', 'no-store');
  res.status(status).json({ success: true, data });
};

// ---- cleaners ----
const text = (value, label, max, { required = false, min = 0, multiline = false } = {}) => {
  let s = asString(value).trim();
  if (!multiline) s = s.replace(/\s+/g, ' ');
  if (required && !s) throw new ApiError(400, `${label} is required`);
  if (s && s.length < min) throw new ApiError(400, `${label} must be at least ${min} characters`);
  if (s.length > max) throw new ApiError(400, `${label} must be at most ${max} characters`);
  return s;
};

const intIn = (value, label, min, max) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, `${label} must be a whole number from ${min} to ${max}`);
  return n;
};

// an uploaded file (/uploads/...), a path of the website, or any http(s) link (YouTube, Vimeo, Drive, mp4 ...)
const link = (value, label) => {
  const s = asString(value).trim();
  if (!s) return '';
  if (s.length > 500) throw new ApiError(400, `${label} is too long`);
  if (!/^(https?:\/\/\S+|\/[^\s]*)$/i.test(s)) throw new ApiError(400, `${label} must be a full link starting with https:// (or an uploaded file)`);
  return s;
};

const status = (value) => {
  if (value !== 'draft' && value !== 'published') throw new ApiError(400, 'Status must be draft or published');
  return value;
};

const cleanModule = (body, { partial }) => {
  const out = {};
  if (!partial || has(body, 'title')) out.title = text(body.title, 'Module title', 120, { required: true, min: 2 });
  if (has(body, 'description')) out.description = text(body.description, 'Description', 500);
  if (has(body, 'weeks')) out.weeks = intIn(body.weeks, 'Weeks', 1, 52);
  if (has(body, 'status')) out.status = status(body.status);
  return out;
};

const cleanLesson = (body, { partial }) => {
  const out = {};
  if (!partial || has(body, 'title')) out.title = text(body.title, 'Lesson title', 120, { required: true, min: 2 });
  if (has(body, 'description')) out.description = text(body.description, 'Description', 500);
  if (has(body, 'type')) {
    if (!Lesson.TYPES.includes(body.type)) throw new ApiError(400, 'Lesson type must be video, article or document');
    out.type = body.type;
  } else if (!partial) out.type = 'video';
  if (has(body, 'mediaUrl')) out.mediaUrl = link(body.mediaUrl, 'Video / file link');
  if (has(body, 'content')) out.content = text(body.content, 'Lesson text', 20000, { multiline: true });
  if (has(body, 'durationMin')) out.durationMin = intIn(body.durationMin, 'Duration', 0, 1000);
  if (has(body, 'isPreview')) out.isPreview = body.isPreview === true;
  if (has(body, 'status')) out.status = status(body.status);
  if (has(body, 'resources')) {
    if (!Array.isArray(body.resources)) throw new ApiError(400, 'Resources must be a list');
    if (body.resources.length > 10) throw new ApiError(400, 'You can add up to 10 downloads per lesson');
    out.resources = body.resources.map((r, i) => ({
      title: text(r?.title, `Download ${i + 1} title`, 80, { required: true }),
      url: link(r?.url, `Download ${i + 1} link`) || (() => { throw new ApiError(400, `Download ${i + 1} needs a link or an uploaded file`); })(),
    }));
  }
  return out;
};

const idList = (value, label = 'ids') => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 500 || value.some((v) => typeof v !== 'string')) throw new ApiError(400, `Invalid ${label}`);
  return value;
};

// ---- handlers ----
const courses = asyncHandler(async (_req, res) => {
  assertDb();
  send(res, await service.listCourses());
});

const curriculum = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getCurriculum(req.params.slug));
});

const createModule = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.createModule(req.params.slug, cleanModule(bodyOf(req), { partial: false })), 201);
});
const updateModule = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.updateModule(req.params.id, cleanModule(bodyOf(req), { partial: true })));
});
const deleteModule = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.deleteModule(req.params.id));
});
const duplicateModule = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.duplicateModule(req.params.id), 201);
});
const reorderModules = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.reorderModules(req.params.slug, idList(bodyOf(req).ids)));
});

const createLesson = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.createLesson(req.params.id, cleanLesson(bodyOf(req), { partial: false })), 201);
});
const updateLesson = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.updateLesson(req.params.id, cleanLesson(bodyOf(req), { partial: true })));
});
const deleteLesson = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.deleteLesson(req.params.id));
});
const duplicateLesson = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.duplicateLesson(req.params.id), 201);
});
const reorderLessons = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.reorderLessons(req.params.id, idList(bodyOf(req).ids)));
});
const moveLesson = asyncHandler(async (req, res) => {
  assertDb();
  const target = asString(bodyOf(req).moduleId);
  if (!target) throw new ApiError(400, 'Choose the module to move to');
  send(res, await service.moveLesson(req.params.id, target));
});
const bulkStatus = asyncHandler(async (req, res) => {
  assertDb();
  const body = bodyOf(req);
  send(res, await service.setLessonsStatus(idList(body.ids), status(body.status)));
});

module.exports = {
  courses,
  curriculum,
  createModule,
  updateModule,
  deleteModule,
  duplicateModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  duplicateLesson,
  reorderLessons,
  moveLesson,
  bulkStatus,
};