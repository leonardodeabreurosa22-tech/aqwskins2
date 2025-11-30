import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Global Rate Limiter
 * Applies to all routes
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

/**
 * Strict Rate Limiter for Auth Routes
 * More restrictive for login/register
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
  }
});

/**
 * Lootbox Opening Rate Limiter
 * Prevents abuse of lootbox opening
 */
export const lootboxRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 opens per minute
  message: {
    success: false,
    error: {
      message: 'Too many lootbox openings, please slow down',
      code: 'LOOTBOX_RATE_LIMIT_EXCEEDED'
    }
  },
  keyGenerator: (req) => {
    // Rate limit by user ID instead of IP for authenticated requests
    return req.user?.id || req.ip;
  }
});

/**
 * Withdrawal Rate Limiter
 */
export const withdrawalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 withdrawals per hour
  message: {
    success: false,
    error: {
      message: 'Too many withdrawal requests, please try again later',
      code: 'WITHDRAWAL_RATE_LIMIT_EXCEEDED'
    }
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Deposit Rate Limiter
 */
export const depositRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    error: {
      message: 'Too many deposit attempts, please try again later',
      code: 'DEPOSIT_RATE_LIMIT_EXCEEDED'
    }
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Exchanger Rate Limiter
 */
export const exchangerRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15,
  message: {
    success: false,
    error: {
      message: 'Too many exchange attempts, please slow down',
      code: 'EXCHANGER_RATE_LIMIT_EXCEEDED'
    }
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Admin Actions Rate Limiter
 */
export const adminRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Higher limit for admin operations
  message: {
    success: false,
    error: {
      message: 'Too many admin actions, please slow down',
      code: 'ADMIN_RATE_LIMIT_EXCEEDED'
    }
  },
  keyGenerator: (req) => req.user?.id || req.ip
});
