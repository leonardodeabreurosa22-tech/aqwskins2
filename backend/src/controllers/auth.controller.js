import pool from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { hashPassword } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

/**
 * AUTH CONTROLLER
 * Handles user authentication
 */
class AuthController {
  /**
   * Register new user
   */
  async register(req, res) {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];

    logger.info('New user registered', { userId: user.id, username: user.username });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        message: 'Registration successful'
      }
    });
  }

  /**
   * Login user
   */
  async login(req, res) {
    const { email, password } = req.body;

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Verify password
    const { comparePassword } = await import('../utils/crypto.js');
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (user.status !== 'active') {
      throw new AppError('Account is suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    // Generate token
    const { generateToken, generateRefreshToken } = await import('../utils/crypto.js');
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    logger.info('User logged in', { userId: user.id, username: user.username });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          balance: user.balance
        },
        token,
        refreshToken
      }
    });
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    // In JWT-based auth, logout is handled client-side
    // Optionally, add token to blacklist here

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'TOKEN_REQUIRED');
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Generate new access token
    const { generateToken } = await import('../utils/crypto.js');
    const newToken = generateToken({ id: decoded.id });

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(req, res) {
    const result = await pool.query(
      `SELECT id, username, email, role, balance, level, experience, 
              preferred_language, preferred_currency, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  }

  /**
   * Forgot password
   */
  async forgotPassword(req, res) {
    // Implementation placeholder
    res.json({
      success: true,
      message: 'Password reset email sent (if account exists)'
    });
  }

  /**
   * Reset password
   */
  async resetPassword(req, res) {
    // Implementation placeholder
    res.json({
      success: true,
      message: 'Password reset successful'
    });
  }
}

export default new AuthController();
