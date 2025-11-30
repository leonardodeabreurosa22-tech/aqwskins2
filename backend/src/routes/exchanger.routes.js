import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { exchangerRateLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const exchangerController = {
  calculateExchange: async (req, res) => {
    res.json({ success: true, data: {} });
  },
  executeExchange: async (req, res) => {
    res.json({ success: true, data: {} });
  }
};

router.post('/calculate', authenticate, asyncHandler(exchangerController.calculateExchange));
router.post('/execute', authenticate, exchangerRateLimiter, asyncHandler(exchangerController.executeExchange));

export default router;
