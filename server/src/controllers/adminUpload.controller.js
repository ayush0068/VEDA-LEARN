const crypto = require('crypto');
const { Transform } = require('stream');
const { mediaPath, saveStream } = require('../utils/media');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const MB = 1024 * 1024;

// what the admin panel may upload (the file type decides the extension, never the file name)
const KINDS = {
  image: { max: 5 * MB, types: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }, label: 'JPG, PNG, WebP or GIF image up to 5 MB' },
  video: { max: 300 * MB, types: { 'video/mp4': 'mp4', 'video/webm': 'webm' }, label: 'MP4 or WebM video up to 300 MB' },
  document: { max: 20 * MB, types: { 'application/pdf': 'pdf' }, label: 'PDF up to 20 MB' },
};

// POST /api/admin/courses/upload/:kind    (kind = image | video | document)
// The file is sent as the raw request body with its mime type as Content-Type (no multipart needed) and is stored in
// MongoDB (GridFS). Returns { url, size, type } - save `url` in the course (it is a full link on the API that answers).
const upload = asyncHandler(async (req, res) => {
  const kind = KINDS[req.params.kind];
  if (!kind) throw new ApiError(404, 'Unknown upload type');

  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const ext = kind.types[type];
  if (!ext) throw new ApiError(400, `Unsupported file. Please upload a ${kind.label}.`);

  const declared = Number(req.headers['content-length']);
  if (declared > kind.max) throw new ApiError(413, `File is too large. Please upload a ${kind.label}.`);

  let size = 0;
  const limiter = new Transform({
    transform(chunk, _enc, cb) {
      size += chunk.length;
      if (size > kind.max) return cb(new ApiError(413, `File is too large. Please upload a ${kind.label}.`));
      return cb(null, chunk);
    },
  });
  req.on('error', (err) => limiter.destroy(err));
  req.pipe(limiter);

  const id = await saveStream(limiter, { filename: `${crypto.randomUUID()}.${ext}`, contentType: type, kind: req.params.kind }).catch((err) => {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message === 'Database unavailable' ? 503 : 500, err.message === 'Database unavailable' ? 'Database unavailable' : 'Could not save the file. Please try again.');
  });
  if (size === 0) {
    const { removeUploadedFile } = require('../utils/media');
    await removeUploadedFile(mediaPath(id));
    throw new ApiError(400, 'The file is empty');
  }

  res.set('Cache-Control', 'no-store');
  res.status(201).json({ success: true, data: { url: mediaPath(id), size, type } });
});

module.exports = { upload };