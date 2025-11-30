import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const inventoryController = {
  getInventory: async (req, res) => {
    res.json({ success: true, data: { items: [] } });
  }
};

router.get('/', authenticate, asyncHandler(inventoryController.getInventory));

export default router;
