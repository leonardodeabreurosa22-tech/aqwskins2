import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { withdrawalRateLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const withdrawalController = {
  createWithdrawal: async (req, res) => {
    res.json({ success: true, data: {} });
  },
  getWithdrawals: async (req, res) => {
    res.json({ success: true, data: { withdrawals: [] } });
  }
};

router.post('/', authenticate, withdrawalRateLimiter, asyncHandler(withdrawalController.createWithdrawal));
router.get('/', authenticate, asyncHandler(withdrawalController.getWithdrawals));

export default router;
