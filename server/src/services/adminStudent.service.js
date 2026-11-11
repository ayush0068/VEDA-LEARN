const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const StudentProgress = require('../models/StudentProgress');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/password');
const { sendCredentialsEmail, isMailConfigured } = require('./mail.service');
const { ensureStudentId } = require('./profile.service');

const BCRYPT_ROUNDS = 12;
const PAGE_SIZES = [10, 20, 50];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  'last-login': { lastLoginAt: -1, createdAt: -1 },
};

const toStudent = (user, courses = 0) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  studentId: user.studentId || '',
  avatar: user.avatar || '',
  isActive: user.isActive,
  mustChangePassword: Boolean(user.mustChangePassword),
  lastLoginAt: user.lastLoginAt || null,
  createdAt: user.createdAt,
  courses,
});

const assertId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'Student not found');
};

/** Only real student accounts can be managed here (admins are never touched). */
const findStudent = async (id, { withHash = false } = {}) => {
  assertId(id);
  const query = User.findOne({ _id: id, role: 'student' });
  if (withHash) query.select('+passwordHash');
  const user = await query;
  if (!user) throw new ApiError(404, 'Student not found');
  return user;
};

// ------------------------------------------------------------------------------------------------
// list + stats
// ------------------------------------------------------------------------------------------------
const listStudents = async ({ q, status, sort, page, limit }) => {
  const pageSize = PAGE_SIZES.includes(limit) ? limit : 10;
  const filter = { role: 'student' };

  if (status === 'active') Object.assign(filter, { isActive: true, mustChangePassword: { $ne: true } });
  if (status === 'pending') Object.assign(filter, { isActive: true, mustChangePassword: true });
  if (status === 'disabled') filter.isActive = false;

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { studentId: regex }, { phone: regex }];
  }

  const total = await User.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pages);

  const users = await User.find(filter)
    .sort(SORTS[sort] || SORTS.newest)
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .lean();

  // number of enrolled courses for the students on this page
  const progress = await StudentProgress.find({ user: { $in: users.map((u) => u._id) } })
    .select('user enrollments.courseSlug')
    .lean();
  const courseCount = new Map(progress.map((p) => [String(p.user), (p.enrollments || []).length]));

  return {
    students: users.map((u) => toStudent(u, courseCount.get(String(u._id)) || 0)),
    pagination: { page: current, pages, total, limit: pageSize },
  };
};

const getStats = async () => {
  const base = { role: 'student' };
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [total, active, pending, disabled, newThisMonth] = await Promise.all([
    User.countDocuments(base),
    User.countDocuments({ ...base, isActive: true, mustChangePassword: { $ne: true } }),
    User.countDocuments({ ...base, isActive: true, mustChangePassword: true }),
    User.countDocuments({ ...base, isActive: false }),
    User.countDocuments({ ...base, createdAt: { $gte: monthStart } }),
  ]);
  return { total, active, pending, disabled, newThisMonth };
};

// ------------------------------------------------------------------------------------------------
// one student (detail drawer)
// ------------------------------------------------------------------------------------------------
const getStudentDetails = async (id) => {
  const user = await findStudent(id);
  const [progress, orders] = await Promise.all([
    StudentProgress.findOne({ user: user._id }).lean(),
    Order.find({ user: user._id }).select('status total').lean(),
  ]);

  const enrollments = (progress?.enrollments || []).map((e) => ({
    slug: e.courseSlug,
    title: e.title || e.courseSlug,
    completedLessons: e.completedLessons,
    totalLessons: e.totalLessons,
  }));

  const paid = orders.filter((o) => o.status === 'paid');

  return {
    ...toStudent(user, enrollments.length),
    location: user.location || '',
    enrollments,
    orders: { count: orders.length, paid: paid.length, spent: paid.reduce((sum, o) => sum + (o.total || 0), 0) },
  };
};

// ------------------------------------------------------------------------------------------------
// create / edit / reset / delete
// ------------------------------------------------------------------------------------------------
/** Creates the account with a random password. The plain password is returned ONCE (it is only stored hashed). */
const createStudent = async ({ name, email, phone }) => {
  if (await User.exists({ email })) throw new ApiError(409, 'A student with this email already exists');

  const temporaryPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({ name, email, phone, passwordHash, role: 'student', mustChangePassword: true });
  } catch (err) {
    if (err && err.code === 11000) throw new ApiError(409, 'A student with this email already exists');
    throw err;
  }

  const withId = await ensureStudentId(user);
  return { student: toStudent(withId, 0), temporaryPassword };
};

const updateStudent = async (id, { name, phone, isActive }) => {
  const user = await findStudent(id);
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();
  return toStudent(user);
};

/** New random password; the student is signed out everywhere and must change it again on the next login. */
const resetStudentPassword = async (id) => {
  const user = await findStudent(id, { withHash: true });

  const temporaryPassword = generateTempPassword();
  user.passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  user.mustChangePassword = true;
  await user.save();

  return { student: toStudent(user), temporaryPassword };
};

/**
 * E-mails the login details. The password has to match the student's CURRENT temporary password, so this
 * endpoint can never be used to send arbitrary text to a student.
 */
const emailCredentials = async (id, password) => {
  const user = await findStudent(id, { withHash: true });

  const valid = user.mustChangePassword && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw new ApiError(400, 'This temporary password is no longer valid. Reset the password to get a new one.');

  await sendCredentialsEmail({ to: user.email, name: user.name, password });
};

const deleteStudent = async (id) => {
  const user = await findStudent(id);

  if (await Order.exists({ user: user._id, status: { $in: ['paid', 'refunded'] } })) {
    throw new ApiError(409, 'This student has payment records, so the account cannot be deleted. Disable it instead.');
  }

  await Promise.all([Cart.deleteOne({ user: user._id }), StudentProgress.deleteOne({ user: user._id }), Order.deleteMany({ user: user._id })]);
  await User.deleteOne({ _id: user._id });
};

module.exports = {
  PAGE_SIZES,
  listStudents,
  getStats,
  getStudentDetails,
  createStudent,
  updateStudent,
  resetStudentPassword,
  emailCredentials,
  deleteStudent,
  isMailConfigured,
};