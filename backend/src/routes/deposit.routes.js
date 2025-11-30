import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { depositRateLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const depositController = {
  createDeposit: async (req, res) => {
    res.json({ success: true, data: {} });
  },
  getDeposits: async (req, res) => {
    res.json({ success: true, data: { deposits: [] } });
  }
};

router.post('/', authenticate, depositRateLimiter, asyncHandler(depositController.createDeposit));
router.get('/', authenticate, asyncHandler(depositController.getDeposits));

export default router;
