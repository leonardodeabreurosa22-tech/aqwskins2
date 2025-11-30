import csurf from 'csurf';
import { AppError } from './errorHandler.js';

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */
export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

/**
 * CSRF Token Generator
 * Sends CSRF token to client
 */
export const sendCsrfToken = (req, res) => {
  res.json({
    success: true,
    data: {
      csrfToken: req.csrfToken()
    }
  });
};

/**
 * CSRF Error Handler
 */
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return next(new AppError('Invalid CSRF token', 403, 'INVALID_CSRF_TOKEN'));
  }
  next(err);
};
