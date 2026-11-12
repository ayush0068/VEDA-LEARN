const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { PERMISSIONS, ROLES, SLOT_KINDS, presetFor } = require('../config/instructorAccess');
const Course = require('../models/Course');
const InstructorProfile = require('../models/InstructorProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/password');
const { sendCredentialsEmail, isMailConfigured } = require('./mail.service');

const BCRYPT_ROUNDS = 12;
const PAGE_SIZES = [6, 9, 12, 24];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toMinutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  'last-login': { lastLoginAt: -1, createdAt: -1 },
};

// ------------------------------------------------------------------------------------------------
// shapes sent to the admin panel
// ------------------------------------------------------------------------------------------------
const weeklyHours = (schedule = []) =>
  Math.round((schedule.reduce((sum, s) => sum + (toMinutes(s.end) - toMinutes(s.start)), 0) / 60) * 10) / 10;

const toSlot = (s) => ({ id: String(s._id), day: s.day, start: s.start, end: s.end, kind: s.kind, title: s.title || '', courseSlug: s.courseSlug || '' });

const toListItem = (user, profile) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  avatar: user.avatar || '',
  isActive: user.isActive,
  mustChangePassword: Boolean(user.mustChangePassword),
  lastLoginAt: user.lastLoginAt || null,
  createdAt: user.createdAt,
  title: profile?.title || '',
  instructorRole: profile?.instructorRole || 'instructor',
  expertise: profile?.expertise || [],
  courseCount: (profile?.courses || []).length,
  sessionsPerWeek: (profile?.schedule || []).length,
  hoursPerWeek: weeklyHours(profile?.schedule),
  permissionCount: Object.values(profile?.permissions || {}).filter(Boolean).length,
});

const toDetails = async (user, profile) => {
  const slugs = profile?.courses || [];
  const courses = slugs.length ? await Course.find({ slug: { $in: slugs } }).select('slug title').lean() : [];
  const titleOf = new Map(courses.map((c) => [c.slug, c.title]));

  return {
    ...toListItem(user, profile),
    location: user.location || '',
    bio: profile?.bio || '',
    experienceYears: profile?.experienceYears || 0,
    permissions: Object.fromEntries(PERMISSIONS.map(({ key }) => [key, Boolean(profile?.permissions?.[key])])),
    courses: slugs.map((slug) => ({ slug, title: titleOf.get(slug) || slug })),
    timezone: profile?.timezone || 'Asia/Kolkata',
    schedule: (profile?.schedule || []).map(toSlot),
  };
};

const assertId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Instructor not found');
};

const findInstructor = async (id, { withHash = false } = {}) => {
  assertId(id);
  const query = User.findOne({ _id: id, role: 'instructor' });
  if (withHash) query.select('+passwordHash');
  const user = await query;
  if (!user) throw new ApiError(404, 'Instructor not found');
  return user;
};

/** every instructor should have a teaching profile; make one if it is somehow missing */
const findProfile = async (user) =>
  (await InstructorProfile.findOne({ user: user._id })) || InstructorProfile.create({ user: user._id, permissions: presetFor('instructor') });

/** course slugs must exist */
const assertCoursesExist = async (slugs) => {
  if (slugs.length === 0) return;
  const found = await Course.find({ slug: { $in: slugs } }).select('slug').lean();
  const known = new Set(found.map((c) => c.slug));
  const missing = slugs.filter((s) => !known.has(s));
  if (missing.length) throw new ApiError(400, `Unknown course: ${missing.join(', ')}`);
};

/** no two sessions of one instructor may overlap on the same day */
const assertNoOverlap = (schedule) => {
  for (let day = 0; day < 7; day += 1) {
    const slots = schedule.filter((s) => s.day === day).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (let i = 1; i < slots.length; i += 1) {
      if (toMinutes(slots[i].start) < toMinutes(slots[i - 1].end)) {
        throw new ApiError(400, `${DAY_NAMES[day]}: ${slots[i - 1].start}-${slots[i - 1].end} overlaps with ${slots[i].start}-${slots[i].end}`);
      }
    }
  }
};

