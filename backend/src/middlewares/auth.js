import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { logger } from '../utils/logger.js';
import pool from '../config/database.js';

/**
 * Verify JWT Token Middleware
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('Not authorized, no token provided', 401, 'NO_TOKEN');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await pool.query(
      `SELECT id, email, username, role, status, created_at 
       FROM users 
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      logger.warn(`Blocked login attempt for inactive user: ${user.id}, status: ${user.status}`);
      throw new AppError('Account is suspended or inactive', 403, 'ACCOUNT_INACTIVE');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    logger.debug(`User authenticated: ${user.username} (${user.id})`);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

/**
 * Role-Based Access Control Middleware
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return next(
        new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN')
      );
    }

    next();
  };
};

/**
 * Optional Authentication
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query(
        `SELECT id, email, username, role FROM users WHERE id = $1 AND status = 'active'`,
        [decoded.id]
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

/**
 * Check if user owns resource
 */
export const checkOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if resource belongs to user (implementation depends on resource type)
      // This is a generic example - customize per resource
      const result = await pool.query(
        `SELECT user_id FROM ${req.baseUrl.split('/').pop()} WHERE id = $1`,
        [resourceId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Resource not found', 404, 'NOT_FOUND');
      }

      if (result.rows[0].user_id !== req.user.id) {
        throw new AppError('You do not have permission to access this resource', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
