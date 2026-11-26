const { can } = require('../config/adminAccess');
const { env } = require('../config/env');
const Course = require('../models/Course');
const InstructorProfile = require('../models/InstructorProfile');
const LiveClass = require('../models/LiveClass');
const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { removeUploadedFile } = require('../utils/media');
const { getRoomInfo } = require('../live/rooms');

const MIN = 60 * 1000;
const JOIN_OPENS_BEFORE_MIN = 30; // students can enter the waiting room this long before the start
const JOIN_CLOSES_AFTER_MIN = 180; // ... and this long after the planned end (the host may overrun)
const PAGE_SIZES = [8, 12, 20];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const idOf = (doc) => String(doc._id);

// ------------------------------------------------------------------------------------------------
// shapes
// ------------------------------------------------------------------------------------------------
const hostOf = (c) => (c.host && c.host.name ? { id: idOf(c.host), name: c.host.name, role: c.host.role } : { id: String(c.host || ''), name: 'Instructor', role: 'instructor' });

const base = (c, courseTitles) => ({
  id: idOf(c),
  title: c.title,
  description: c.description || '',
  courseSlug: c.courseSlug || '',
  courseTitle: (c.courseSlug && courseTitles.get(c.courseSlug)) || '',
  host: hostOf(c),
  startsAt: c.startsAt,
  endsAt: c.endsAt,
  durationMin: c.durationMin,
  maxStudents: c.maxStudents,
  status: c.status,
  features: {
    chat: c.features?.chat !== false,
    handRaise: c.features?.handRaise !== false,
    polls: c.features?.polls !== false,
    reactions: c.features?.reactions !== false,
    studentCamera: Boolean(c.features?.studentCamera),
    recording: c.features?.recording !== false,
  },
  resources: (c.resources || []).map((r) => ({ title: r.title, url: r.url })),
});

const courseTitleMap = async (slugs) => {
  const list = [...new Set(slugs.filter(Boolean))];
  if (list.length === 0) return new Map();
  const rows = await Course.find({ slug: { $in: list } }).select('slug title').lean();
  return new Map(rows.map((r) => [r.slug, r.title]));
};

const toAdmin = (c, titles) => {
  const room = getRoomInfo(c._id);
  return {
    ...base(c, titles),
    access: c.access,
    startedAt: c.startedAt || null,
    endedAt: c.endedAt || null,
    cancelReason: c.cancelReason || '',
    peakStudents: c.peakStudents || 0,
    attendeeCount: (c.attendance || []).length,
    studentsNow: room.students,
    hostPresent: room.hostPresent,
    recording: c.recording?.url ? { url: c.recording.url, size: c.recording.size || 0, durationSec: c.recording.durationSec || 0, createdAt: c.recording.createdAt || null } : null,
    createdAt: c.createdAt,
  };
};

const toStudent = (c, titles, extra = {}) => {
  const room = getRoomInfo(c._id);
  const opensAt = new Date(c.startsAt.getTime() - JOIN_OPENS_BEFORE_MIN * MIN);
  return {
    ...base(c, titles),
    studentsNow: room.students,
    hostPresent: room.hostPresent,
    joinOpensAt: opensAt,
    recordingUrl: c.status === 'ended' && c.recording?.url ? c.recording.url : '',
    ...extra,
  };
};

// ------------------------------------------------------------------------------------------------
// admin: options, list, details
// ------------------------------------------------------------------------------------------------
const getOptions = async () => {
  const [courses, users, profiles] = await Promise.all([
    Course.find({ isActive: { $ne: false } }).select('slug title').sort({ title: 1 }).lean(),
    User.find({ role: { $in: ['admin', 'instructor'] }, isActive: true }).select('name role isSuperAdmin adminAccess').sort({ name: 1 }).lean(),
    InstructorProfile.find({ 'permissions.hostLiveClasses': true }).select('user').lean(),
  ]);
  const allowed = new Set(profiles.map((p) => String(p.user)));
  const hosts = users.filter((u) => (u.role === 'admin' ? can(u, 'liveClasses', 'edit') : allowed.has(String(u._id)))).map((u) => ({ id: String(u._id), name: u.name, role: u.role }));

  return {
    courses: courses.map((c) => ({ slug: c.slug, title: c.title })),
    hosts,
    limits: { maxStudentsLimit: env.live.maxStudentsLimit, defaultMaxStudents: env.live.defaultMaxStudents },
  };
};

const tabFilter = (tab, now) => {
  switch (tab) {
    case 'live':
      return { status: 'live' };
    case 'upcoming':
      return { status: 'scheduled', endsAt: { $gte: now } };
    case 'past':
      return { $or: [{ status: 'ended' }, { status: 'scheduled', endsAt: { $lt: now } }] };
    case 'cancelled':
      return { status: 'cancelled' };
    default:
      return {};
  }
};

