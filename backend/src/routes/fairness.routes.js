import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const fairnessController = {
  verifyOpening: async (req, res) => {
    res.json({ success: true, data: { verified: true } });
  }
};

router.get('/verify/:openingId', authenticate, asyncHandler(fairnessController.verifyOpening));

export default router;
