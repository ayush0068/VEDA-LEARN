const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { LEVEL_INFO, MODULES, PRESETS, normalizePermissions } = require('../config/adminAccess');
const AdminActivity = require('../models/AdminActivity');
const AdminPresence = require('../models/AdminPresence');
const LiveClass = require('../models/LiveClass');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/password');
const { ONLINE_WINDOW_MS, TZ_OFFSET_MS, dayKey } = require('./adminActivity.service');
const { isMailConfigured, sendCredentialsEmail } = require('./mail.service');

const BCRYPT_ROUNDS = 12;
const MAX_ADMINS = 50;
const PAGE_SIZES = [20, 50];
const DAY_MS = 24 * 60 * 60 * 1000;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isId = (id) => mongoose.isValidObjectId(id);

// ------------------------------------------------------------------------------------------------
// shapes
// ------------------------------------------------------------------------------------------------
const statusOf = (user) => (!user.isActive ? 'suspended' : user.mustChangePassword ? 'pending' : 'active');

const accessCount = (permissions) => Object.values(permissions).filter((level) => level !== 'none').length;

const toMember = (user, extra = {}) => {
  const access = user.adminAccess || {};
  const permissions = user.isSuperAdmin ? Object.fromEntries(MODULES.map((m) => [m.key, 'full'])) : normalizePermissions(access.permissions);
  const lastActiveAt = access.lastActiveAt || null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar || '',
    isSuper: Boolean(user.isSuperAdmin),
    title: user.isSuperAdmin ? 'Super Admin' : access.title || 'Admin',
    preset: user.isSuperAdmin ? 'super' : access.preset || 'custom',
    status: statusOf(user),
    isActive: user.isActive,
    mustChangePassword: Boolean(user.mustChangePassword),
    permissions,
    modulesCount: accessCount(permissions),
    createdAt: user.createdAt,
    createdByName: access.createdByName || '',
    lastLoginAt: user.lastLoginAt || null,
    lastActiveAt,
    online: Boolean(user.isActive && lastActiveAt && Date.now() - new Date(lastActiveAt).getTime() <= ONLINE_WINDOW_MS),
    actions7d: 0,
    activeMin7d: 0,
    ...extra,
  };
};

const assertId = (id) => {
  if (!isId(id)) throw new ApiError(404, 'Admin not found');
};

/** a normal (non-super) admin; the super admin can never be changed or removed through the panel */
const findAdmin = async (id, { withHash = false, allowSuper = false } = {}) => {
  assertId(id);
  const query = User.findOne({ _id: id, role: 'admin' });
  if (withHash) query.select('+passwordHash');
  const user = await query;
  if (!user) throw new ApiError(404, 'Admin not found');
  if (user.isSuperAdmin && !allowSuper) throw new ApiError(403, 'The super admin account cannot be changed here');
  return user;
};

// ------------------------------------------------------------------------------------------------
// first start: make sure somebody owns the panel
// ------------------------------------------------------------------------------------------------
/**
 * If no super admin exists yet (first start after this feature was added), the oldest active admin becomes the super admin.
 * SUPER_ADMIN_EMAIL in server/.env picks a specific account instead.
 */
const ensureSuperAdmin = async () => {
  if (await User.exists({ role: 'admin', isSuperAdmin: true })) return null;

  const wanted = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  let owner = wanted ? await User.findOne({ role: 'admin', isActive: true, email: wanted }) : null;
  if (!owner) owner = await User.findOne({ role: 'admin', isActive: true }).sort({ createdAt: 1, _id: 1 });
  if (!owner) return null;

  await User.updateOne({ _id: owner._id }, { $set: { isSuperAdmin: true } });
  return owner.email;
};

// ------------------------------------------------------------------------------------------------
// options for the forms
// ------------------------------------------------------------------------------------------------
const getOptions = () => ({
  modules: MODULES,
  levels: LEVEL_INFO,
  presets: PRESETS,
  maxAdmins: MAX_ADMINS,
  emailConfigured: isMailConfigured(),
});

// ------------------------------------------------------------------------------------------------
// list + overview
// ------------------------------------------------------------------------------------------------
const since = (days) => new Date(Date.now() - days * DAY_MS);