// ------------------------------------------------------------------------------------------------
// options for the forms (roles, permissions, session types, courses)
// ------------------------------------------------------------------------------------------------
const getOptions = async () => {
  const courses = await Course.find({}).select('slug title isActive').sort({ title: 1 }).lean();
  return {
    roles: ROLES,
    permissions: PERMISSIONS,
    kinds: SLOT_KINDS,
    courses: courses.map((c) => ({ slug: c.slug, title: c.title, isActive: c.isActive !== false })),
  };
};

// ------------------------------------------------------------------------------------------------
// list + stats
// ------------------------------------------------------------------------------------------------
const listInstructors = async ({ q, status, role, sort, page, limit }) => {
  const pageSize = PAGE_SIZES.includes(limit) ? limit : 9;
  const filter = { role: 'instructor' };
  const and = [];

  if (status === 'active') Object.assign(filter, { isActive: true, mustChangePassword: { $ne: true } });
  if (status === 'pending') Object.assign(filter, { isActive: true, mustChangePassword: true });
  if (status === 'disabled') filter.isActive = false;

  if (role) and.push({ _id: { $in: await InstructorProfile.find({ instructorRole: role }).distinct('user') } });

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    const profileUsers = await InstructorProfile.find({ $or: [{ title: regex }, { expertise: regex }] }).distinct('user');
    and.push({ $or: [{ name: regex }, { email: regex }, { phone: regex }, { _id: { $in: profileUsers } }] });
  }
  if (and.length) filter.$and = and;

  const total = await User.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pages);

  const users = await User.find(filter)
    .sort(SORTS[sort] || SORTS.newest)
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const profiles = await InstructorProfile.find({ user: { $in: users.map((u) => u._id) } }).lean();
  const byUser = new Map(profiles.map((p) => [String(p.user), p]));

  return {
    instructors: users.map((u) => toListItem(u, byUser.get(String(u._id)))),
    pagination: { page: current, pages, total, limit: pageSize },
  };
};

const getStats = async () => {
  const base = { role: 'instructor' };
  const [total, active, pending, disabled, sessions] = await Promise.all([
    User.countDocuments(base),
    User.countDocuments({ ...base, isActive: true, mustChangePassword: { $ne: true } }),
    User.countDocuments({ ...base, isActive: true, mustChangePassword: true }),
    User.countDocuments({ ...base, isActive: false }),
    InstructorProfile.aggregate([{ $group: { _id: null, n: { $sum: { $size: '$schedule' } } } }]),
  ]);
  return { total, active, pending, disabled, sessionsPerWeek: sessions[0]?.n || 0 };
};

const getInstructorDetails = async (id) => {
  const user = await findInstructor(id);
  return toDetails(user, await InstructorProfile.findOne({ user: user._id }).lean());
};

/** every session of every active instructor (the "Weekly schedule" tab) */
const getScheduleOverview = async () => {
  const profiles = await InstructorProfile.find({ 'schedule.0': { $exists: true } }).lean();
  const users = await User.find({ _id: { $in: profiles.map((p) => p.user) }, role: 'instructor', isActive: true }).select('name avatar').lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const slugs = [...new Set(profiles.flatMap((p) => p.schedule.map((s) => s.courseSlug).filter(Boolean)))];
  const courses = slugs.length ? await Course.find({ slug: { $in: slugs } }).select('slug title').lean() : [];
  const titleOf = new Map(courses.map((c) => [c.slug, c.title]));

  const entries = [];
  profiles.forEach((p) => {
    const user = userById.get(String(p.user));
    if (!user) return;
    p.schedule.forEach((s) =>
      entries.push({
        instructorId: String(user._id),
        name: user.name,
        avatar: user.avatar || '',
        instructorRole: p.instructorRole,
        ...toSlot(s),
        courseTitle: s.courseSlug ? titleOf.get(s.courseSlug) || s.courseSlug : '',
      }),
    );
  });

  return { entries };
};

