const ApiError = require('../utils/ApiError');

/**
 * Tiny in-memory rate limiter (per IP). Good enough for a single server instance;
 * swap for express-rate-limit + Redis if the API is ever scaled horizontally.
 */
const createRateLimiter = ({ windowMs = 60 * 1000, max = 5, message = 'Too many requests. Please try again later.' } = {}) => {
  const hits = new Map();

  // clean up old entries so the map doesn't grow forever
  setInterval(() => {
    const now = Date.now();
    hits.forEach((entry, key) => {
      if (entry.resetAt <= now) hits.delete(key);
    });
  }, windowMs).unref();

  return (req, _res, next) => {
    const now = Date.now();
    const key = req.ip;
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) return next(new ApiError(429, message));
    return next();
  };
};

module.exports = { createRateLimiter };