import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

// Placeholder controllers - to be implemented
const userController = {
  getProfile: async (req, res) => {
    res.json({ success: true, data: { user: req.user } });
  },
  updateProfile: async (req, res) => {
    res.json({ success: true, message: 'Profile updated' });
  },
  getBalance: async (req, res) => {
    res.json({ success: true, data: { balance: 0 } });
  }
};

router.get('/profile', authenticate, asyncHandler(userController.getProfile));
router.put('/profile', authenticate, asyncHandler(userController.updateProfile));
router.get('/balance', authenticate, asyncHandler(userController.getBalance));

export default router;
