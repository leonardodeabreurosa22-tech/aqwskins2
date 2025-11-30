import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = express.Router();

const ticketController = {
  createTicket: async (req, res) => {
    res.json({ success: true, data: {} });
  },
  getTickets: async (req, res) => {
    res.json({ success: true, data: { tickets: [] } });
  }
};

router.post('/', authenticate, asyncHandler(ticketController.createTicket));
router.get('/', authenticate, asyncHandler(ticketController.getTickets));

export default router;
