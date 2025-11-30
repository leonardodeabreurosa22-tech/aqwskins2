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
}

export default new LootBoxController();
