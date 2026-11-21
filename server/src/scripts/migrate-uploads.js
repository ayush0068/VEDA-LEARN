const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');
const { connectDB, disconnectDB, getDbState } = require('../config/db');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const LiveClass = require('../models/LiveClass');
const { mediaPath, saveStream } = require('../utils/media');

// Usage:  npm run migrate-uploads            (moves the files into MongoDB and fixes the links)
//         npm run migrate-uploads -- --dry-run   (only shows what would happen)
//
// Run it on the computer that HAS the old server/uploads folder (e.g. your laptop), with MONGODB_URI in server/.env
// pointing to the database your live site uses. Every old link like
//     http://localhost:5000/uploads/courses/<uuid>.mp4
// becomes a host independent link  /api/media/<id>  and the file itself is stored inside MongoDB (GridFS).
// Safe to run again: links that are already migrated are skipped.

const DRY = process.argv.includes('--dry-run');
const LEGACY_RE = /\/uploads\/(courses|recordings)\/([a-f0-9-]{36}\.[a-z0-9]{2,5})(?:[?#].*)?$/i;
const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf' };

const cache = new Map(); // "courses/<name>" -> "/api/media/<id>" | null (file not found)
const report = { moved: 0, relinked: 0, missing: [], links: 0 };

const migrateLink = async (value) => {
  if (typeof value !== 'string') return null;
  const m = LEGACY_RE.exec(value);
  if (!m) return null;
  const [, dir, name] = m;
  const key = `${dir}/${name}`;
  if (!cache.has(key)) {
    const file = path.join(env.uploadDir, dir, name);
    if (!fs.existsSync(file)) {
      cache.set(key, null);
    } else if (DRY) {
      cache.set(key, `/api/media/(new id)`);
      report.moved += 1;
    } else {
      const ext = name.split('.').pop().toLowerCase();
      const id = await saveStream(fs.createReadStream(file), { filename: name, contentType: TYPES[ext] || 'application/octet-stream', kind: dir === 'recordings' ? 'recording' : 'upload' });
      cache.set(key, mediaPath(id));
      report.moved += 1;
    }
  }
  const next = cache.get(key);
  if (!next) {
    report.missing.push(key);
    return null;
  }
  report.links += 1;
  return next;
};

const fix = async (Model, fields) => {
  const docs = await Model.find({}).lean();
  for (const doc of docs) {
    const $set = {};
    for (const field of fields) {
      const current = field.split('.').reduce((o, k) => (o ? o[k] : undefined), doc);
      const next = await migrateLink(current); // eslint-disable-line no-await-in-loop
      if (next) $set[field] = next;
    }
    if (Object.keys($set).length && !DRY) await Model.updateOne({ _id: doc._id }, { $set }); // eslint-disable-line no-await-in-loop
    if (Object.keys($set).length) report.relinked += 1;
  }
};

const run = async () => {
  await connectDB();
  if (getDbState() !== 'connected') {
    console.error('[migrate] Database not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }
  console.log(`[migrate] ${DRY ? 'DRY RUN - nothing is changed. ' : ''}Looking for old uploads in ${env.uploadDir}`);

  await fix(Course, ['image', 'previewVideo', 'syllabus']);
  await fix(Lesson, ['mediaUrl']);
  await fix(LiveClass, ['recording.url']);

  console.log(`[migrate] files moved into MongoDB: ${report.moved}, records updated: ${report.relinked}`);
  const missing = [...new Set(report.missing)];
  if (missing.length) {
    console.log(`[migrate] ${missing.length} file(s) are linked in the database but not in ${env.uploadDir}:`);
    missing.forEach((f) => console.log(`   - ${f}`));
    console.log('[migrate] Run this on the computer that has those files, or upload them again from the admin panel.');
  }
  await disconnectDB();
};

run().catch((err) => {
  console.error('[migrate] failed:', err.message);
  process.exit(1);
});