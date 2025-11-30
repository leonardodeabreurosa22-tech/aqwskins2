import { logger } from '../utils/logger.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err.code === '23505') { // Postgres unique violation
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.code === '23503') { // Postgres foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  // CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Invalid CSRF token';
  }

  // Rate limit errors
  if (err.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = 'Too many requests, please try again later';
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: message,
      code: err.code || 'ERROR',
      statusCode: statusCode
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom Error Class
 */
export class AppError extends Error {
  constructor(message, statusCode, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
