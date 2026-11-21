const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const { getDbState } = require('../config/db');
const service = require('../services/liveClass.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { RECORDING_DIR, mediaPath, saveStream } = require('../utils/media');
const { env } = require('../config/env');

const TABS = ['upcoming', 'live', 'past', 'cancelled'];
const FEATURE_KEYS = ['chat', 'handRaise', 'polls', 'reactions', 'studentCamera', 'recording'];

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
const text = (value, label, max, { required = false, min = 0 } = {}) => {
  const s = asString(value).trim().replace(/[ \t]+/g, ' ');
  if (required && !s) throw new ApiError(400, `${label} is required`);
  if (s && s.length < min) throw new ApiError(400, `${label} must be at least ${min} characters`);
  if (s.length > max) throw new ApiError(400, `${label} can be at most ${max} characters`);
  return s;
};

const whole = (value, label, min, max) => {
  const n = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, `${label} must be a whole number between ${min} and ${max}`);
  return n;
};

const cleanClass = (body, { create }) => {
  const f = {};
  const has = (key) => body[key] !== undefined;

  if (create || has('title')) f.title = text(body.title, 'Class title', 120, { required: true, min: 3 });
  if (has('description')) f.description = text(body.description, 'Description', 1000);
  if (has('courseSlug')) {
    const slug = asString(body.courseSlug).trim().toLowerCase();
    if (slug && !/^[a-z0-9-]{1,100}$/.test(slug)) throw new ApiError(400, 'Invalid course');
    f.courseSlug = slug;
  }
  if (create || has('host')) {
    const host = asString(body.host).trim();
    if (!/^[a-f0-9]{24}$/i.test(host)) throw new ApiError(400, 'Please choose a host');
    f.host = host;
  }
  if (create || has('startsAt')) {
    const date = new Date(asString(body.startsAt));
    if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Please choose the date and time of the class');
    f.startsAt = date;
  }
  if (create || has('durationMin')) f.durationMin = whole(body.durationMin, 'Duration', 5, 480);
  if (create || has('maxStudents')) f.maxStudents = whole(body.maxStudents, 'Max students', 1, env.live.maxStudentsLimit);
  if (has('access')) {
    if (!['enrolled', 'everyone'].includes(body.access)) throw new ApiError(400, 'Invalid access setting');
    f.access = body.access;
  }

  if (has('features')) {
    const features = body.features && typeof body.features === 'object' ? body.features : {};
    f.features = Object.fromEntries(FEATURE_KEYS.map((k) => [k, features[k] === true]));
  }

  if (has('resources')) {
    if (!Array.isArray(body.resources) || body.resources.length > 10) throw new ApiError(400, 'Add at most 10 resource links');
    f.resources = body.resources
      .map((r) => ({ title: text(r?.title, 'Resource name', 80), url: asString(r?.url).trim() }))
      .filter((r) => r.title || r.url)
      .map((r) => {
        if (!r.title) throw new ApiError(400, 'Every resource needs a name');
        if (!/^https?:\/\/[^\s]{3,480}$/i.test(r.url)) throw new ApiError(400, `Resource “${r.title}” needs a full link (https://…)`);
        return r;
      });
  }
  return f;
};

// ---- classes ----
const options = asyncHandler(async (_req, res) => {
  assertDb();
  send(res, await service.getOptions());
});

// GET /api/admin/live-classes?tab=upcoming|live|past|cancelled&q=&course=&page=&limit=
const listAll = asyncHandler(async (req, res) => {
  assertDb();
  const tab = asString(req.query.tab);
  const [result, stats] = await Promise.all([
    service.listClasses({
      tab: TABS.includes(tab) ? tab : '',
      q: asString(req.query.q).trim().slice(0, 80),
      course: asString(req.query.course).trim().toLowerCase().slice(0, 100),
      page: Number.parseInt(asString(req.query.page), 10) || 1,
      limit: Number.parseInt(asString(req.query.limit), 10) || 8,
    }),
    service.getStats(),
  ]);
  send(res, { ...result, stats });
});

