const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * User Service - Business logic for user operations
 */
const userService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId) {
    const result = await pool.query(
      `SELECT id, username, email, balance, preferred_currency, role, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const { username, email, preferredCurrency } = data;
    const result = await pool.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           preferred_currency = COALESCE($3, preferred_currency),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, username, email, balance, preferred_currency, role`,
      [username, email, preferredCurrency, userId]
    );
    return result.rows[0];
  },

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const bcrypt = require('bcryptjs');
    
    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    logger.info(`User ${userId} changed password`);
    return { success: true };
  },

  /**
   * Get user statistics
   */
  async getStatistics(userId) {
    const stats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM lootbox_openings WHERE user_id = $1) as total_openings,
        (SELECT COALESCE(SUM(lb.price), 0) FROM lootbox_openings lo
         JOIN lootboxes lb ON lo.lootbox_id = lb.id WHERE lo.user_id = $1) as total_spent,
        (SELECT COUNT(*) FROM inventory WHERE user_id = $1) as items_won,
        (SELECT COALESCE(SUM(w.amount), 0) FROM withdrawals w
         WHERE w.user_id = $1 AND w.status = 'completed') as total_withdrawn`,
      [userId]
    );
    return stats.rows[0];
  },

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId, type = 'all', page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        id, 
        type, 
        amount, 
        currency, 
        status, 
        metadata,
        created_at
      FROM (
        SELECT 
          id,
          'deposit' as type,
          amount,
          currency,
          status,
          NULL as metadata,
          created_at
        FROM deposits
        WHERE user_id = $1
        
        UNION ALL
        
        SELECT 
          id,
          'withdrawal' as type,
          0 as amount,
          'USD' as currency,
          status,
          NULL as metadata,
          created_at
        FROM withdrawals
        WHERE user_id = $1
        
        UNION ALL
        
        SELECT 
          id,
          'lootbox_opening' as type,
          lb.price as amount,
          'USD' as currency,
          'completed' as status,
          json_build_object('lootbox', lb.name, 'item', i.name) as metadata,
          lo.created_at
        FROM lootbox_openings lo
        JOIN lootboxes lb ON lo.lootbox_id = lb.id
        JOIN items i ON lo.item_id = i.id
        WHERE lo.user_id = $1
      ) transactions
    `;

    if (type !== 'all') {
      query += ` WHERE type = $2`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${type !== 'all' ? 3 : 2} OFFSET $${type !== 'all' ? 4 : 3}`;

    const params = type !== 'all' 
      ? [userId, type, limit, offset]
      : [userId, limit, offset];

    const result = await pool.query(query, params);
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM (
        SELECT id FROM deposits WHERE user_id = $1
        UNION ALL
        SELECT id FROM withdrawals WHERE user_id = $1
        UNION ALL
        SELECT id FROM lootbox_openings WHERE user_id = $1
      ) all_transactions`,
      [userId]
    );

    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    };
  },

  /**
   * Get loot box opening history
   */
  async getOpeningHistory(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT 
        lo.id,
        lo.created_at,
        lo.fairness_hash,
        json_build_object(
          'id', lb.id,
          'name', lb.name,
          'imageUrl', lb.image_url
        ) as lootbox,
        json_build_object(
          'id', i.id,
          'name', i.name,
          'rarity', i.rarity,
          'value', i.value,
          'imageUrl', i.image_url
        ) as item
      FROM lootbox_openings lo
      JOIN lootboxes lb ON lo.lootbox_id = lb.id
      JOIN items i ON lo.item_id = i.id
      WHERE lo.user_id = $1
      ORDER BY lo.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM lootbox_openings WHERE user_id = $1',
      [userId]
    );

    return {
      openings: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    };
  },

  /**
   * Update user preferences
   */
  async updatePreferences(userId, preferences) {
    const { language, currency } = preferences;
    const result = await pool.query(
      `UPDATE users 
       SET preferred_currency = COALESCE($1, preferred_currency),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, balance, preferred_currency, role`,
      [currency, userId]
    );
    return result.rows[0];
  },

  /**
   * Sell item for credits (sell-back system)
   */
  async sellItemForCredits(userId, inventoryItemId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get inventory item with item details
      const itemResult = await client.query(
        `SELECT inv.id, inv.user_id, inv.withdrawal_status, 
                i.id as item_id, i.name as item_name, i.value as item_value
         FROM inventory inv
         JOIN items i ON inv.item_id = i.id
         WHERE inv.id = $1 AND inv.user_id = $2`,
        [inventoryItemId, userId]
      );

      if (itemResult.rows.length === 0) {
        throw new Error('Item not found in your inventory');
      }

      const inventoryItem = itemResult.rows[0];

      if (inventoryItem.withdrawal_status !== 'available') {
        throw new Error('This item is not available for sale (already withdrawn or pending)');
      }

      const creditAmount = inventoryItem.item_value;

      // Add credits to user balance
      const balanceResult = await client.query(
        `UPDATE users 
         SET balance = balance + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING balance`,
        [creditAmount, userId]
      );

      // Remove item from inventory
      await client.query(
        'DELETE FROM inventory WHERE id = $1',
        [inventoryItemId]
      );

      // Log the transaction
      await client.query(
        `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          'SELL_ITEM_FOR_CREDITS',
          JSON.stringify({
            inventoryItemId,
            itemName: inventoryItem.item_name,
            creditAmount,
          }),
          'system',
          'internal',
        ]
      );

      await client.query('COMMIT');

      logger.info(`User ${userId} sold item ${inventoryItemId} for $${creditAmount}`);

      return {
        success: true,
        creditAmount,
        newBalance: parseFloat(balanceResult.rows[0].balance),
        itemSold: inventoryItem.item_name,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error selling item for credits:', error);
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = userService;
