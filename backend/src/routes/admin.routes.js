import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { adminRateLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin', 'moderator'));
router.use(adminRateLimiter);

const adminController = {
  getDashboard: async (req, res) => {
    res.json({ success: true, data: {} });
  },
  getUsers: async (req, res) => {
    res.json({ success: true, data: { users: [] } });
  },
  getLootboxes: async (req, res) => {
    res.json({ success: true, data: { lootboxes: [] } });
  }
};

router.get('/dashboard', asyncHandler(adminController.getDashboard));
router.get('/users', asyncHandler(adminController.getUsers));
router.get('/lootboxes', asyncHandler(adminController.getLootboxes));

export default router;
