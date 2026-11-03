const bcrypt = require('bcryptjs');
const Counter = require('../models/Counter');
const Order = require('../models/Order');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken, toPublicUser } = require('./auth.service');

const BCRYPT_ROUNDS = 12;

const NOTIFICATION_KEYS = ['liveClasses', 'courseUpdates', 'assignments', 'offers', 'emailNotifications'];
const PRIVACY_KEYS = ['profileVisible', 'showEmail', 'showProgress'];

const pick = (source, keys) => Object.fromEntries(keys.map((key) => [key, Boolean(source && source[key])]));

/** Everything the profile page shows (never includes the password hash). */
const toProfile = (user) => ({
  ...toPublicUser(user),
  studentId: user.studentId || '',
  isActive: user.isActive,
  phone: user.phone || '',
  dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : '',
  gender: user.gender || '',
  location: user.location || '',
  bio: user.bio || '',
  notifications: pick(user.notifications, NOTIFICATION_KEYS),
  privacy: pick(user.privacy, PRIVACY_KEYS),
});

/** VD-<year you joined>-<running number>, handed out once, on the first profile visit. */
const ensureStudentId = async (user) => {
  if (user.studentId) return user;

  const year = new Date(user.createdAt || Date.now()).getFullYear();
  const counter = await Counter.findOneAndUpdate({ _id: `student-${year}` }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  const studentId = `VD-${year}-${String(counter.seq).padStart(3, '0')}`;

  // only the first of two simultaneous requests wins; the loser just re-reads
  await User.updateOne({ _id: user._id, studentId: { $exists: false } }, { $set: { studentId } });
  return User.findById(user._id);
};

const getProfile = async (user) => toProfile(await ensureStudentId(user));

const updateProfile = async (user, fields) => {
  const doc = await User.findById(user._id);
  doc.set(fields);
  await doc.save();
  return toProfile(await ensureStudentId(doc));
};

const setAvatar = async (user, avatar) => {
  await User.updateOne({ _id: user._id }, { $set: { avatar } });
  return { avatar };
};

const updateNotifications = async (user, values) => {
  const $set = Object.fromEntries(Object.entries(values).map(([key, value]) => [`notifications.${key}`, value]));
  const updated = await User.findByIdAndUpdate(user._id, { $set }, { returnDocument: 'after' });
  return pick(updated.notifications, NOTIFICATION_KEYS);
};

const updatePrivacy = async (user, values) => {
  const $set = Object.fromEntries(Object.entries(values).map(([key, value]) => [`privacy.${key}`, value]));
  const updated = await User.findByIdAndUpdate(user._id, { $set }, { returnDocument: 'after' });
  return pick(updated.privacy, PRIVACY_KEYS);
};

const assertPassword = async (userId, password) => {
  const withHash = await User.findById(userId).select('+passwordHash');
  const ok = await bcrypt.compare(password, withHash.passwordHash);
  if (!ok) throw new ApiError(400, 'Your current password is not correct');
  return withHash;
};

/** Changes the sign-in email after re-checking the password. */
const changeEmail = async (user, { email, password }) => {
  await assertPassword(user._id, password);

  if (email === user.email) throw new ApiError(400, 'This is already your email address');
  if (await User.exists({ email, _id: { $ne: user._id } })) throw new ApiError(409, 'An account with this email already exists');

  try {
    await User.updateOne({ _id: user._id }, { $set: { email } });
  } catch (err) {
    if (err && err.code === 11000) throw new ApiError(409, 'An account with this email already exists');
    throw err;
  }
  return { email };
};

/** Changes the password. Older tokens stop working, so a fresh one is returned for this device. */
const changePassword = async (user, { currentPassword, newPassword, remember }) => {
  const withHash = await assertPassword(user._id, currentPassword);

  if (await bcrypt.compare(newPassword, withHash.passwordHash)) {
    throw new ApiError(400, 'Your new password must be different from the current one');
  }

  withHash.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  // whole seconds, so the token signed right below (same second) is still accepted
  withHash.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  await withHash.save();

  return { token: signToken(withHash, remember) };
};

const listOrders = async (user) => {
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(50).lean();
  return orders.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    items: o.items,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    currency: o.currency,
    paymentMethod: o.paymentMethod,
    status: o.status,
    createdAt: o.createdAt,
  }));
};

module.exports = {
  NOTIFICATION_KEYS,
  PRIVACY_KEYS,
  getProfile,
  updateProfile,
  setAvatar,
  updateNotifications,
  updatePrivacy,
  changeEmail,
  changePassword,
  listOrders,
};