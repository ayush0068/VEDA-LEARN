const { getDbState } = require('../config/db');
const { getUserFromToken } = require('../services/auth.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// While a student still has the temporary password an admin generated, only these two calls work.
const ALLOWED_WITH_TEMP_PASSWORD = [
  ['GET', '/api/auth/me'],
  ['PATCH', '/api/profile/password'],
];

/** Requires a valid "Authorization: Bearer <token>" header. Puts the user on req.user. */
const protect = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Please sign in to continue');

  if (getDbState() !== 'connected') throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');

  req.user = await getUserFromToken(token);

  if (req.user.mustChangePassword) {
    const path = req.originalUrl.split('?')[0].replace(/\/+$/, '');
    const allowed = ALLOWED_WITH_TEMP_PASSWORD.some(([method, route]) => method === req.method && route === path);
    if (!allowed) throw new ApiError(403, 'Please change your temporary password to continue');
  }
  next();
});

/** Use after protect, e.g. router.use('/admin', protect, restrictTo('admin')) for the future admin panel. */
const restrictTo =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user && req.user.role) ? next() : next(new ApiError(403, 'You do not have permission to do this'));

module.exports = { protect, restrictTo };