import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import pool from '../config/database.js';

const router = express.Router();

const inventoryController = {
  getInventory: async (req, res) => {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    try {
      const result = await pool.query(
        `SELECT 
          inv.id,
          inv.obtained_at,
          inv.source_type,
          i.id as item_id,
          i.name,
          i.description,
          i.image_url,
          i.rarity,
          i.value,
          i.category
         FROM inventory inv
         JOIN items i ON inv.item_id = i.id
         WHERE inv.user_id = $1
         ORDER BY inv.obtained_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM inventory WHERE user_id = $1`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          items: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit,
          offset
        }
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory'
      });
    }
  },

  getStats: async (req, res) => {
    const userId = req.user.id;

    try {
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_items,
          COUNT(DISTINCT i.rarity) as unique_rarities,
          COALESCE(SUM(i.value), 0) as total_value
         FROM inventory inv
         JOIN items i ON inv.item_id = i.id
         WHERE inv.user_id = $1`,
        [userId]
      );

      const rarityResult = await pool.query(
        `SELECT 
          i.rarity,
          COUNT(*) as count
         FROM inventory inv
         JOIN items i ON inv.item_id = i.id
         WHERE inv.user_id = $1
         GROUP BY i.rarity`,
        [userId]
      );

      const stats = statsResult.rows[0];
      const rarityBreakdown = {};
      
      rarityResult.rows.forEach(row => {
        rarityBreakdown[row.rarity] = parseInt(row.count);
      });

      res.json({
        success: true,
        data: {
          totalItems: parseInt(stats.total_items),
          totalValue: parseFloat(stats.total_value),
          rarityBreakdown
        }
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory statistics'
      });
    }
  }
};

router.get('/', authenticate, asyncHandler(inventoryController.getInventory));
router.get('/stats', authenticate, asyncHandler(inventoryController.getStats));

export default router;
