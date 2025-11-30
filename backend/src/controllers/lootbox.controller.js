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
    try {
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
    } catch (error) {
      console.error('Error fetching lootboxes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch lootboxes',
        message: error.message
      });
    }
  }

  /**
   * Get lootbox details
   */
  async getLootboxDetails(req, res) {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === 'admin';

      const result = await lootboxService.getLootBoxDetails(id, isAdmin);
      res.json(result);
    } catch (error) {
      console.error('Error fetching lootbox details:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch lootbox details'
      });
    }
  }

  /**
   * Get lootbox items
   */
  async getLootboxItems(req, res) {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    try {
      // Get lootbox with items
      const boxResult = await pool.query(
        `SELECT id, items FROM lootboxes WHERE id = $1 AND status = 'active'`,
        [id]
      );

      if (boxResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Lootbox not found'
        });
      }

      const lootbox = boxResult.rows[0];
      const items = lootbox.items || [];

      // Get full item details
      const itemIds = items.map(item => item.id);
      
      if (itemIds.length === 0) {
        return res.json({
          success: true,
          data: {
            items: []
          }
        });
      }

      const itemsResult = await pool.query(
        `SELECT * FROM items WHERE id = ANY($1)`,
        [itemIds]
      );

      // Calculate probabilities
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

      // Enrich items with probability info
      const enrichedItems = items.map(itemConfig => {
        const fullItem = itemsResult.rows.find(i => i.id === itemConfig.id);
        if (!fullItem) return null;

        const probability = (itemConfig.weight / totalWeight) * 100;

        return {
          ...fullItem,
          probability: isAdmin ? probability : this.getRarityRange(probability),
          weight: isAdmin ? itemConfig.weight : undefined
        };
      }).filter(Boolean);

      res.json({
        success: true,
        data: {
          items: enrichedItems
        }
      });
    } catch (error) {
      console.error('Error fetching lootbox items:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch items'
      });
    }
  }

  /**
   * Get rarity range for probability (for non-admin users)
   */
  getRarityRange(probability) {
    if (probability >= 50) return 'Very High';
    if (probability >= 20) return 'High';
    if (probability >= 10) return 'Medium';
    if (probability >= 5) return 'Low';
    if (probability >= 1) return 'Very Low';
    return 'Extremely Rare';
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
