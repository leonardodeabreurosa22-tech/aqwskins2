import pool, { transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger, transactionLogger, auditLogger } from '../utils/logger.js';
import { generateId } from '../utils/crypto.js';

/**
 * WITHDRAWAL SERVICE
 * Handles item withdrawals with automatic code delivery and manual fallback
 */
class WithdrawalService {
  /**
   * Create withdrawal request
   * @param {number} userId - User ID
   * @param {number} inventoryItemId - Inventory item ID
   * @param {object} metadata - Additional metadata (IP, fingerprint, etc)
   */
  async createWithdrawal(userId, inventoryItemId, metadata = {}) {
    try {
      return await transaction(async (client) => {
        // 1. Get inventory item
        const inventoryResult = await client.query(
          `SELECT 
            inv.id,
            inv.user_id,
            inv.item_id,
            inv.status,
            inv.source_type,
            inv.source_id,
            inv.obtained_at,
            i.name as item_name,
            i.category,
            i.value,
            i.requires_deposit
           FROM inventory inv
           JOIN items i ON inv.item_id = i.id
           WHERE inv.id = $1 AND inv.user_id = $2 FOR UPDATE`,
          [inventoryItemId, userId]
        );

        if (inventoryResult.rows.length === 0) {
          throw new AppError('Item not found in inventory', 404, 'ITEM_NOT_FOUND');
        }

        const inventoryItem = inventoryResult.rows[0];

        // 2. Check if already withdrawn
        if (inventoryItem.status === 'withdrawn') {
          throw new AppError('Item already withdrawn', 400, 'ALREADY_WITHDRAWN');
        }

        if (inventoryItem.status === 'pending_withdrawal') {
          throw new AppError('Withdrawal already in progress', 400, 'WITHDRAWAL_PENDING');
        }

        // 3. Check withdrawal requirements (for coupon items)
        if (inventoryItem.source_type === 'coupon' && inventoryItem.requires_deposit) {
          const canWithdraw = await this.checkDepositRequirement(
            client,
            userId,
            inventoryItem.source_id
          );

          if (!canWithdraw.allowed) {
            throw new AppError(
              canWithdraw.message,
              403,
              'DEPOSIT_REQUIREMENT_NOT_MET'
            );
          }
        }

        // 4. Try to get available code
        const codeResult = await client.query(
          `SELECT id, code, batch_id
           FROM item_codes
           WHERE item_id = $1 AND status = 'available'
           ORDER BY created_at ASC
           LIMIT 1 FOR UPDATE`,
          [inventoryItem.item_id]
        );

        let withdrawalStatus = 'completed';
        let deliveredCode = null;
        let requiresManualProcessing = false;

        // 5. Handle code delivery
        if (codeResult.rows.length > 0) {
          // CODE AVAILABLE - Automatic delivery
          const codeRecord = codeResult.rows[0];
          deliveredCode = codeRecord.code;

          // Mark code as used
          await client.query(
            `UPDATE item_codes
             SET status = 'used',
                 used_by_user_id = $1,
                 used_at = NOW()
             WHERE id = $2`,
            [userId, codeRecord.id]
          );
        } else {
          // NO CODE AVAILABLE - Manual processing required
          withdrawalStatus = 'pending_manual';
          requiresManualProcessing = true;

          logger.warn('Code not available for withdrawal', {
            userId,
            itemId: inventoryItem.item_id,
            itemName: inventoryItem.item_name
          });
        }

        // 6. Create withdrawal record
        const withdrawalId = generateId();
        await client.query(
          `INSERT INTO withdrawals
           (id, user_id, inventory_item_id, item_id, status, delivered_code, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            withdrawalId,
            userId,
            inventoryItemId,
            inventoryItem.item_id,
            withdrawalStatus,
            deliveredCode,
            JSON.stringify(metadata)
          ]
        );

        // 7. Update inventory item status
        await client.query(
          `UPDATE inventory
           SET status = $1,
               withdrawn_at = CASE WHEN $1 = 'withdrawn' THEN NOW() ELSE NULL END
           WHERE id = $2`,
          [withdrawalStatus === 'completed' ? 'withdrawn' : 'pending_withdrawal', inventoryItemId]
        );

        // 8. Update user statistics
        if (withdrawalStatus === 'completed') {
          await client.query(
            `UPDATE users
             SET total_withdrawn = total_withdrawn + 1
             WHERE id = $1`,
            [userId]
          );
        }

        // 9. Log transaction
        transactionLogger.info('Withdrawal created', {
          withdrawalId,
          userId,
          itemId: inventoryItem.item_id,
          itemName: inventoryItem.item_name,
          status: withdrawalStatus,
          automatic: !requiresManualProcessing,
          ip: metadata.ip,
          fingerprint: metadata.fingerprint
        });

        // 10. Notify admin if manual processing needed
        if (requiresManualProcessing) {
          auditLogger.warn('Manual withdrawal processing required', {
            withdrawalId,
            userId,
            itemName: inventoryItem.item_name
          });
        }

        // 11. Return result
        return {
          success: true,
          data: {
            withdrawal: {
              id: withdrawalId,
              itemName: inventoryItem.item_name,
              status: withdrawalStatus,
              code: deliveredCode,
              requiresManualProcessing,
              message: requiresManualProcessing
                ? 'No codes available at the moment. An administrator will provide your code manually within 3 business days.'
                : 'Code delivered successfully!',
              estimatedDelivery: requiresManualProcessing
                ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                : null
            }
          }
        };
      });
    } catch (error) {
      logger.error('Error creating withdrawal:', error);
      throw error;
    }
  }

  /**
   * Check deposit requirement for coupon items
   */
  async checkDepositRequirement(client, userId, couponId) {
    // Get coupon requirements
    const couponResult = await client.query(
      `SELECT minimum_deposit_required FROM coupons WHERE id = $1`,
      [couponId]
    );

    if (couponResult.rows.length === 0) {
      return { allowed: true };
    }

    const requiredDeposit = couponResult.rows[0].minimum_deposit_required;

    if (!requiredDeposit || requiredDeposit === 0) {
      return { allowed: true };
    }

    // Check user's total deposits
    const depositResult = await client.query(
      `SELECT COALESCE(SUM(amount_usd), 0) as total_deposited
       FROM deposits
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    const totalDeposited = parseFloat(depositResult.rows[0].total_deposited);

    if (totalDeposited < requiredDeposit) {
      return {
        allowed: false,
        message: `You must deposit at least $${requiredDeposit} USD before withdrawing this item. Current total: $${totalDeposited.toFixed(2)} USD`
      };
    }

    return { allowed: true };
  }

  /**
   * Admin: Manually process withdrawal
   * @param {string} withdrawalId - Withdrawal ID
   * @param {number} adminId - Admin user ID
   * @param {string} code - Code to deliver
   */
  async processManualWithdrawal(withdrawalId, adminId, code) {
    try {
      return await transaction(async (client) => {
        // Get withdrawal
        const withdrawalResult = await client.query(
          `SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE`,
          [withdrawalId]
        );

        if (withdrawalResult.rows.length === 0) {
          throw new AppError('Withdrawal not found', 404, 'WITHDRAWAL_NOT_FOUND');
        }

        const withdrawal = withdrawalResult.rows[0];

        if (withdrawal.status !== 'pending_manual') {
          throw new AppError('Withdrawal not pending manual processing', 400, 'INVALID_STATUS');
        }

        // Update withdrawal
        await client.query(
          `UPDATE withdrawals
           SET status = 'completed',
               delivered_code = $1,
               processed_by_admin_id = $2,
               processed_at = NOW()
           WHERE id = $3`,
          [code, adminId, withdrawalId]
        );

        // Update inventory
        await client.query(
          `UPDATE inventory
           SET status = 'withdrawn',
               withdrawn_at = NOW()
           WHERE id = $1`,
          [withdrawal.inventory_item_id]
        );

        // Update user statistics
        await client.query(
          `UPDATE users
           SET total_withdrawn = total_withdrawn + 1
           WHERE id = $1`,
          [withdrawal.user_id]
        );

        auditLogger.info('Manual withdrawal processed', {
          withdrawalId,
          userId: withdrawal.user_id,
          adminId,
          itemId: withdrawal.item_id
        });

        return {
          success: true,
          data: {
            withdrawalId,
            status: 'completed'
          }
        };
      });
    } catch (error) {
      logger.error('Error processing manual withdrawal:', error);
      throw error;
    }
  }

  /**
   * Get user withdrawal history
   */
  async getUserWithdrawals(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          w.id,
          w.status,
          w.created_at,
          w.processed_at,
          i.name as item_name,
          i.category,
          i.image_url,
          CASE 
            WHEN w.status = 'completed' THEN w.delivered_code
            ELSE NULL
          END as code
         FROM withdrawals w
         JOIN items i ON w.item_id = i.id
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM withdrawals WHERE user_id = $1`,
        [userId]
      );

      return {
        success: true,
        data: {
          withdrawals: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit,
          offset
        }
      };
    } catch (error) {
      logger.error('Error getting user withdrawals:', error);
      throw error;
    }
  }

  /**
   * Admin: Get pending manual withdrawals
   */
  async getPendingManualWithdrawals(limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          w.id,
          w.created_at,
          u.username,
          u.email,
          i.name as item_name,
          i.category,
          EXTRACT(EPOCH FROM (NOW() - w.created_at))/3600 as hours_pending
         FROM withdrawals w
         JOIN users u ON w.user_id = u.id
         JOIN items i ON w.item_id = i.id
         WHERE w.status = 'pending_manual'
         ORDER BY w.created_at ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM withdrawals WHERE status = 'pending_manual'`
      );

      return {
        success: true,
        data: {
          pendingWithdrawals: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit,
          offset
        }
      };
    } catch (error) {
      logger.error('Error getting pending withdrawals:', error);
      throw error;
    }
  }
}

export default new WithdrawalService();
