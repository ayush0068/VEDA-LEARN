const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { env } = require('../config/env');

/**
 * Where uploaded files (course images, preview videos, lesson videos, PDFs, class recordings) live.
 *
 * They are stored INSIDE MongoDB (GridFS, bucket "media"), so they survive redeploys on hosts with a temporary disk
 * (Render, Railway ...) and move together with the database. The address saved in the database is host independent:
 *     /api/media/<24 hex id>
 * and every API response turns it into a full link of the API that answers (https://your-api.com/api/media/<id>),
 * so the same data works on localhost and on the live site.
 *
 * Old files from the previous disk storage (/uploads/courses/<uuid>.<ext>) are still served and can be moved into
 * MongoDB with:  npm run migrate-uploads
 */

const COURSE_DIR = path.join(env.uploadDir, 'courses');
const RECORDING_DIR = path.join(env.uploadDir, 'recordings');

const BUCKET = 'media';
const MEDIA_PATH_RE = /^\/api\/media\/([a-f0-9]{24})$/;
const LEGACY_FILE_RE = /^\/uploads\/(courses|recordings)\/([a-f0-9-]{36}\.[a-z0-9]{2,5})$/;

/** Public address of this API, e.g. https://api.example.com (works behind proxies like Render / Railway). */
const publicBase = (req) => {
  if (env.publicApiUrl) return env.publicApiUrl;
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || `localhost:${env.port}`).split(',')[0].trim();
  return `${proto}://${host}`;
};

const getBucket = () => {
  if (mongoose.connection.readyState !== 1) throw new Error('Database unavailable');
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET, chunkSizeBytes: 1024 * 1024 });
};

const mediaPath = (id) => `/api/media/${String(id)}`;

/** "https://anything/api/media/<id>" (or the bare path) -> "/api/media/<id>"; every other value is returned unchanged */
const normalizeMediaUrl = (value) => {
  if (typeof value !== 'string' || !value) return value;
  try {
    const { pathname } = new URL(value, 'http://local');
    return MEDIA_PATH_RE.test(pathname) ? pathname : value;
  } catch {
    return value;
  }
};

/** the GridFS file id when `value` is one of our media links, else null */
const mediaIdOf = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    const m = MEDIA_PATH_RE.exec(new URL(value, 'http://local').pathname);
    return m ? m[1] : null;
  } catch {
    return null;
  }
};

/** Turns every stored "/api/media/<id>" inside a JSON text into a full link of this API. */
const absolutizeJson = (text, base) => text.replace(/"\/api\/media\/([a-f0-9]{24})"/g, (_m, id) => `"${base}/api/media/${id}"`);

/** Express middleware: makes res.json() answer with full media links (so the website / admin can load them from any origin). */
const mediaLinks = (req, res, next) => {
  res.json = (body) => {
    const text = absolutizeJson(JSON.stringify(body === undefined ? null : body), publicBase(req));
    if (!res.get('Content-Type')) res.type('application/json');
    return res.send(text);
  };
  next();
};

/** Streams `readable` into MongoDB and resolves with the new file's id. Rejects (and cleans up) when the stream fails. */
const saveStream = (readable, { filename, contentType, kind }) =>
  new Promise((resolve, reject) => {
    let bucket;
    try {
      bucket = getBucket();
    } catch (err) {
      return reject(err);
    }
    const upload = bucket.openUploadStream(filename, { metadata: { contentType, kind } });
    const fail = (err) => {
      upload.destroy();
      bucket.delete(upload.id).catch(() => {});
      reject(err);
    };
    readable.on('error', fail);
    upload.on('error', fail);
    upload.on('finish', () => resolve(String(upload.id)));
    readable.pipe(upload);
  });

/** Deletes an uploaded file when `value` is a link to one of OUR uploads. Anything else is ignored. Never throws. */
const removeUploadedFile = async (value) => {
  if (!value || typeof value !== 'string') return;
  try {
    const id = mediaIdOf(value);
    if (id) {
      await getBucket().delete(new mongoose.Types.ObjectId(id));
      return;
    }
    const { pathname } = new URL(value, 'http://local');
    const legacy = LEGACY_FILE_RE.exec(pathname);
    if (legacy) await fs.promises.unlink(path.join(env.uploadDir, legacy[1], legacy[2]));
  } catch {
    /* already gone */
  }
};

module.exports = { COURSE_DIR, RECORDING_DIR, BUCKET, publicBase, getBucket, mediaPath, mediaIdOf, normalizeMediaUrl, mediaLinks, saveStream, removeUploadedFile };