const getStats = async () => {
  const now = new Date();
  const [live, upcoming, past, cancelled, total] = await Promise.all(
    ['live', 'upcoming', 'past', 'cancelled'].map((tab) => LiveClass.countDocuments(tabFilter(tab, now))).concat(LiveClass.countDocuments({})),
  );
  return { live, upcoming, past, cancelled, total };
};

const listClasses = async ({ tab, q, course, page, limit }) => {
  const now = new Date();
  const pageSize = PAGE_SIZES.includes(limit) ? limit : 8;
  const filter = { ...tabFilter(tab, now) };
  if (course) filter.courseSlug = course;
  if (q) filter.title = new RegExp(escapeRegex(q), 'i');

  const total = await LiveClass.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page || 1, 1), pages);
  const sort = tab === 'past' || tab === 'cancelled' || !tab ? { startsAt: -1 } : { startsAt: 1 };

  const rows = await LiveClass.find(filter)
    .select('-messages -attendance.email')
    .populate('host', 'name role')
    .sort(sort)
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .lean();
  const titles = await courseTitleMap(rows.map((r) => r.courseSlug));

  return { classes: rows.map((r) => toAdmin(r, titles)), pagination: { page: current, pages, total, limit: pageSize } };
};

const findClass = async (id) => {
  if (!/^[a-f0-9]{24}$/i.test(String(id))) throw new ApiError(404, 'Live class not found');
  const c = await LiveClass.findById(id).populate('host', 'name role');
  if (!c) throw new ApiError(404, 'Live class not found');
  return c;
};

const getClassDetails = async (id) => {
  const c = await findClass(id);
  const titles = await courseTitleMap([c.courseSlug]);
  return {
    ...toAdmin(c, titles),
    attendance: (c.attendance || []).map((a) => ({
      userId: String(a.user),
      name: a.name,
      email: a.email,
      firstJoinedAt: a.firstJoinedAt,
      lastLeftAt: a.lastLeftAt || null,
      totalSeconds: a.totalSeconds || 0,
      joins: a.joins || 1,
    })),
    polls: c.polls || [],
    messageCount: (c.messages || []).length,
  };
};

// ------------------------------------------------------------------------------------------------
// admin: write
// ------------------------------------------------------------------------------------------------
const assertHost = async (hostId) => {
  const user = await User.findById(hostId).select('name role isActive isSuperAdmin adminAccess');
  if (!user || !user.isActive || !['admin', 'instructor'].includes(user.role)) throw new ApiError(400, 'Please choose a valid host');
  if (user.role === 'admin' && !can(user, 'liveClasses', 'edit')) throw new ApiError(400, `${user.name} is not allowed to host live classes`);
  if (user.role === 'instructor') {
    const profile = await InstructorProfile.findOne({ user: user._id }).select('permissions').lean();
    if (!profile?.permissions?.hostLiveClasses) throw new ApiError(400, `${user.name} does not have the "Host live classes" permission`);
  }
};

const assertCourse = async (slug) => {
  if (slug && !(await Course.exists({ slug }))) throw new ApiError(400, 'This course does not exist');
};

const assertLimits = (maxStudents) => {
  if (maxStudents > env.live.maxStudentsLimit) throw new ApiError(400, `Max students cannot be more than ${env.live.maxStudentsLimit}`);
};

const createClass = async (fields) => {
  await Promise.all([assertHost(fields.host), assertCourse(fields.courseSlug)]);
  assertLimits(fields.maxStudents);
  if (fields.startsAt.getTime() < Date.now() - 5 * MIN) throw new ApiError(400, 'The start time is in the past');

  const doc = await LiveClass.create({ ...fields, endsAt: new Date(fields.startsAt.getTime() + fields.durationMin * MIN) });
  return getClassDetails(doc._id);
};

const updateClass = async (id, fields) => {
  const c = await findClass(id);
  if (c.status === 'live') throw new ApiError(409, 'This class is live right now. End it before editing.');
  if (c.status === 'ended') throw new ApiError(409, 'This class has already finished');

  if (fields.host) await assertHost(fields.host);
  if (fields.courseSlug) await assertCourse(fields.courseSlug);
  if (fields.maxStudents) assertLimits(fields.maxStudents);

  c.set(fields);
  c.endsAt = new Date(c.startsAt.getTime() + c.durationMin * MIN);
  // a cancelled / missed class that gets a new date is scheduled again
  if (fields.startsAt && c.status === 'cancelled') {
    c.status = 'scheduled';
    c.cancelReason = '';
  }
  await c.save();
  return getClassDetails(c._id);
};

