import pool, { transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger, transactionLogger } from '../utils/logger.js';

/**
 * EXCHANGER SERVICE
 * Handles item exchanges with automatic value calculation
 */
class ExchangerService {
  constructor() {
    this.exchangeFeePercentage = 0.05; // 5% fee
  }

  /**
   * Calculate exchange value
   * @param {Array} sourceItemIds - Array of inventory item IDs to trade
   * @param {number} targetItemId - Target item ID
   * @param {number} userId - User ID
   */
  async calculateExchange(sourceItemIds, targetItemId, userId) {
    try {
      // Get source items from user's inventory
      const sourceResult = await pool.query(
        `SELECT inv.id, inv.item_id, i.value, i.name, i.rarity
         FROM inventory inv
         JOIN items i ON inv.item_id = i.id
         WHERE inv.id = ANY($1) AND inv.user_id = $2 AND inv.status = 'available'`,
        [sourceItemIds, userId]
      );

      if (sourceResult.rows.length !== sourceItemIds.length) {
        throw new AppError('One or more items not found or unavailable', 400, 'ITEMS_NOT_AVAILABLE');
      }

      const sourceItems = sourceResult.rows;
      const totalSourceValue = sourceItems.reduce((sum, item) => sum + parseFloat(item.value), 0);

      // Get target item
      const targetResult = await pool.query(
        `SELECT id, value, name, rarity, category FROM items WHERE id = $1`,
        [targetItemId]
      );

      if (targetResult.rows.length === 0) {
        throw new AppError('Target item not found', 404, 'TARGET_NOT_FOUND');
      }

      const targetItem = targetResult.rows[0];
      const targetValue = parseFloat(targetItem.value);

      // Calculate exchange details
      const fee = totalSourceValue * this.exchangeFeePercentage;
      const netValue = totalSourceValue - fee;
      const difference = netValue - targetValue;
      const canExchange = difference >= 0;

      return {
        success: true,
        data: {
          exchange: {
            sourceItems: sourceItems.map(item => ({
              inventoryId: item.id,
              name: item.name,
              rarity: item.rarity,
              value: item.value
            })),
            totalSourceValue,
            fee,
            netValue,
            targetItem: {
              id: targetItem.id,
              name: targetItem.name,
              rarity: targetItem.rarity,
              value: targetItem.value
            },
            difference,
            canExchange,
            message: canExchange
              ? `Exchange possible. You will have $${difference.toFixed(2)} value remaining.`
              : `Cannot exchange. You need $${Math.abs(difference).toFixed(2)} more value.`
          }
        }
      };
    } catch (error) {
      logger.error('Error calculating exchange:', error);
      throw error;
    }
  }

  /**
   * Execute exchange
   */
  async executeExchange(sourceItemIds, targetItemId, userId, fingerprint = null) {
    try {
      return await transaction(async (client) => {
        // Recalculate to verify
        const calculation = await this.calculateExchange(sourceItemIds, targetItemId, userId);

        if (!calculation.data.exchange.canExchange) {
          throw new AppError('Exchange not possible with provided items', 400, 'EXCHANGE_NOT_POSSIBLE');
        }

        // Lock source items
        await client.query(
          `UPDATE inventory
           SET status = 'exchanged'
           WHERE id = ANY($1) AND user_id = $2 AND status = 'available'`,
          [sourceItemIds, userId]
        );

        // Add target item to inventory
        const inventoryResult = await client.query(
          `INSERT INTO inventory
           (user_id, item_id, source_type, source_id, obtained_at)
           VALUES ($1, $2, 'exchange', NULL, NOW())
           RETURNING id`,
          [userId, targetItemId]
        );

        // Record exchange transaction
        await client.query(
          `INSERT INTO exchanges
           (user_id, source_item_ids, target_item_id, source_value, fee, net_value, target_value, fingerprint, exchanged_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            userId,
            sourceItemIds,
            targetItemId,
            calculation.data.exchange.totalSourceValue,
            calculation.data.exchange.fee,
            calculation.data.exchange.netValue,
            calculation.data.exchange.targetItem.value,
            fingerprint
          ]
        );

        transactionLogger.info('Exchange completed', {
          userId,
          sourceItemCount: sourceItemIds.length,
          targetItemId,
          value: calculation.data.exchange.targetItem.value
        });

        return {
          success: true,
          data: {
            exchange: {
              newInventoryId: inventoryResult.rows[0].id,
              itemReceived: calculation.data.exchange.targetItem,
              itemsTraded: calculation.data.exchange.sourceItems.length,
              totalValue: calculation.data.exchange.netValue
            }
          }
        };
      });
    } catch (error) {
      logger.error('Error executing exchange:', error);
      throw error;
    }
  }

  /**
   * Get exchange history
   */
  async getExchangeHistory(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          e.id,
          e.exchanged_at,
          e.source_value,
          e.fee,
          e.net_value,
          i.name as item_received,
          i.rarity,
          i.value,
          i.image_url,
          array_length(e.source_item_ids, 1) as items_traded
         FROM exchanges e
         JOIN items i ON e.target_item_id = i.id
         WHERE e.user_id = $1
         ORDER BY e.exchanged_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM exchanges WHERE user_id = $1`,
        [userId]
      );

      return {
        success: true,
        data: {
          exchanges: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit,
          offset
        }
      };
    } catch (error) {
      logger.error('Error getting exchange history:', error);
      throw error;
    }
  }
}

export default new ExchangerService();