const details = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.getClassDetails(asString(req.params.id)));
});

const create = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.createClass(cleanClass(bodyOf(req), { create: true })), 201);
});

const update = asyncHandler(async (req, res) => {
  assertDb();
  const fields = cleanClass(bodyOf(req), { create: false });
  if (Object.keys(fields).length === 0) throw new ApiError(400, 'Nothing to update');
  send(res, await service.updateClass(asString(req.params.id), fields));
});

const cancel = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.cancelClass(asString(req.params.id), text(bodyOf(req).reason, 'Reason', 200)));
});

const remove = asyncHandler(async (req, res) => {
  assertDb();
  await service.deleteClass(asString(req.params.id));
  send(res, { deleted: true });
});

// ---- recording ----
// The host's browser records the class and sends it in small pieces while the class runs (so nothing is lost if the tab
// closes and the browser never has to keep a whole lesson in memory):  start -> chunk, chunk, ... -> finish
const MAX_CHUNK = 32 * 1024 * 1024;
const MAX_RECORDING = 4 * 1024 * 1024 * 1024; // 4 GB per class
const sessions = new Map(); // recordingId -> { classId, file, name, size }

const startRecording = asyncHandler(async (req, res) => {
  assertDb();
  const c = await service.getClassDetails(asString(req.params.id));
  if (c.status !== 'live') throw new ApiError(409, 'The class is not live');
  if (!c.features.recording) throw new ApiError(403, 'Recording is turned off for this class');

  await fs.promises.mkdir(RECORDING_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.webm`;
  const id = crypto.randomUUID();
  sessions.set(id, { classId: c.id, file: path.join(RECORDING_DIR, name), name, size: 0 });
  send(res, { recordingId: id }, 201);
});

const sessionOf = (req) => {
  const s = sessions.get(asString(req.params.rid));
  if (!s || s.classId !== asString(req.params.id)) throw new ApiError(404, 'Recording session not found');
  return s;
};

const recordingChunk = asyncHandler(async (req, res) => {
  const s = sessionOf(req);
  let received = 0;
  const limiter = new Transform({
    transform(chunk, _enc, cb) {
      received += chunk.length;
      if (received > MAX_CHUNK || s.size + received > MAX_RECORDING) return cb(new ApiError(413, 'Recording is too large'));
      return cb(null, chunk);
    },
  });
  await pipeline(req, limiter, fs.createWriteStream(s.file, { flags: 'a' }));
  s.size += received;
  send(res, { size: s.size });
});

const finishRecording = asyncHandler(async (req, res) => {
  assertDb();
  const s = sessionOf(req);
  sessions.delete(asString(req.params.rid));
  if (s.size === 0) {
    await fs.promises.unlink(s.file).catch(() => {});
    throw new ApiError(400, 'The recording is empty');
  }
  const durationSec = Math.max(0, Math.round(Number(bodyOf(req).durationSec) || 0));
  // the pieces were collected in a temporary file; move the finished recording into MongoDB (survives redeploys)
  let id;
  try {
    id = await saveStream(fs.createReadStream(s.file), { filename: s.name, contentType: 'video/webm', kind: 'recording' });
  } catch {
    throw new ApiError(500, 'Could not save the recording. Please try again.');
  } finally {
    await fs.promises.unlink(s.file).catch(() => {});
  }
  await service.setRecording(s.classId, { url: mediaPath(id), size: s.size, durationSec });
  send(res, await service.getClassDetails(s.classId));
});

const deleteRecording = asyncHandler(async (req, res) => {
  assertDb();
  send(res, await service.removeRecording(asString(req.params.id)));
});

module.exports = { options, listAll, details, create, update, cancel, remove, startRecording, recordingChunk, finishRecording, deleteRecording };