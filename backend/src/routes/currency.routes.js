import express from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const currencyController = {
  getRates: async (req, res) => {
    res.json({ success: true, data: { rates: {} } });
  }
};

router.get('/rates', asyncHandler(currencyController.getRates));

export default router;
