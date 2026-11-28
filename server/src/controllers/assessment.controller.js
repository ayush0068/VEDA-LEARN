const crypto = require('crypto');
const { Transform } = require('stream');
const { getDbState } = require('../config/db');
const service = require('../services/assessmentLearn.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { mediaPath, removeUploadedFile, saveStream } = require('../utils/media');

const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

const handler = (fn, status = 200) =>
  asyncHandler(async (req, res) => {
    if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
    const data = await fn(req);
    res.set('Cache-Control', 'no-store');
    res.status(status).json({ success: true, data });
  });

const MB = 1024 * 1024;
const MAX = 10 * MB;
// what a student may hand in (the file type decides the extension, never the file name)
const TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'application/zip': 'zip',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};
const LABEL = 'PDF, Word, text, image (JPG / PNG / WebP) or ZIP file up to 10 MB';

// POST /api/assessments/upload   raw body, Content-Type = the file type, optional X-File-Name (URL-encoded)
const upload = asyncHandler(async (req, res) => {
  if (getDbState() !== 'connected') throw new ApiError(503, 'Database unavailable');
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const ext = TYPES[type];
  if (!ext) throw new ApiError(400, `Unsupported file. Please upload a ${LABEL}.`);
  if (Number(req.headers['content-length']) > MAX) throw new ApiError(413, `File is too large. Please upload a ${LABEL}.`);

  let name = 'file';
  try {
    name = decodeURIComponent(String(req.headers['x-file-name'] || 'file'));
  } catch {
    /* keep the default */
  }
  name = name.replace(/[\\/\0]/g, '').trim().slice(0, 120) || 'file';

  let size = 0;
  const limiter = new Transform({
    transform(chunk, _enc, cb) {
      size += chunk.length;
      if (size > MAX) return cb(new ApiError(413, `File is too large. Please upload a ${LABEL}.`));
      return cb(null, chunk);
    },
  });
  req.on('error', (err) => limiter.destroy(err));
  req.pipe(limiter);

  const id = await saveStream(limiter, { filename: `${crypto.randomUUID()}.${ext}`, contentType: type, kind: 'submission' }).catch((err) => {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, 'Could not save the file. Please try again.');
  });
  if (size === 0) {
    await removeUploadedFile(mediaPath(id));
    throw new ApiError(400, 'The file is empty');
  }
  res.set('Cache-Control', 'no-store');
  res.status(201).json({ success: true, data: { url: mediaPath(id), size, type, name } });
});

module.exports = {
  upload,
  hub: handler((req) => service.getHub(req.user)),
  quiz: handler((req) => service.getQuizIntro(req.user, req.params.id)),
  start: handler((req) => service.startQuiz(req.user, req.params.id), 201),
  attempt: handler((req) => service.getAttempt(req.user, req.params.id)),
  answer: handler((req) => service.saveAnswer(req.user, req.params.id, bodyOf(req))),
  submit: handler((req) => service.submitQuiz(req.user, req.params.id, bodyOf(req).answers)),
  assignment: handler((req) => service.getAssignment(req.user, req.params.id)),
  handIn: handler((req) => service.submitAssignment(req.user, req.params.id, bodyOf(req))),
};