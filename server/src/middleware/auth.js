const { getDbState } = require('../config/db');
const { getUserFromToken } = require('../services/auth.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** Requires a valid "Authorization: Bearer <token>" header. Puts the user on req.user. */
const protect = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Please sign in to continue');

  if (getDbState() !== 'connected') throw new ApiError(503, 'Service temporarily unavailable. Please try again later.');

  req.user = await getUserFromToken(token);
  next();
});

/** Use after protect, e.g. router.use('/admin', protect, restrictTo('admin')) for the future admin panel. */
const restrictTo =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user && req.user.role) ? next() : next(new ApiError(403, 'You do not have permission to do this'));

module.exports = { protect, restrictTo };