const weekStats = async (ids) => {
  const [actions, presence] = await Promise.all([
    AdminActivity.aggregate([
      { $match: { admin: { $in: ids }, type: 'change', outcome: 'success', createdAt: { $gte: since(7) } } },
      { $group: { _id: '$admin', n: { $sum: 1 } } },
    ]),
    AdminPresence.aggregate([
      { $match: { admin: { $in: ids }, day: { $gte: dayKey(since(6)) } } },
      { $group: { _id: '$admin', ms: { $sum: '$activeMs' } } },
    ]),
  ]);
  const map = new Map(ids.map((id) => [String(id), { actions7d: 0, activeMin7d: 0 }]));
  actions.forEach((a) => (map.get(String(a._id)).actions7d = a.n));
  presence.forEach((p) => (map.get(String(p._id)).activeMin7d = Math.round(p.ms / 60000)));
  return map;
};

const SORTS = {
  newest: { createdAt: -1 },
  name: { name: 1 },
  active: { 'adminAccess.lastActiveAt': -1, createdAt: -1 },
};

const listTeam = async ({ q, status, preset, sort }) => {
  const filter = { role: 'admin' };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { 'adminAccess.title': rx }];
  }
  if (status === 'active') Object.assign(filter, { isActive: true, mustChangePassword: { $ne: true } });
  if (status === 'pending') Object.assign(filter, { isActive: true, mustChangePassword: true });
  if (status === 'suspended') filter.isActive = false;
  if (preset) filter['adminAccess.preset'] = preset;

  // the super admin always stays on top
  const users = await User.find(filter).sort({ isSuperAdmin: -1, ...(SORTS[sort] || SORTS.newest) }).limit(200).lean();
  const stats = await weekStats(users.map((u) => u._id));
  return users.map((u) => toMember(u, stats.get(String(u._id))));
};

const overview = async () => {
  const now = Date.now();
  const admins = await User.find({ role: 'admin' }).select('name email isActive isSuperAdmin mustChangePassword adminAccess.lastActiveAt').lean();
  const onlineIds = admins.filter((a) => a.isActive && a.adminAccess?.lastActiveAt && now - new Date(a.adminAccess.lastActiveAt).getTime() <= ONLINE_WINDOW_MS);

  const today = dayKey();
  const start14 = dayKey(since(13));
  const matchBase = { type: 'change', outcome: 'success' };

  const [byDay, presence, top, attention, denied7d, today_] = await Promise.all([
    AdminActivity.aggregate([
      { $match: { ...matchBase, createdAt: { $gte: since(15) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: { $add: ['$createdAt', TZ_OFFSET_MS] } } }, n: { $sum: 1 } } },
    ]),
    AdminPresence.aggregate([{ $match: { day: { $gte: start14 } } }, { $group: { _id: '$day', ms: { $sum: '$activeMs' }, admins: { $sum: 1 } } }]),
    AdminActivity.aggregate([
      { $match: { ...matchBase, createdAt: { $gte: since(7) } } },
      { $group: { _id: '$admin', n: { $sum: 1 }, name: { $last: '$adminName' } } },
      { $sort: { n: -1 } },
      { $limit: 5 },
    ]),
    AdminActivity.find({ $or: [{ outcome: 'denied' }, { action: 'auth.login_failed' }], createdAt: { $gte: since(7) } }).sort({ createdAt: -1 }).limit(5).lean(),
    AdminActivity.countDocuments({ outcome: 'denied', createdAt: { $gte: since(7) } }),
    AdminActivity.countDocuments({ ...matchBase, createdAt: { $gte: new Date(new Date(`${today}T00:00:00Z`).getTime() - TZ_OFFSET_MS) } }),
  ]);

  const dayMap = new Map(byDay.map((d) => [d._id, d.n]));
  const presMap = new Map(presence.map((d) => [d._id, d]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const key = dayKey(new Date(now - (13 - i) * DAY_MS));
    const p = presMap.get(key);
    return { date: key, actions: dayMap.get(key) || 0, activeMin: p ? Math.round(p.ms / 60000) : 0, admins: p ? p.admins : 0 };
  });

  return {
    stats: {
      total: admins.length,
      active: admins.filter((a) => a.isActive && !a.mustChangePassword).length,
      pending: admins.filter((a) => a.isActive && a.mustChangePassword).length,
      suspended: admins.filter((a) => !a.isActive).length,
      online: onlineIds.length,
      actionsToday: today_,
      actions7d: days.slice(-7).reduce((s, d) => s + d.actions, 0),
      denied7d,
    },
    online: onlineIds.map((a) => ({ id: String(a._id), name: a.name })),
    days,
    top: top.map((t) => ({ id: String(t._id), name: t.name, actions: t.n })),
    attention: attention.map(toActivity),
  };
};

