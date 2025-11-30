import lootboxService from '../services/lootbox.service.js';
import pool from '../config/database.js';

/**
 * LOOTBOX CONTROLLER
 */
class LootBoxController {
  /**
   * Get all active lootboxes
   */
  async getAllLootboxes(req, res) {
    const { category, minPrice, maxPrice } = req.query;

    let query = `SELECT id, name, description, price, image_url, category, min_level, times_opened
                 FROM lootboxes WHERE status = 'active'`;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (minPrice) {
      params.push(minPrice);
      query += ` AND price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(maxPrice);
      query += ` AND price <= $${params.length}`;
    }

    query += ` ORDER BY price ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        lootboxes: result.rows
      }
    });
  }

  /**
   * Get lootbox details
   */
  async getLootboxDetails(req, res) {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const result = await lootboxService.getLootBoxDetails(id, isAdmin);
    res.json(result);
  }

  /**
   * Open lootbox
   */
  async openLootbox(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const fingerprint = req.body.fingerprint || req.ip;

    const result = await lootboxService.openLootBox(userId, id, fingerprint);
    res.json(result);
  }

  /**
   * Get opening history
   */
  async getOpeningHistory(req, res) {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await lootboxService.getUserOpenings(userId, limit, offset);
    res.json(result);
  }

  /**
   * Get live drops (recent openings from all users)
   */
  async getLiveDrops(req, res) {
    const { limit = 50 } = req.query;

    try {
      const query = `
        SELECT 
          lo.id,
          lo.created_at,
          u.username,
          u.avatar_url,
          lb.name as lootbox_name,
          lb.image_url as lootbox_image,
          i.name as item_name,
          i.image_url as item_image,
          i.rarity,
          i.value
        FROM lootbox_openings lo
        JOIN users u ON lo.user_id = u.id
        JOIN lootboxes lb ON lo.lootbox_id = lb.id
        JOIN items i ON lo.item_id = i.id
        ORDER BY lo.created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);

      res.json({
        success: true,
        data: {
          drops: result.rows
        }
      });
    } catch (error) {
      console.error('Error fetching live drops:', error);
      // Return empty array if table doesn't exist or query fails
      res.json({
        success: true,
        data: {
          drops: []
        }
      });
    }
  }
}

export default new LootBoxController();