// ------------------------------------------------------------------------------------------------
// create / edit / reset / delete
// ------------------------------------------------------------------------------------------------
/** Creates the login (random password, shown once) and the teaching profile. Access starts from the chosen role's preset. */
const createInstructor = async ({ name, email, phone, title, instructorRole, permissions }) => {
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

  const temporaryPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({ name, email, phone, passwordHash, role: 'instructor', mustChangePassword: true });
  } catch (err) {
    if (err && err.code === 11000) throw new ApiError(409, 'An account with this email already exists');
    throw err;
  }

  let profile;
  try {
    profile = await InstructorProfile.create({ user: user._id, title, instructorRole, permissions: permissions || presetFor(instructorRole) });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // do not leave a login without a profile
    throw err;
  }

  return { instructor: toListItem(user, profile.toObject()), temporaryPassword };
};

/**
 * Partial update. `account` fields live on the User, everything else on the InstructorProfile.
 * Courses / schedule / permissions are validated here because they need the database.
 */
const updateInstructor = async (id, { account = {}, profile: changes = {} }) => {
  const user = await findInstructor(id);
  const profile = await findProfile(user);

  if (account.name !== undefined) user.name = account.name;
  if (account.phone !== undefined) user.phone = account.phone;
  if (account.isActive !== undefined) user.isActive = account.isActive;

  ['title', 'bio', 'experienceYears', 'expertise', 'instructorRole'].forEach((key) => {
    if (changes[key] !== undefined) profile[key] = changes[key];
  });
  if (changes.permissions !== undefined) profile.permissions = changes.permissions;

  if (changes.courses !== undefined) {
    await assertCoursesExist(changes.courses);
    profile.courses = changes.courses;
    // a session cannot point at a course the instructor no longer teaches
    profile.schedule.forEach((slot) => {
      if (slot.courseSlug && !changes.courses.includes(slot.courseSlug)) slot.courseSlug = '';
    });
  }

  if (changes.schedule !== undefined) {
    assertNoOverlap(changes.schedule);
    const linked = [...new Set(changes.schedule.map((s) => s.courseSlug).filter(Boolean))];
    const allowed = new Set(profile.courses);
    const notAssigned = linked.filter((slug) => !allowed.has(slug));
    if (notAssigned.length) throw new ApiError(400, `Assign the course to this instructor first: ${notAssigned.join(', ')}`);
    profile.schedule = changes.schedule;
  }

  await Promise.all([user.save(), profile.save()]);
  return toDetails(user, profile.toObject());
};

/** New random password; the instructor is signed out everywhere and must change it again on the next login. */
const resetInstructorPassword = async (id) => {
  const user = await findInstructor(id, { withHash: true });

  const temporaryPassword = generateTempPassword();
  user.passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  user.mustChangePassword = true;
  await user.save();

  const profile = await InstructorProfile.findOne({ user: user._id }).lean();
  return { instructor: toListItem(user, profile), temporaryPassword };
};

/** The password must match the CURRENT temporary password, so this can never mail arbitrary text. */
const emailCredentials = async (id, password) => {
  const user = await findInstructor(id, { withHash: true });

  const valid = user.mustChangePassword && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new ApiError(400, 'This temporary password is no longer valid. Reset the password to get a new one.');

  await sendCredentialsEmail({ to: user.email, name: user.name, password, accountType: 'instructor' });
};

const deleteInstructor = async (id) => {
  const user = await findInstructor(id);
  await InstructorProfile.deleteOne({ user: user._id });
  await User.deleteOne({ _id: user._id });
};

module.exports = {
  PAGE_SIZES,
  getOptions,
  listInstructors,
  getStats,
  getInstructorDetails,
  getScheduleOverview,
  createInstructor,
  updateInstructor,
  resetInstructorPassword,
  emailCredentials,
  deleteInstructor,
  isMailConfigured,
};