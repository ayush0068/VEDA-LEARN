const { MODULES, can, levelForMethod } = require('../config/adminAccess');
const { heartbeat, recordActivity } = require('../services/adminActivity.service');
const ApiError = require('../utils/ApiError');

const labelOfModule = (key) => (MODULES.find((m) => m.key === key) || { label: key }).label;
const VERB = { view: 'open', edit: 'make changes in', full: 'delete things in' };

/**
 * Guards a whole group of admin routes. The level needed comes from the HTTP method
 * (GET = view, POST / PATCH = edit, DELETE = full) unless `level` is given.
 */
const requirePermission =
  (moduleKey, { level } = {}) =>
  (req, _res, next) => {
    const needed = level || levelForMethod(req.method);
    if (can(req.user, moduleKey, needed)) return next();
    return next(new ApiError(403, `You do not have permission to ${VERB[needed]} ${labelOfModule(moduleKey)}. Ask the super admin for access.`));
  };

/** Passes when the admin has at least `level` in ANY of the listed modules (e.g. media upload is shared by Courses and Lessons). */
const requireAnyPermission =
  (moduleKeys, { level } = {}) =>
  (req, _res, next) => {
    const needed = level || levelForMethod(req.method);
    if (moduleKeys.some((key) => can(req.user, key, needed))) return next();
    return next(new ApiError(403, 'You do not have permission to do this. Ask the super admin for access.'));
  };

/** Only the super admin. */
const requireSuper = (req, _res, next) =>
  req.user && req.user.role === 'admin' && req.user.isSuperAdmin ? next() : next(new ApiError(403, 'Only the super admin can do this'));

// ------------------------------------------------------------------------------------------------
// the record book
// ------------------------------------------------------------------------------------------------
const RESOURCES = {
  students: { module: 'students', noun: 'student' },
  instructors: { module: 'instructors', noun: 'instructor' },
  courses: { module: 'courses', noun: 'course' },
  curriculum: { module: 'curriculum', noun: 'curriculum' },
  assessments: { module: 'assessments', noun: 'assessment' },
  'live-classes': { module: 'liveClasses', noun: 'live class' },
  team: { module: 'team', noun: 'admin' },
};

const SPECIAL = {
  'reset-password': { action: 'reset_password', verb: 'Reset the password of' },
  'email-credentials': { action: 'email_credentials', verb: 'Emailed login details to' },
  'sign-out': { action: 'sign_out', verb: 'Signed out everywhere:' },
  cancel: { action: 'cancel', verb: 'Cancelled' },
  reorder: { action: 'reorder', verb: 'Reordered' },
  duplicate: { action: 'duplicate', verb: 'Duplicated' },
  move: { action: 'move', verb: 'Moved' },
  'bulk-status': { action: 'bulk_status', verb: 'Changed the status of' },
};
const BY_METHOD = { POST: { action: 'create', verb: 'Created' }, PATCH: { action: 'update', verb: 'Updated' }, PUT: { action: 'update', verb: 'Updated' }, DELETE: { action: 'delete', verb: 'Deleted' } };

const HEX24 = /^[a-f0-9]{24}$/i;
const RESERVED = new Set(['options', 'upload', 'course', 'courses', 'modules', 'lessons', 'schedule', 'activity', 'overview']);

/** works out what a request means from its method + path, e.g. DELETE /api/admin/students/<id> */
const describeRequest = (method, originalUrl) => {
  const parts = String(originalUrl).split('?')[0].split('/').filter(Boolean);
  const at = parts.indexOf('admin');
  const segs = at === -1 ? [] : parts.slice(at + 1);
  const resource = RESOURCES[segs[0]];
  if (!resource) return null;

  const last = segs[segs.length - 1];
  let noun = resource.noun;
  if (segs[0] === 'curriculum') {
    const idx = Math.max(segs.lastIndexOf('modules'), segs.lastIndexOf('lessons'));
    if (idx !== -1) noun = segs[idx] === 'modules' ? 'module' : 'lesson';
  }
  if (segs[0] === 'assessments') noun = { quizzes: 'quiz', assignments: 'assignment', submissions: 'submission' }[segs[1]] || 'assessment';

  let info;
  if (segs.includes('recording')) {
    if (last === 'chunk') return { skip: true };
    info = last === 'start' ? { action: 'recording_start', verb: 'Started recording' } : last === 'finish' ? { action: 'recording_save', verb: 'Saved the recording' } : { action: 'recording_delete', verb: 'Deleted the recording' };
    noun = 'live class';
  } else if (segs[0] === 'courses' && segs[1] === 'upload') {
    info = { action: 'upload', verb: 'Uploaded' };
    noun = `a ${segs[2] || 'file'}`;
  } else if (segs[0] === 'assessments' && segs[1] === 'submissions' && String(method).toUpperCase() === 'PATCH') {
    info = { action: 'grade', verb: 'Graded' };
  } else {
    info = SPECIAL[last] || BY_METHOD[String(method).toUpperCase()] || { action: String(method).toLowerCase(), verb: 'Changed' };
  }

  let targetId = segs.slice(1).find((s) => HEX24.test(s)) || '';
  if (!targetId && segs[0] === 'courses' && segs[1] && !RESERVED.has(segs[1])) targetId = segs[1];
  if (!targetId && segs[0] === 'curriculum' && segs[1] === 'course' && segs[2]) targetId = segs[2];

  return { skip: false, module: resource.module, noun, targetId, action: `${noun.replace(/^a /, '').replace(/\s+/g, '_')}.${info.action}`, verb: info.verb };
};

