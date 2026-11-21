const mongoose = require('mongoose');
const { pipeline } = require('stream/promises');
const { BUCKET, getBucket } = require('../utils/media');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const ID_RE = /^[a-f0-9]{24}$/;

// GET /api/media/:id   - an uploaded image / video / PDF stored in MongoDB.
// Supports Range requests, so videos can be seeked and start playing before they are fully downloaded.
const serve = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) throw new ApiError(503, 'Database unavailable');
  const id = String(req.params.id || '');
  if (!ID_RE.test(id)) throw new ApiError(404, 'File not found');

  const oid = new mongoose.Types.ObjectId(id);
  const file = await mongoose.connection.db.collection(`${BUCKET}.files`).findOne({ _id: oid });
  if (!file) throw new ApiError(404, 'File not found');

  const size = file.length;
  const type = file.metadata?.contentType || 'application/octet-stream';

  res.set({
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=604800, immutable',
    ETag: `"${id}"`,
    'Content-Disposition': 'inline',
    // the website and the admin panel run on other origins and embed these files (helmet blocks that by default)
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  if (req.get('if-none-match') === `"${id}"`) return res.status(304).end();

  let start = 0;
  let end = size - 1;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.get('range') || '');
  if (range && (range[1] || range[2]) && size > 0) {
    if (range[1] === '') {
      start = Math.max(0, size - Number(range[2])); // "last N bytes"
    } else {
      start = Number(range[1]);
      if (range[2] !== '') end = Math.min(end, Number(range[2]));
    }
    if (start > end || start >= size) {
      res.set('Content-Range', `bytes */${size}`);
      return res.status(416).end();
    }
    res.status(206).set('Content-Range', `bytes ${start}-${end}/${size}`);
  }

  res.set('Content-Length', String(size === 0 ? 0 : end - start + 1));
  if (req.method === 'HEAD' || size === 0) return res.end();

  try {
    await pipeline(getBucket().openDownloadStream(oid, { start, end: end + 1 }), res);
  } catch {
    // the viewer closed the tab / skipped ahead: nothing to report
    if (!res.writableEnded) res.destroy();
  }
  return undefined;
});

module.exports = { serve };