const cancelClass = async (id, reason) => {
  const c = await findClass(id);
  if (c.status === 'live') throw new ApiError(409, 'This class is live right now. End it from the class room.');
  if (c.status !== 'scheduled') throw new ApiError(409, 'Only a scheduled class can be cancelled');
  c.status = 'cancelled';
  c.cancelReason = reason || '';
  await c.save();
  return getClassDetails(c._id);
};

const deleteClass = async (id) => {
  const c = await findClass(id);
  if (c.status === 'live') throw new ApiError(409, 'This class is live right now. End it before deleting.');
  await LiveClass.deleteOne({ _id: c._id });
  if (c.recording?.url) await removeUploadedFile(c.recording.url);
};

const removeRecording = async (id) => {
  const c = await findClass(id);
  const url = c.recording?.url;
  c.recording = { url: '', size: 0, durationSec: 0 };
  await c.save();
  if (url) await removeUploadedFile(url);
  return getClassDetails(c._id);
};

// ------------------------------------------------------------------------------------------------
// students
// ------------------------------------------------------------------------------------------------
const enrolledSlugs = async (userId) => {
  const progress = await StudentProgress.findOne({ user: userId }).select('enrollments.courseSlug').lean();
  return (progress?.enrollments || []).map((e) => e.courseSlug);
};

const mayAccess = (cls, slugs) => cls.access === 'everyone' || !cls.courseSlug || slugs.includes(cls.courseSlug);

/** Classes a student may see: live now, coming up, and recent ones that have a recording. */
const listForStudent = async (user) => {
  const slugs = await enrolledSlugs(user._id);
  const now = Date.now();

  const rows = await LiveClass.find({
    $or: [
      { status: { $in: ['live', 'scheduled'] }, endsAt: { $gte: new Date(now - 24 * 60 * MIN) } },
      { status: 'ended', 'recording.url': { $ne: '' }, endedAt: { $gte: new Date(now - 60 * 24 * 60 * MIN) } },
    ],
  })
    .select('-messages -attendance -polls')
    .populate('host', 'name role')
    .sort({ startsAt: 1 })
    .limit(200)
    .lean();

  const visible = rows.filter((c) => mayAccess(c, slugs));
  const titles = await courseTitleMap(visible.map((c) => c.courseSlug));
  return visible.map((c) => toStudent(c, titles, { enrolled: !c.courseSlug || slugs.includes(c.courseSlug) }));
};

const getForStudent = async (user, id) => {
  const c = await findClass(id);
  const slugs = await enrolledSlugs(user._id);
  if (!mayAccess(c, slugs)) throw new ApiError(403, 'This class is for students of the course. Enrol in the course to join.');
  const titles = await courseTitleMap([c.courseSlug]);
  return toStudent(c.toObject(), titles, { enrolled: !c.courseSlug || slugs.includes(c.courseSlug) });
};

// ------------------------------------------------------------------------------------------------
// public listing (the website's Live Classes page, no sign-in needed)
// ------------------------------------------------------------------------------------------------
const PUBLIC_RECORDING_DAYS = 90;

const toPublic = (c, meta) => {
  const m = meta.get(c.courseSlug) || {};
  const room = getRoomInfo(c._id);
  return {
    ...toStudent(c, new Map([[c.courseSlug, m.title || '']])),
    resources: [], // study material is only for people inside the class
    courseCategory: m.category || '',
    courseImage: m.image || '',
    registered: c.status === 'live' ? room.students : c.peakStudents || 0,
  };
};

const courseMetaMap = async (slugs) => {
  const list = [...new Set(slugs.filter(Boolean))];
  if (list.length === 0) return new Map();
  const rows = await Course.find({ slug: { $in: list } }).select('slug title category image').lean();
  return new Map(rows.map((r) => [r.slug, r]));
};

/** live now + upcoming + recent recordings, for everybody (cancelled / not-held classes are left out) */
const listPublic = async () => {
  const now = new Date();
  const since = new Date(now.getTime() - PUBLIC_RECORDING_DAYS * 24 * 60 * MIN);
  const rows = await LiveClass.find({
    $or: [
      { status: 'live' },
      { status: 'scheduled', endsAt: { $gte: now } },
      { status: 'ended', 'recording.url': { $exists: true, $ne: '' }, endedAt: { $gte: since } },
    ],
  })
    .select('-messages -attendance -polls')
    .populate('host', 'name role')
    .sort({ startsAt: 1 })
    .limit(300)
    .lean();
  const meta = await courseMetaMap(rows.map((c) => c.courseSlug));
  return rows.map((c) => toPublic(c, meta));
};

