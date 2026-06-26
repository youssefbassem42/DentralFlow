import logger from '../logger/index.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Base Response Structure
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    data: null,
    errors: [],
  };

  // 1. Zod Validation Error handling
  if (err.name === 'ZodError' || (err.errors && err.name === 'ValidationError')) {
    err.statusCode = 400;
    response.message = 'Validation Error';
    response.errors = err.errors || err.issues || [];
  }

  // 2. Prisma Database Error handling
  else if (err.code && err.code.startsWith('P')) {
    logger.error('Database Error:', { code: err.code, meta: err.meta, message: err.message });

    if (err.code === 'P2002') {
      err.statusCode = 409;
      response.message = 'Resource already exists.';
      response.errors = [
        { field: err.meta?.target || 'unknown', message: 'Unique constraint failed' },
      ];
    } else if (err.code === 'P2003') {
      err.statusCode = 400;
      response.message = 'Foreign key constraint failed.';
      response.errors = [
        { field: err.meta?.field_name || 'unknown', message: 'Reference key is invalid' },
      ];
    } else if (err.code === 'P2025') {
      err.statusCode = 404;
      response.message = 'Record not found.';
    } else {
      err.statusCode = 500;
      response.message = 'Database operation failed.';
    }
  }

  // 3. JWT Error handling
  else if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    response.message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    response.message = 'Your token has expired. Please log in again.';
  }

  // Log all non-operational / 500 errors
  if (err.statusCode === 500 || !err.isOperational) {
    logger.error('Unhandled Error 💥:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn(`Operational Error: ${err.message}`, {
      statusCode: err.statusCode,
      url: req.originalUrl,
    });
  }

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(err.statusCode).json(response);
};
