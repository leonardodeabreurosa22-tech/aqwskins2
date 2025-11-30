import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import pool from '../config/database.js';

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
  },
  getOpenings: async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT lo.*, lb.name as lootbox_name, i.name as item_name, i.value, i.rarity, i.image_url
       FROM lootbox_openings lo
       JOIN lootboxes lb ON lo.lootbox_id = lb.id
       JOIN items i ON lo.item_id = i.id
       WHERE lo.user_id = $1
       ORDER BY lo.opened_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ success: true, data: { openings: result.rows } });
  },
  getStatistics: async (req, res) => {
    const stats = await pool.query(
      `SELECT 
        COUNT(DISTINCT lo.id) as total_openings,
        COALESCE(SUM(lo.price_paid), 0) as total_spent,
        COUNT(DISTINCT inv.id) as total_items,
        u.balance
       FROM users u
       LEFT JOIN lootbox_openings lo ON u.id = lo.user_id
       LEFT JOIN inventory inv ON u.id = inv.user_id
       WHERE u.id = $1
       GROUP BY u.id, u.balance`,
      [req.user.id]
    );
    res.json({ success: true, data: stats.rows[0] || { total_openings: 0, total_spent: 0, total_items: 0, balance: 0 } });
  },
  getTransactions: async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT 
        'opening' as type,
        lo.opened_at as created_at,
        -lo.price_paid as amount,
        lb.name as description
       FROM lootbox_openings lo
       JOIN lootboxes lb ON lo.lootbox_id = lb.id
       WHERE lo.user_id = $1
       ORDER BY lo.opened_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ success: true, data: { transactions: result.rows } });
  }
};

router.get('/profile', authenticate, asyncHandler(userController.getProfile));
router.put('/profile', authenticate, asyncHandler(userController.updateProfile));
router.get('/balance', authenticate, asyncHandler(userController.getBalance));
router.get('/openings', authenticate, asyncHandler(userController.getOpenings));
router.get('/statistics', authenticate, asyncHandler(userController.getStatistics));
router.get('/transactions', authenticate, asyncHandler(userController.getTransactions));

export default router;
