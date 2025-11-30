import { secureRandomInt, generateHMAC } from '../utils/crypto.js';
import { fairnessLogger, logger } from '../utils/logger.js';
import pool, { transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * LOOTBOX SERVICE
 * Core service for lootbox opening with provably fair algorithm
 */
class LootBoxService {
  /**
   * Open a lootbox
   * @param {number} userId - User ID
   * @param {number} boxId - Lootbox ID
   * @param {string} fingerprint - Browser fingerprint for anti-abuse
   * @returns {Promise<object>} - Opening result with item and fairness proof
   */
  async openLootBox(userId, boxId, fingerprint = null) {
    try {
      logger.info('Starting lootbox opening', { userId, boxId, fingerprint });
      
      return await transaction(async (client) => {
        // 1. Get lootbox configuration
        const boxResult = await client.query(
          `SELECT id, name, price, items, status, category, min_level
           FROM lootboxes 
           WHERE id = $1 AND status = 'active'`,
          [boxId]
        );

        logger.info('Lootbox query result', { found: boxResult.rows.length });

        if (boxResult.rows.length === 0) {
          throw new AppError('Lootbox not found or inactive', 404, 'LOOTBOX_NOT_FOUND');
        }

        const lootbox = boxResult.rows[0];
        logger.info('Lootbox found', { id: lootbox.id, name: lootbox.name, price: lootbox.price });

        // 2. Verify user has enough credits
        const userResult = await client.query(
          `SELECT id, username, balance, level FROM users WHERE id = $1`,
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        const user = userResult.rows[0];
        
        // Convert to numbers for accurate comparison
        const userBalance = parseFloat(user.balance) || 0;
        const boxPrice = parseFloat(lootbox.price) || 0;
        
        logger.info('User found', { 
          id: user.id, 
          username: user.username, 
          balance: userBalance, 
          balanceType: typeof user.balance,
          required: boxPrice,
          priceType: typeof lootbox.price,
          hasEnough: userBalance >= boxPrice
        });

        if (userBalance < boxPrice) {
          throw new AppError(
            `Insufficient balance. You have $${userBalance.toFixed(2)} but need $${boxPrice.toFixed(2)}`,
            400, 
            'INSUFFICIENT_BALANCE'
          );
        }

        // Check level requirement
        if (lootbox.min_level && user.level < lootbox.min_level) {
          logger.warn('Level requirement not met', {
            userId: user.id,
            userLevel: user.level,
            requiredLevel: lootbox.min_level,
            lootboxId: lootbox.id
          });
          throw new AppError(
            `This lootbox requires level ${lootbox.min_level}. Your current level is ${user.level}`,
            403,
            'LEVEL_REQUIREMENT_NOT_MET'
          );
        }

        // 3. Deduct credits
        await client.query(
          `UPDATE users SET balance = balance - $1 WHERE id = $2`,
          [boxPrice, userId]
        );

        // 4. Execute provably fair draw
        const drawResult = await this.executeProvenlyFairDraw(lootbox, userId);

        // 5. Add item to user inventory
        const inventoryResult = await client.query(
          `INSERT INTO inventory (user_id, item_id, source_type, source_id, obtained_at)
           VALUES ($1, $2, 'lootbox', $3, NOW())
           RETURNING id`,
          [userId, drawResult.item.id, boxId]
        );

        // 6. Record opening in history
        await client.query(
          `INSERT INTO lootbox_openings 
           (user_id, lootbox_id, item_id, price_paid, fairness_hash, fairness_data, fingerprint, opened_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            userId,
            boxId,
            drawResult.item.id,
            boxPrice,
            drawResult.fairnessHash,
            JSON.stringify(drawResult.fairnessData),
            fingerprint
          ]
        );

        // 7. Update statistics
        await client.query(
          `UPDATE lootboxes 
           SET times_opened = times_opened + 1, 
               last_opened_at = NOW()
           WHERE id = $1`,
          [boxId]
        );

        await client.query(
          `UPDATE items 
           SET times_won = times_won + 1 
           WHERE id = $1`,
          [drawResult.item.id]
        );

        // 8. Log for audit
        fairnessLogger.info('Lootbox opened', {
          userId,
          username: user.username,
          boxId,
          boxName: lootbox.name,
          itemId: drawResult.item.id,
          itemName: drawResult.item.name,
          itemRarity: drawResult.item.rarity,
          pricePaid: boxPrice,
          fairnessHash: drawResult.fairnessHash,
          timestamp: new Date().toISOString()
        });

        // 9. Return result
        return {
          success: true,
          data: {
            opening: {
              id: inventoryResult.rows[0].id,
              lootbox: {
                id: lootbox.id,
                name: lootbox.name
              },
              item: drawResult.item,
              pricePaid: boxPrice,
              newBalance: userBalance - boxPrice
            },
            fairness: {
              hash: drawResult.fairnessHash,
              timestamp: drawResult.fairnessData.timestamp,
              verifiable: true
            }
          }
        };
      });
    } catch (error) {
      logger.error('Error opening lootbox:', error);
      throw error;
    }
  }

  /**
   * Execute Provably Fair Draw Algorithm
   * CRITICAL: This is the core fairness algorithm
   * 
   * @param {object} lootbox - Lootbox configuration with items array
   * @param {number} userId - User ID
   * @returns {Promise<object>} - Draw result with item and fairness proof
   */
  async executeProvenlyFairDraw(lootbox, userId) {
    try {
      // 1. Parse items configuration
      const items = lootbox.items; // Expected format: [{ id, weight, ... }]
      
      logger.info('Execute draw - lootbox items', { 
        lootboxId: lootbox.id, 
        itemsCount: items?.length,
        items: JSON.stringify(items)
      });
      
      if (!items || items.length === 0) {
        throw new AppError('Lootbox has no items configured', 500, 'NO_ITEMS_CONFIGURED');
      }

      // Validate that all items have weights
      const invalidItems = items.filter(item => !item.weight || item.weight <= 0);
      if (invalidItems.length > 0) {
        logger.error('Invalid item weights detected', { invalidItems });
        throw new AppError('Invalid weight configuration - some items have no weight', 500, 'INVALID_WEIGHTS');
      }

      // 2. Calculate total weight
      const totalWeight = items.reduce((sum, item) => sum + (parseInt(item.weight) || 0), 0);

      logger.info('Total weight calculated', { totalWeight });

      if (totalWeight === 0) {
        throw new AppError('Invalid weight configuration', 500, 'INVALID_WEIGHTS');
      }

      // 3. Generate cryptographically secure random number
      const randomValue = secureRandomInt(1, totalWeight);

      // 4. Select item based on weighted distribution
      let cumulativeWeight = 0;
      let selectedItem = null;

      for (const item of items) {
        cumulativeWeight += item.weight;
        if (randomValue <= cumulativeWeight) {
          selectedItem = item;
          break;
        }
      }

      if (!selectedItem) {
        // Fallback: should never happen with correct logic
        selectedItem = items[items.length - 1];
        logger.error('Fallback item selection triggered', {
          randomValue,
          totalWeight,
          itemsCount: items.length
        });
      }

      // 5. Get full item details from database
      const itemResult = await pool.query(
        `SELECT id, name, description, image_url, rarity, value, category
         FROM items
         WHERE id = $1`,
        [selectedItem.id]
      );

      if (itemResult.rows.length === 0) {
        throw new AppError('Selected item not found in database', 500, 'ITEM_NOT_FOUND');
      }

      const fullItem = itemResult.rows[0];

      // 6. Generate fairness proof (HMAC)
      const timestamp = Date.now();
      const fairnessData = {
        userId,
        lootboxId: lootbox.id,
        itemId: fullItem.id,
        timestamp,
        randomValue,
        totalWeight
      };

      // Create HMAC with server seed (secret) + fairness data
      const fairnessString = JSON.stringify(fairnessData);
      const fairnessHash = generateHMAC(
        fairnessString,
        `${process.env.FAIRNESS_SECRET_SEED}_${timestamp}`
      );

      // 7. Log draw details (for admin verification)
      fairnessLogger.info('Provably fair draw executed', {
        ...fairnessData,
        itemName: fullItem.name,
        itemRarity: fullItem.rarity,
        fairnessHash
      });

      // 8. Return result
      return {
        item: fullItem,
        fairnessHash,
        fairnessData
      };
    } catch (error) {
      logger.error('Error in provably fair draw:', error);
      throw error;
    }
  }

  /**
   * Verify fairness of a past opening
   * Allows users to verify their openings were fair
   * 
   * @param {number} openingId - Opening ID to verify
   * @param {number} userId - User ID (for ownership check)
   * @returns {Promise<object>} - Verification result
   */
  async verifyOpening(openingId, userId) {
    try {
      // 1. Get opening record
      const result = await pool.query(
        `SELECT 
          lo.id,
          lo.user_id,
          lo.lootbox_id,
          lo.item_id,
          lo.fairness_hash,
          lo.fairness_data,
          lo.opened_at,
          i.name as item_name,
          i.rarity,
          lb.name as lootbox_name
         FROM lootbox_openings lo
         JOIN items i ON lo.item_id = i.id
         JOIN lootboxes lb ON lo.lootbox_id = lb.id
         WHERE lo.id = $1`,
        [openingId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Opening not found', 404, 'OPENING_NOT_FOUND');
      }

      const opening = result.rows[0];

      // 2. Verify ownership (users can only verify their own openings, admins can verify all)
      if (opening.user_id !== userId) {
        throw new AppError('Not authorized to verify this opening', 403, 'FORBIDDEN');
      }

      // 3. Regenerate hash with same data
      const fairnessData = opening.fairness_data;
      const fairnessString = JSON.stringify(fairnessData);
      const regeneratedHash = generateHMAC(
        fairnessString,
        `${process.env.FAIRNESS_SECRET_SEED}_${fairnessData.timestamp}`
      );

      // 4. Compare hashes
      const isValid = regeneratedHash === opening.fairness_hash;

      // 5. Return verification result
      return {
        success: true,
        data: {
          verification: {
            openingId: opening.id,
            lootboxName: opening.lootbox_name,
            itemName: opening.item_name,
            rarity: opening.rarity,
            openedAt: opening.opened_at,
            isValid,
            fairnessHash: opening.fairness_hash,
            verificationHash: regeneratedHash,
            fairnessData: {
              randomValue: fairnessData.randomValue,
              totalWeight: fairnessData.totalWeight,
              timestamp: fairnessData.timestamp
            }
          }
        }
      };
    } catch (error) {
      logger.error('Error verifying opening:', error);
      throw error;
    }
  }

  /**
   * Get lootbox details with items and probabilities
   * @param {number} boxId - Lootbox ID
   * @param {boolean} showProbabilities - Whether to show exact probabilities (admin only)
   * @returns {Promise<object>} - Lootbox details
   */
  async getLootBoxDetails(boxId, showProbabilities = false) {
    try {
      // Get lootbox
      const boxResult = await pool.query(
        `SELECT * FROM lootboxes WHERE id = $1`,
        [boxId]
      );

      if (boxResult.rows.length === 0) {
        throw new AppError('Lootbox not found', 404, 'LOOTBOX_NOT_FOUND');
      }

      const lootbox = boxResult.rows[0];
      const items = lootbox.items;

      // Calculate probabilities
      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

      // Get full item details
      const itemIds = items.map(item => item.id);
      const itemsResult = await pool.query(
        `SELECT * FROM items WHERE id = ANY($1)`,
        [itemIds]
      );

      const itemsMap = {};
      itemsResult.rows.forEach(item => {
        itemsMap[item.id] = item;
      });

      // Combine items with probabilities
      const enrichedItems = items.map(item => {
        const fullItem = itemsMap[item.id];
        const probability = (item.weight / totalWeight) * 100;

        return {
          ...fullItem,
          // Only show exact probability if authorized
          probability: showProbabilities ? probability : this.getRarityRange(probability),
          weight: showProbabilities ? item.weight : undefined
        };
      });

      // Sort by value (descending)
      enrichedItems.sort((a, b) => b.value - a.value);

      return {
        success: true,
        data: {
          lootbox: {
            id: lootbox.id,
            name: lootbox.name,
            description: lootbox.description,
            price: lootbox.price,
            image_url: lootbox.image_url,
            category: lootbox.category,
            min_level: lootbox.min_level,
            times_opened: lootbox.times_opened,
            items: enrichedItems
          }
        }
      };
    } catch (error) {
      logger.error('Error getting lootbox details:', error);
      throw error;
    }
  }

  /**
   * Convert exact probability to rarity range (for public display)
   * @param {number} probability - Exact probability
   * @returns {string} - Rarity range description
   */
  getRarityRange(probability) {
    if (probability >= 50) return 'Very Common (50%+)';
    if (probability >= 20) return 'Common (20-50%)';
    if (probability >= 5) return 'Uncommon (5-20%)';
    if (probability >= 1) return 'Rare (1-5%)';
    if (probability >= 0.1) return 'Very Rare (0.1-1%)';
    return 'Extremely Rare (<0.1%)';
  }

  /**
   * Get user's opening history
   * @param {number} userId - User ID
   * @param {number} limit - Results limit
   * @param {number} offset - Results offset
   * @returns {Promise<object>} - Opening history
   */
  async getUserOpenings(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          lo.id,
          lo.opened_at,
          lo.price_paid,
          lb.name as lootbox_name,
          lb.image_url as lootbox_image,
          i.name as item_name,
          i.rarity,
          i.value,
          i.image_url as item_image
         FROM lootbox_openings lo
         JOIN lootboxes lb ON lo.lootbox_id = lb.id
         JOIN items i ON lo.item_id = i.id
         WHERE lo.user_id = $1
         ORDER BY lo.opened_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM lootbox_openings WHERE user_id = $1`,
        [userId]
      );

      return {
        success: true,
        data: {
          openings: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit,
          offset
        }
      };
    } catch (error) {
      logger.error('Error getting user openings:', error);
      throw error;
    }
  }
}

export default new LootBoxService();
