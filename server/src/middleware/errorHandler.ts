import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : 'Something went wrong';

  if (statusCode >= 500) console.error('[error]', err);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && env.isProduction ? 'Internal server error' : message,
    ...(env.isProduction ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
};
