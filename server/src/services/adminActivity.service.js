require('../config/env'); // loads server/.env before the settings below are read
const AdminActivity = require('../models/AdminActivity');
const AdminPresence = require('../models/AdminPresence');
const User = require('../models/User');

// The panel's "day" starts at midnight in this time zone (minutes east of UTC). India = 330.
const rawOffset = process.env.ADMIN_TZ_OFFSET_MIN;
const TZ_OFFSET_MIN = rawOffset && Number.isFinite(Number(rawOffset)) ? Number(rawOffset) : 330;
const TZ_OFFSET_MS = TZ_OFFSET_MIN * 60 * 1000;

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // seen in the last 5 minutes = "online now"
const IDLE_GAP_MS = 10 * 60 * 1000; // a longer pause than this is not counted as active time
const FLUSH_EVERY_MS = 30 * 1000;

const dayKey = (date = new Date()) => new Date(date.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);

const clientInfo = (req) => ({
  ip: String((req && req.ip) || '').slice(0, 64),
  userAgent: String((req && req.get && req.get('user-agent')) || '').slice(0, 200),
});

/** Writes one line of the record book. Never throws: the record book must not break the real request. */
const recordActivity = async ({ user, type = 'change', action, module = '', summary = '', outcome = 'success', status = 200, req, method, path, targetId = '', targetLabel = '' }) => {
  try {
    await AdminActivity.create({
      admin: user._id,
      adminName: user.name,
      adminEmail: user.email,
      type,
      action,
      module,
      summary,
      outcome,
      status,
      method: method || (req && req.method) || '',
      path: String(path || '').slice(0, 200),
      targetId: String(targetId).slice(0, 100),
      targetLabel: String(targetLabel).slice(0, 120),
      ...clientInfo(req),
    });
  } catch (err) {
    console.warn('[admin-log] could not write an activity record:', err.message);
  }
};

// ---- presence (last seen + active time), written at most every 30 seconds per admin ----
const live = new Map(); // adminId -> { oid, lastSeen, lastFlush, requests, ms, firstAt }

const flush = async (entry, now) => {
  const { oid: id, requests, ms, firstAt } = entry;
  entry.requests = 0;
  entry.ms = 0;
  entry.lastFlush = now;
  try {
    await Promise.all([
      AdminPresence.updateOne({ admin: id, day: dayKey(new Date(now)) }, { $inc: { requests, activeMs: ms }, $min: { firstAt: new Date(firstAt) }, $max: { lastAt: new Date(now) } }, { upsert: true }),
      User.updateOne({ _id: id }, { $set: { 'adminAccess.lastActiveAt': new Date(now) } }),
    ]);
  } catch (err) {
    console.warn('[admin-log] could not save presence:', err.message);
  }
};

/** Called on every admin API request. */
const heartbeat = (user) => {
  const id = String(user._id);
  const now = Date.now();
  let entry = live.get(id);
  if (!entry) {
    entry = { oid: user._id, lastSeen: 0, lastFlush: 0, requests: 0, ms: 0, firstAt: now };
    live.set(id, entry);
  }

  const gap = entry.lastSeen ? now - entry.lastSeen : 0;
  if (gap > 0 && gap <= IDLE_GAP_MS) entry.ms += gap;
  if (entry.requests === 0) entry.firstAt = now;
  entry.requests += 1;
  entry.lastSeen = now;

  if (now - entry.lastFlush >= FLUSH_EVERY_MS) flush(entry, now);
};

/** Writes what is still waiting in memory (used on shutdown and by the tests). */
const flushAll = async () => {
  const now = Date.now();
  await Promise.all([...live.values()].filter((e) => e.requests > 0).map((e) => flush(e, now)));
};

module.exports = { TZ_OFFSET_MS, ONLINE_WINDOW_MS, dayKey, clientInfo, recordActivity, heartbeat, flushAll };