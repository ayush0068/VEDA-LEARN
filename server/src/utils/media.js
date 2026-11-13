const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');

const COURSE_DIR = path.join(env.uploadDir, 'courses');
// files we create ourselves: <uuid>.<ext>
const OWN_FILE_RE = /^\/uploads\/courses\/([a-f0-9-]{36}\.[a-z0-9]{2,5})$/;

/** Public address of this API, e.g. https://api.example.com (works behind proxies like Render / Railway). */
const publicBase = (req) => {
  if (env.publicApiUrl) return env.publicApiUrl;
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || `localhost:${env.port}`).split(',')[0].trim();
  return `${proto}://${host}`;
};

/** Deletes an uploaded file when `value` is a link to one of OUR uploads. Anything else is ignored. Never throws. */
const removeUploadedFile = async (value) => {
  if (!value || typeof value !== 'string') return;
  try {
    const { pathname } = new URL(value, 'http://local');
    const match = OWN_FILE_RE.exec(pathname);
    if (match) await fs.promises.unlink(path.join(COURSE_DIR, match[1]));
  } catch {
    /* already gone */
  }
};

module.exports = { COURSE_DIR, publicBase, removeUploadedFile };