const clip = (value, max) => String(value).replace(/\s+/g, ' ').trim().slice(0, max);

/** a readable name from a response body, e.g. { course: { title } } -> title. Never reads anything else (no passwords). */
const labelFromBody = (data) => {
  if (!data || typeof data !== 'object') return '';
  const read = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '';
    for (const key of ['name', 'title', 'email']) if (typeof obj[key] === 'string' && obj[key]) return clip(obj[key], 80);
    return '';
  };
  const own = read(data);
  if (own) return own;
  for (const value of Object.values(data)) {
    const found = read(value);
    if (found) return found;
  }
  return '';
};

/** before a DELETE the name is still in the database, so look it up now */
const labelBeforeDelete = async (info) => {
  const id = info.targetId;
  if (!id) return '';
  try {
    const model = (name) => require(`../models/${name}`);
    if (info.module === 'students' || info.module === 'instructors' || info.module === 'team') return HEX24.test(id) ? (await model('User').findById(id).select('name').lean())?.name || '' : '';
    if (info.module === 'courses') return (await model('Course').findOne({ slug: id }).select('title').lean())?.title || '';
    if (info.module === 'liveClasses') return HEX24.test(id) ? (await model('LiveClass').findById(id).select('title').lean())?.title || '' : '';
    if (info.module === 'assessments' && HEX24.test(id) && (info.noun === 'quiz' || info.noun === 'assignment')) {
      return (await model(info.noun === 'quiz' ? 'Quiz' : 'Assignment').findById(id).select('title').lean())?.title || '';
    }
    if (info.module === 'curriculum' && HEX24.test(id)) {
      const doc = info.noun === 'lesson' ? await model('Lesson').findById(id).select('title').lean() : await model('CourseModule').findById(id).select('title').lean();
      return doc?.title || '';
    }
  } catch {
    /* the name is only a nicety */
  }
  return '';
};

/**
 * Runs for every request of a signed-in admin (after protect):
 *   - remembers that the admin is active (last seen, active time)
 *   - writes a line to the record book for every change, and for every refused attempt
 */
const trackAdmin = (req, res, next) => {
  const user = req.user;
  try {
    heartbeat(user);
  } catch (err) {
    console.warn('[admin-log] heartbeat failed:', err.message);
  }

  const method = String(req.method).toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

  const info = describeRequest(method, req.originalUrl);
  if (!info || info.skip) return next();

  let bodyLabel = '';
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    try {
      if (body && body.success) bodyLabel = labelFromBody(body.data);
    } catch {
      /* ignore */
    }
    return originalJson(body);
  };

  const run = async () => {
    const before = method === 'DELETE' ? await labelBeforeDelete(info) : '';
    res.on('finish', () => {
      const status = res.statusCode;
      const outcome = status < 400 ? 'success' : status === 403 ? 'denied' : 'failed';
      const label = before || bodyLabel;
      const what = info.action.startsWith('upload') || info.action.endsWith('.upload') ? info.noun : `${info.noun}${label ? ` “${label}”` : ''}`;
      const base = `${info.verb} ${what}`.replace(/\s+/g, ' ');
      const summary = outcome === 'success' ? base : outcome === 'denied' ? `Tried to do this but was not allowed: ${base}` : `Could not complete: ${base}`;

      recordActivity({
        user,
        type: 'change',
        action: info.action,
        module: info.module,
        summary: clip(summary, 240),
        outcome,
        status,
        req,
        path: req.originalUrl.split('?')[0].replace(/[a-f0-9]{24}/gi, ':id'),
        targetId: info.targetId,
        targetLabel: label,
      });
    });
    next();
  };

  run().catch(() => next());
  return undefined;
};

module.exports = { requirePermission, requireAnyPermission, requireSuper, trackAdmin, describeRequest, labelFromBody };