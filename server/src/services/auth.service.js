const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const BCRYPT_ROUNDS = 12;
// Compared against when the email doesn't exist, so "unknown email" and "wrong password"
// take the same time and can't be told apart.
const DUMMY_HASH = bcrypt.hashSync('vedalearn-not-a-real-password', BCRYPT_ROUNDS);

const toPublicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const signToken = (user, remember) =>
  jwt.sign({ role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    subject: String(user._id),
    expiresIn: remember ? env.jwtRememberExpiresIn : env.jwtExpiresIn,
  });

const emailTaken = () => new ApiError(409, 'An account with this email already exists');

/** Creates the account and signs the user in. Returns { user, token }. */
const registerUser = async ({ name, email, password }) => {
  if (await User.exists({ email })) throw emailTaken();

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (err) {
    // two sign-ups with the same email racing each other
    if (err && err.code === 11000) throw emailTaken();
    throw err;
  }

  // signing up keeps you signed in on this device (the client stores the token in localStorage)
  return { user: toPublicUser(user), token: signToken(user, true) };
};

/** Checks the credentials. Returns { user, token }. */
const loginUser = async ({ email, password, remember }) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !passwordOk) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been disabled. Please contact support.');

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  return { user: toPublicUser(user), token: signToken(user, Boolean(remember)) };
};

/** Verifies a JWT and returns the (active) user it belongs to. */
const getUserFromToken = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Your session has expired. Please sign in again.');
  return user;
};

module.exports = { registerUser, loginUser, getUserFromToken, toPublicUser };