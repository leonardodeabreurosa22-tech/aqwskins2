import pool, { transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger, auditLogger } from '../utils/logger.js';
import { generateFingerprint } from '../utils/crypto.js';
import lootboxService from './lootbox.service.js';

/**
 * COUPON SERVICE
 * Handles influencer coupons with free lootboxes and anti-abuse
 */
class CouponService {
  /**
   * Validate and use coupon
   * @param {string} code - Coupon code
   * @param {number} userId - User ID (optional for new users)
   * @param {object} fingerprint - Browser fingerprint data
   */
  async useCoupon(code, userId, fingerprintData) {
    try {
      return await transaction(async (client) => {
        // 1. Get coupon
        const couponResult = await client.query(
          `SELECT * FROM coupons WHERE code = $1 AND status = 'active' FOR UPDATE`,
          [code.toUpperCase()]
        );

        if (couponResult.rows.length === 0) {
          throw new AppError('Invalid or inactive coupon code', 404, 'INVALID_COUPON');
        }

        const coupon = couponResult.rows[0];

        // 2. Check expiration
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          throw new AppError('Coupon has expired', 400, 'COUPON_EXPIRED');
        }

        // 3. Check usage limits
        if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
          throw new AppError('Coupon usage limit reached', 400, 'COUPON_LIMIT_REACHED');
        }

        // 4. Generate fingerprint hash
        const fingerprintHash = generateFingerprint(fingerprintData);

        // 5. Check if already used by this fingerprint
        const usageCheck = await client.query(
          `SELECT id FROM coupon_usage
           WHERE coupon_id = $1 AND (user_id = $2 OR fingerprint = $3)`,
          [coupon.id, userId, fingerprintHash]
        );

        if (usageCheck.rows.length > 0) {
          throw new AppError(
            'You have already used this coupon',
            400,
            'COUPON_ALREADY_USED'
          );
        }

        // 6. Get coupon lootbox configuration
        const boxConfig = coupon.lootbox_config;

        if (!boxConfig || !boxConfig.items) {
          throw new AppError('Coupon lootbox not configured', 500, 'INVALID_CONFIG');
        }

        // 7. Execute lootbox draw (using special coupon box)
        const drawResult = await lootboxService.executeProvenlyFairDraw(
          {
            id: `coupon_${coupon.id}`,
            name: `${coupon.code} Free Box`,
            items: boxConfig.items
          },
          userId
        );

        // 8. Add item to inventory
        const inventoryResult = await client.query(
          `INSERT INTO inventory
           (user_id, item_id, source_type, source_id, status, obtained_at)
           VALUES ($1, $2, 'coupon', $3, 'available', NOW())
           RETURNING id`,
          [userId, drawResult.item.id, coupon.id]
        );

        // 9. Record coupon usage
        await client.query(
          `INSERT INTO coupon_usage
           (coupon_id, user_id, fingerprint, item_won_id, fairness_hash, used_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [coupon.id, userId, fingerprintHash, drawResult.item.id, drawResult.fairnessHash]
        );

        // 10. Update coupon statistics
        await client.query(
          `UPDATE coupons
           SET times_used = times_used + 1,
               last_used_at = NOW()
           WHERE id = $1`,
          [coupon.id]
        );

        // 11. Log usage
        auditLogger.info('Coupon used', {
          couponCode: coupon.code,
          couponId: coupon.id,
          userId,
          itemWon: drawResult.item.name,
          fingerprint: fingerprintHash
        });

        // 12. Return result
        return {
          success: true,
          data: {
            coupon: {
              code: coupon.code,
              influencer: coupon.influencer_name
            },
            prize: drawResult.item,
            inventoryId: inventoryResult.rows[0].id,
            canWithdrawImmediately: !coupon.minimum_deposit_required,
            minimumDepositRequired: coupon.minimum_deposit_required || 0,
            message: coupon.minimum_deposit_required
              ? `You won ${drawResult.item.name}! To withdraw, deposit at least $${coupon.minimum_deposit_required} USD.`
              : `You won ${drawResult.item.name}! You can withdraw it now.`,
            fairness: {
              hash: drawResult.fairnessHash,
              verifiable: true
            }
          }
        };
      });
    } catch (error) {
      logger.error('Error using coupon:', error);
      throw error;
    }
  }

  /**
   * Admin: Create coupon
   */
  async createCoupon(adminId, couponData) {
    try {
      const {
        code,
        influencerName,
        influencerUrl,
        lootboxConfig,
        minimumDepositRequired,
        maxUses,
        expiresAt
      } = couponData;

      // Validate lootbox config
      if (!lootboxConfig || !lootboxConfig.items || lootboxConfig.items.length === 0) {
        throw new AppError('Invalid lootbox configuration', 400, 'INVALID_CONFIG');
      }

      // Validate weights
      const totalWeight = lootboxConfig.items.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight === 0) {
        throw new AppError('Total weight must be greater than 0', 400, 'INVALID_WEIGHTS');
      }

      // Create coupon
      const result = await pool.query(
        `INSERT INTO coupons
         (code, influencer_name, influencer_url, lootbox_config, minimum_deposit_required, max_uses, expires_at, status, created_by_admin_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, NOW())
         RETURNING *`,
        [
          code.toUpperCase(),
          influencerName,
          influencerUrl,
          JSON.stringify(lootboxConfig),
          minimumDepositRequired || 0,
          maxUses,
          expiresAt,
          adminId
        ]
      );

      auditLogger.info('Coupon created', {
        couponId: result.rows[0].id,
        code: code.toUpperCase(),
        adminId,
        influencerName
      });

      return {
        success: true,
        data: {
          coupon: result.rows[0]
        }
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new AppError('Coupon code already exists', 409, 'DUPLICATE_CODE');
      }
      logger.error('Error creating coupon:', error);
      throw error;
    }
  }

  /**
   * Get active coupons (public)
   */
  async getActiveCoupons() {
    try {
      const result = await pool.query(
        `SELECT 
          code,
          influencer_name,
          influencer_url,
          times_used,
          max_uses,
          expires_at,
          minimum_deposit_required
         FROM coupons
         WHERE status = 'active'
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR times_used < max_uses)
         ORDER BY created_at DESC`
      );

      return {
        success: true,
        data: {
          coupons: result.rows
        }
      };
    } catch (error) {
      logger.error('Error getting active coupons:', error);
      throw error;
    }
  }

  /**
   * Get coupon details
   */
  async getCouponDetails(code) {
    try {
      const result = await pool.query(
        `SELECT 
          code,
          influencer_name,
          influencer_url,
          times_used,
          max_uses,
          expires_at,
          minimum_deposit_required,
          lootbox_config
         FROM coupons
         WHERE code = $1 AND status = 'active'`,
        [code.toUpperCase()]
      );

      if (result.rows.length === 0) {
        throw new AppError('Coupon not found', 404, 'COUPON_NOT_FOUND');
      }

      const coupon = result.rows[0];

      // Get item details for preview
      const itemIds = coupon.lootbox_config.items.map(item => item.id);
      const itemsResult = await pool.query(
        `SELECT id, name, rarity, image_url, value FROM items WHERE id = ANY($1)`,
        [itemIds]
      );

      const itemsMap = {};
      itemsResult.rows.forEach(item => {
        itemsMap[item.id] = item;
      });

      // Calculate probabilities
      const totalWeight = coupon.lootbox_config.items.reduce((sum, item) => sum + item.weight, 0);
      const items = coupon.lootbox_config.items.map(item => ({
        ...itemsMap[item.id],
        probability: ((item.weight / totalWeight) * 100).toFixed(2) + '%'
      }));

      return {
        success: true,
        data: {
          coupon: {
            code: coupon.code,
            influencer: coupon.influencer_name,
            influencerUrl: coupon.influencer_url,
            timesUsed: coupon.times_used,
            maxUses: coupon.max_uses,
            expiresAt: coupon.expires_at,
            minimumDepositRequired: coupon.minimum_deposit_required,
            items: items.sort((a, b) => b.value - a.value)
          }
        }
      };
    } catch (error) {
      logger.error('Error getting coupon details:', error);
      throw error;
    }
  }
}

export default new CouponService();
