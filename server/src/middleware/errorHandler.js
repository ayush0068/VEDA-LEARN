const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err && err.message ? err.message : 'Something went wrong';

  if (statusCode >= 500) console.error('[error]', err);

  res.status(statusCode).json({
    success: false,
    // hide internal details in production, but keep our own deliberate ApiError messages (e.g. 503 / 429)
    message: !(err instanceof ApiError) && statusCode >= 500 && env.isProduction ? 'Internal server error' : message,
    ...(env.isProduction ? {} : { stack: err && err.stack }),
  });
};

module.exports = { notFound, errorHandler };