const getPublic = async (id) => {
  if (!/^[a-f0-9]{24}$/i.test(String(id))) throw new ApiError(404, 'Live class not found');
  const c = await LiveClass.findById(id).select('-messages -attendance -polls').populate('host', 'name role').lean();
  if (!c || c.status === 'cancelled') throw new ApiError(404, 'Live class not found');
  const meta = await courseMetaMap([c.courseSlug]);
  return toPublic(c, meta);
};

// ------------------------------------------------------------------------------------------------
// signalling server helpers (live/socket.js)
// ------------------------------------------------------------------------------------------------
const isHost = (user, cls) => (user.role === 'admin' && can(user, 'liveClasses', 'edit')) || (user.role === 'instructor' && String(cls.host?._id || cls.host) === String(user._id));

/**
 * Decides whether `user` may enter the room of class `id`.
 * Returns { cls, role } or throws an ApiError whose message is shown to the person.
 */
const authorizeJoin = async (user, id) => {
  const cls = await findClass(id);
  if (cls.status === 'cancelled') throw new ApiError(410, 'This class was cancelled');
  if (cls.status === 'ended') throw new ApiError(410, 'This class has ended');

  if (isHost(user, cls)) return { cls, role: 'host' };
  if (user.role !== 'student') throw new ApiError(403, 'You are not the host of this class');

  const slugs = await enrolledSlugs(user._id);
  if (!mayAccess(cls, slugs)) throw new ApiError(403, 'This class is for students of the course. Enrol in the course to join.');

  const now = Date.now();
  if (cls.status !== 'live' && now < cls.startsAt.getTime() - JOIN_OPENS_BEFORE_MIN * MIN) {
    throw new ApiError(425, `The class room opens ${JOIN_OPENS_BEFORE_MIN} minutes before the start time`);
  }
  if (cls.status !== 'live' && now > cls.endsAt.getTime() + JOIN_CLOSES_AFTER_MIN * MIN) throw new ApiError(410, 'This class is over');
  return { cls, role: 'student' };
};

const markLive = (id) => LiveClass.updateOne({ _id: id, status: 'scheduled' }, { $set: { status: 'live', startedAt: new Date() } });

const markEnded = (id, { peak = 0 } = {}) =>
  LiveClass.updateOne({ _id: id, status: { $in: ['live', 'scheduled'] } }, { $set: { status: 'ended', endedAt: new Date(), peakStudents: peak } });

/** first join of a student counts as "attended"; later joins only add to the time */
const recordJoin = async (id, user) => {
  const now = new Date();
  const again = await LiveClass.updateOne({ _id: id, 'attendance.user': user._id }, { $inc: { 'attendance.$.joins': 1 } });
  if (again.matchedCount > 0) return;
  await LiveClass.updateOne(
    { _id: id, 'attendance.user': { $ne: user._id } },
    { $push: { attendance: { user: user._id, name: user.name, email: user.email, firstJoinedAt: now, joins: 1 } } },
  );
  await StudentProgress.updateOne({ user: user._id }, { $inc: { liveClassesAttended: 1 } }).catch(() => {});
};

const recordLeave = (id, userId, seconds) =>
  LiveClass.updateOne({ _id: id, 'attendance.user': userId }, { $inc: { 'attendance.$.totalSeconds': Math.max(0, Math.round(seconds)) }, $set: { 'attendance.$.lastLeftAt': new Date() } });

const saveMessages = (id, messages) => (messages.length ? LiveClass.updateOne({ _id: id }, { $push: { messages: { $each: messages, $slice: -500 } } }) : null);

const savePolls = (id, polls) => (polls.length ? LiveClass.updateOne({ _id: id }, { $push: { polls: { $each: polls } } }) : null);

const setRecording = async (id, rec) => {
  const c = await LiveClass.findById(id).select('recording');
  const old = c?.recording?.url;
  await LiveClass.updateOne({ _id: id }, { $set: { recording: { ...rec, createdAt: new Date() } } });
  if (old && old !== rec.url) await removeUploadedFile(old);
};

/** A "live" class whose host never came back (server restart etc.) is closed after a while. */
const closeStaleLiveClasses = () => LiveClass.updateMany({ status: 'live', endsAt: { $lt: new Date(Date.now() - 6 * 60 * MIN) } }, { $set: { status: 'ended', endedAt: new Date() } });

module.exports = {
  getOptions,
  getStats,
  listClasses,
  getClassDetails,
  createClass,
  updateClass,
  cancelClass,
  deleteClass,
  removeRecording,
  listForStudent,
  getForStudent,
  listPublic,
  getPublic,
  authorizeJoin,
  markLive,
  markEnded,
  recordJoin,
  recordLeave,
  saveMessages,
  savePolls,
  setRecording,
  closeStaleLiveClasses,
  isHost,
};