// ------------------------------------------------------------------------------------------------
// one admin in detail (supervision)
// ------------------------------------------------------------------------------------------------
const getDetails = async (id) => {
  assertId(id);
  const user = await User.findOne({ _id: id, role: 'admin' }).lean();
  if (!user) throw new ApiError(404, 'Admin not found');
  const oid = new mongoose.Types.ObjectId(id);
  const from30 = since(30);
  const dayExpr = { $dateToString: { format: '%Y-%m-%d', date: { $add: ['$createdAt', TZ_OFFSET_MS] } } };

  const [totals, byDay, byModule, byHour, topActions, presence, allTime] = await Promise.all([
    AdminActivity.aggregate([{ $match: { admin: oid, createdAt: { $gte: from30 } } }, { $group: { _id: { type: '$type', outcome: '$outcome', action: '$action' }, n: { $sum: 1 } } }]),
    AdminActivity.aggregate([{ $match: { admin: oid, type: 'change', outcome: 'success', createdAt: { $gte: from30 } } }, { $group: { _id: dayExpr, n: { $sum: 1 } } }]),
    AdminActivity.aggregate([{ $match: { admin: oid, type: 'change', outcome: 'success', createdAt: { $gte: from30 } } }, { $group: { _id: '$module', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    AdminActivity.aggregate([{ $match: { admin: oid, createdAt: { $gte: from30 } } }, { $group: { _id: { $hour: { $add: ['$createdAt', TZ_OFFSET_MS] } }, n: { $sum: 1 } } }]),
    AdminActivity.aggregate([{ $match: { admin: oid, type: 'change', outcome: 'success', createdAt: { $gte: from30 } } }, { $group: { _id: '$action', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
    AdminPresence.find({ admin: oid, day: { $gte: dayKey(from30) } }).lean(),
    AdminActivity.countDocuments({ admin: oid, type: 'change', outcome: 'success' }),
  ]);

  const count = (pred) => totals.filter((t) => pred(t._id)).reduce((s, t) => s + t.n, 0);
  const dayMap = new Map(byDay.map((d) => [d._id, d.n]));
  const presMap = new Map(presence.map((p) => [p.day, p]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const key = dayKey(new Date(Date.now() - (29 - i) * DAY_MS));
    const p = presMap.get(key);
    return { date: key, actions: dayMap.get(key) || 0, activeMin: p ? Math.round(p.activeMs / 60000) : 0, requests: p ? p.requests : 0 };
  });
  const hourMap = new Map(byHour.map((h) => [h._id, h.n]));

  return {
    admin: toMember(user),
    stats: {
      actions30d: count((k) => k.type === 'change' && k.outcome === 'success'),
      actionsAllTime: allTime,
      denied30d: count((k) => k.outcome === 'denied'),
      failed30d: count((k) => k.type === 'change' && k.outcome === 'failed'),
      logins30d: count((k) => k.action === 'auth.login' && k.outcome === 'success'),
      failedLogins30d: count((k) => k.action === 'auth.login_failed'),
      activeDays30d: days.filter((d) => d.requests > 0 || d.actions > 0).length,
      activeMin30d: days.reduce((s, d) => s + d.activeMin, 0),
    },
    days,
    hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap.get(h) || 0 })),
    modules: byModule.map((m) => ({ module: m._id || 'other', count: m.n })),
    topActions: topActions.map((a) => ({ action: a._id, count: a.n })),
  };
};

// ------------------------------------------------------------------------------------------------
// the record book (all admins or one)
// ------------------------------------------------------------------------------------------------
const toActivity = (a) => ({
  id: String(a._id),
  adminId: String(a.admin),
  adminName: a.adminName,
  adminEmail: a.adminEmail,
  type: a.type,
  action: a.action,
  module: a.module,
  summary: a.summary,
  outcome: a.outcome,
  status: a.status,
  method: a.method,
  path: a.path,
  targetLabel: a.targetLabel,
  ip: a.ip,
  userAgent: a.userAgent,
  createdAt: a.createdAt,
});

const dayStart = (key) => new Date(new Date(`${key}T00:00:00Z`).getTime() - TZ_OFFSET_MS);

const listActivity = async ({ admin, module, outcome, type, q, from, to, page, limit }) => {
  const pageSize = PAGE_SIZES.includes(limit) ? limit : 20;
  const filter = {};
  if (admin) filter.admin = new mongoose.Types.ObjectId(admin);
  if (module) filter.module = module;
  if (outcome) filter.outcome = outcome;
  if (type) filter.type = type;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ summary: rx }, { adminName: rx }, { targetLabel: rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = dayStart(from);
    if (to) filter.createdAt.$lt = new Date(dayStart(to).getTime() + DAY_MS);
  }

  const total = await AdminActivity.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const rows = await AdminActivity.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return { items: rows.map(toActivity), pagination: { page: current, pages, total, limit: pageSize } };
};

// ------------------------------------------------------------------------------------------------
// add / edit / suspend / remove
// ------------------------------------------------------------------------------------------------
/** The plain password is returned ONCE (only its hash is stored). The new admin must choose their own password on the first sign-in. */
const createAdmin = async ({ name, email, phone, title, preset, permissions, by }) => {
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  if ((await User.countDocuments({ role: 'admin' })) >= MAX_ADMINS) throw new ApiError(400, `You can have at most ${MAX_ADMINS} admins`);

  const temporaryPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'admin',
      mustChangePassword: true,
      adminAccess: { title, preset, permissions, createdBy: by._id, createdByName: by.name },
    });
  } catch (err) {
    if (err && err.code === 11000) throw new ApiError(409, 'An account with this email already exists');
    throw err;
  }
  return { admin: toMember(user), temporaryPassword };
};

const updateAdmin = async (id, { name, phone, title, preset, permissions, isActive }) => {
  const user = await findAdmin(id);
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (title !== undefined) user.set('adminAccess.title', title);
  if (preset !== undefined) user.set('adminAccess.preset', preset);
  if (permissions !== undefined) {
    user.set('adminAccess.permissions', permissions);
    user.markModified('adminAccess.permissions');
  }
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();
  return toMember(user);
};

const resetPassword = async (id) => {
  const user = await findAdmin(id, { withHash: true });
  const temporaryPassword = generateTempPassword();
  user.passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  user.mustChangePassword = true;
  await user.save();
  return { admin: toMember(user), temporaryPassword };
};

/** The password has to match the admin's CURRENT temporary password, so this can never mail arbitrary text. */
const emailCredentials = async (id, password) => {
  const user = await findAdmin(id, { withHash: true });
  const valid = user.mustChangePassword && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new ApiError(400, 'This temporary password is no longer valid. Reset the password to get a new one.');
  await sendCredentialsEmail({ to: user.email, name: user.name, password, accountType: 'admin' });
};

/** every token issued before now stops working */
const signOutEverywhere = async (id) => {
  const user = await findAdmin(id);
  user.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000 + 1000);
  await user.save();
  return toMember(user);
};

const removeAdmin = async (id) => {
  const user = await findAdmin(id);
  const hosting = await LiveClass.countDocuments({ host: user._id, status: { $in: ['scheduled', 'live'] } });
  if (hosting) throw new ApiError(409, `This admin is the host of ${hosting} upcoming live class${hosting > 1 ? 'es' : ''}. Change the host first, or suspend the account instead.`);

  await User.deleteOne({ _id: user._id });
  await AdminPresence.deleteMany({ admin: user._id });
  // the record book (AdminActivity) is kept on purpose
  return { name: user.name, email: user.email };
};

module.exports = {
  PAGE_SIZES,
  ensureSuperAdmin,
  getOptions,
  listTeam,
  overview,
  getDetails,
  listActivity,
  createAdmin,
  updateAdmin,
  resetPassword,
  emailCredentials,
  signOutEverywhere,
  removeAdmin,
  isMailConfigured,
};