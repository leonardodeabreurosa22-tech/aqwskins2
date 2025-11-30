import pool, { transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logger, transactionLogger } from '../utils/logger.js';
import { generateId } from '../utils/crypto.js';
import axios from 'axios';

/**
 * CURRENCY SERVICE
 * Handles multi-currency support and conversions
 */
class CurrencyService {
  constructor() {
    this.supportedCurrencies = ['USD', 'BRL', 'EUR', 'PHP'];
    this.baseCurrency = 'USD';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates() {
    try {
      const cached = this.cache.get('rates');
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      const response = await axios.get(
        `${process.env.EXCHANGE_RATE_API_URL}/${this.baseCurrency}`,
        {
          params: {
            apikey: process.env.EXCHANGE_RATE_API_KEY
          },
          timeout: 5000
        }
      );

      const rates = {
        USD: 1,
        BRL: response.data.rates.BRL,
        EUR: response.data.rates.EUR,
        PHP: response.data.rates.PHP,
        updated: new Date().toISOString()
      };

      this.cache.set('rates', { data: rates, timestamp: Date.now() });
      return rates;
    } catch (error) {
      logger.error('Error fetching exchange rates:', error);
      // Return fallback rates
      return {
        USD: 1,
        BRL: 5.0,
        EUR: 0.92,
        PHP: 56.0,
        updated: new Date().toISOString()
      };
    }
  }

  /**
   * Convert amount between currencies
   */
  async convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();
    const usdAmount = amount / rates[fromCurrency];
    return usdAmount * rates[toCurrency];
  }
}

/**
 * DEPOSIT SERVICE
 * Handles credit deposits with multi-currency and payment gateway integration
 */
class DepositService {
  constructor() {
    this.currencyService = new CurrencyService();
  }

  /**
   * Create deposit
   * @param {number} userId - User ID
   * @param {number} amount - Amount in user's currency
   * @param {string} currency - Currency code (USD, BRL, EUR, PHP)
   * @param {string} method - Payment method (stripe, paypal, pix, etc)
   * @param {object} metadata - Additional payment metadata
   */
  async createDeposit(userId, amount, currency, method, metadata = {}) {
    try {
      // Validate currency
      if (!this.currencyService.supportedCurrencies.includes(currency)) {
        throw new AppError('Unsupported currency', 400, 'UNSUPPORTED_CURRENCY');
      }

      // Validate minimum deposit
      const minDeposit = this.getMinimumDeposit(currency);
      if (amount < minDeposit) {
        throw new AppError(
          `Minimum deposit is ${minDeposit} ${currency}`,
          400,
          'AMOUNT_TOO_LOW'
        );
      }

      // Convert to USD (base currency for credits)
      const usdAmount = await this.currencyService.convert(amount, currency, 'USD');

      // Generate transaction ID
      const transactionId = generateId();

      // Create deposit record
      const result = await pool.query(
        `INSERT INTO deposits 
         (id, user_id, amount_original, currency_original, amount_usd, payment_method, status, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW())
         RETURNING *`,
        [transactionId, userId, amount, currency, usdAmount, method, JSON.stringify(metadata)]
      );

      const deposit = result.rows[0];

      // Initialize payment based on method
      const paymentData = await this.initializePayment(deposit, method);

      transactionLogger.info('Deposit created', {
        depositId: transactionId,
        userId,
        amount,
        currency,
        usdAmount,
        method
      });

      return {
        success: true,
        data: {
          deposit: {
            id: deposit.id,
            amount: deposit.amount_original,
            currency: deposit.currency_original,
            credits: deposit.amount_usd, // Credits in USD
            method: deposit.payment_method,
            status: deposit.status
          },
          payment: paymentData
        }
      };
    } catch (error) {
      logger.error('Error creating deposit:', error);
      throw error;
    }
  }

  /**
   * Initialize payment with gateway
   */
  async initializePayment(deposit, method) {
    switch (method) {
      case 'stripe':
        return this.initializeStripePayment(deposit);
      case 'paypal':
        return this.initializePayPalPayment(deposit);
      case 'pix':
        return this.initializePIXPayment(deposit);
      default:
        throw new AppError('Unsupported payment method', 400, 'UNSUPPORTED_METHOD');
    }
  }

  /**
   * Initialize Stripe payment
   */
  async initializeStripePayment(deposit) {
    // Stripe integration placeholder
    return {
      gateway: 'stripe',
      clientSecret: 'pi_xxxxxxxxxxxxxxxxxx',
      publicKey: process.env.STRIPE_PUBLIC_KEY
    };
  }

  /**
   * Initialize PayPal payment
   */
  async initializePayPalPayment(deposit) {
    // PayPal integration placeholder
    return {
      gateway: 'paypal',
      orderId: 'paypal_order_xxxxx',
      approvalUrl: 'https://paypal.com/approve/xxxxx'
    };
  }

  /**
   * Initialize PIX payment (Brazil)
   */
  async initializePIXPayment(deposit) {
    // PIX integration placeholder
    return {
      gateway: 'pix',
      qrCode: 'data:image/png;base64,xxxxx',
      pixKey: '00020126360014br.gov.bcb.pix...',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  }

  /**
   * Confirm deposit (webhook handler)
   */
  async confirmDeposit(depositId, paymentData) {
    try {
      return await transaction(async (client) => {
        // Get deposit
        const depositResult = await client.query(
          `SELECT * FROM deposits WHERE id = $1 FOR UPDATE`,
          [depositId]
        );

        if (depositResult.rows.length === 0) {
          throw new AppError('Deposit not found', 404, 'DEPOSIT_NOT_FOUND');
        }

        const deposit = depositResult.rows[0];

        if (deposit.status !== 'pending') {
          throw new AppError('Deposit already processed', 400, 'ALREADY_PROCESSED');
        }

        // Update deposit status
        await client.query(
          `UPDATE deposits 
           SET status = 'completed', 
               payment_data = $1,
               completed_at = NOW()
           WHERE id = $2`,
          [JSON.stringify(paymentData), depositId]
        );

        // Add credits to user balance
        await client.query(
          `UPDATE users 
           SET balance = balance + $1,
               total_deposited = total_deposited + $1
           WHERE id = $2`,
          [deposit.amount_usd, deposit.user_id]
        );

        transactionLogger.info('Deposit confirmed', {
          depositId,
          userId: deposit.user_id,
          credits: deposit.amount_usd
        });

        return {
          success: true,
          data: {
            depositId,
            creditsAdded: deposit.amount_usd
          }
        };
      });
    } catch (error) {
      logger.error('Error confirming deposit:', error);
      throw error;
    }
  }

  /**
   * Get minimum deposit for currency
   */
  getMinimumDeposit(currency) {
    const minimums = {
      USD: 5,
      BRL: 25,
      EUR: 5,
      PHP: 250
    };
    return minimums[currency] || 5;
  }

  /**
   * Get user deposit history
   */
  async getUserDeposits(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          id, 
          amount_original as amount, 
          currency_original as currency,
          amount_usd as credits,
          payment_method,
          status,
          created_at,
          completed_at
         FROM deposits
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM deposits WHERE user_id = $1`,
        [userId]
      );

      return {
        success: true,
        data: {
          deposits: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit,
          offset
        }
      };
    } catch (error) {
      logger.error('Error getting user deposits:', error);
      throw error;
    }
  }
}

export default new DepositService();
