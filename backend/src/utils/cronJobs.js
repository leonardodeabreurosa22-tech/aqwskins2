import cron from 'node-cron';
import { logger, auditLogger } from './logger.js';
import pool from '../config/database.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Cron jobs disabled in test environment');
    return;
  }

  // Daily backup at 2 AM
  if (process.env.BACKUP_ENABLED === 'true') {
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily backup...');
      await performDatabaseBackup();
    });
    logger.info('✅ Daily backup cron job scheduled (2 AM)');
  }

  // Weekly seed rotation (Sunday at 3 AM)
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Running weekly seed rotation...');
    await rotateFairnessSeed();
  });
  logger.info('✅ Weekly seed rotation cron job scheduled (Sunday 3 AM)');

  // Hourly cleanup of expired sessions
  cron.schedule('0 * * * *', async () => {
    await cleanupExpiredSessions();
  });
  logger.info('✅ Hourly session cleanup cron job scheduled');

  // Daily statistics aggregation at 1 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('Running daily statistics aggregation...');
    await aggregateDailyStatistics();
  });
  logger.info('✅ Daily statistics cron job scheduled (1 AM)');

  // Check pending withdrawals every hour
  cron.schedule('0 * * * *', async () => {
    await checkPendingWithdrawals();
  });
  logger.info('✅ Hourly pending withdrawals check scheduled');

  // Cleanup old logs (monthly, 1st day at 4 AM)
  cron.schedule('0 4 1 * *', async () => {
    logger.info('Running monthly log cleanup...');
    await cleanupOldLogs();
  });
  logger.info('✅ Monthly log cleanup cron job scheduled');
};

/**
 * Perform database backup
 */
async function performDatabaseBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../backups/backup_${timestamp}.sql`);
    
    const command = `pg_dump ${process.env.DATABASE_URL} > ${backupPath}`;
    await execAsync(command);
    
    logger.info(`Database backup completed: ${backupPath}`);
    auditLogger.info('Database backup completed', { backupPath, timestamp });

    // Cleanup old backups (keep last 30 days)
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || 30);
    await cleanupOldBackups(retentionDays);
  } catch (error) {
    logger.error('Database backup failed:', error);
  }
}

/**
 * Rotate fairness seed for enhanced security
 */
async function rotateFairnessSeed() {
  try {
    // In production, this would update environment variable or secure vault
    // For now, just log the rotation
    auditLogger.warn('Fairness seed rotation triggered', {
      timestamp: new Date().toISOString(),
      note: 'Update FAIRNESS_SECRET_SEED in environment'
    });
    
    logger.info('Fairness seed rotation reminder logged');
  } catch (error) {
    logger.error('Seed rotation failed:', error);
  }
}

/**
 * Cleanup expired sessions
 */
async function cleanupExpiredSessions() {
  try {
    // If using database sessions
    const result = await pool.query(
      `DELETE FROM sessions WHERE expires_at < NOW()`
    );
    
    if (result.rowCount > 0) {
      logger.info(`Cleaned up ${result.rowCount} expired sessions`);
    }
  } catch (error) {
    // Sessions table might not exist if using JWT only
    logger.debug('Session cleanup skipped:', error.message);
  }
}

/**
 * Aggregate daily statistics
 */
async function aggregateDailyStatistics() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate lootbox openings
    const openingsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_openings,
        SUM(price_paid) as total_revenue,
        COUNT(DISTINCT user_id) as unique_users
       FROM lootbox_openings
       WHERE opened_at >= $1 AND opened_at < $2`,
      [yesterday, today]
    );

    // Aggregate deposits
    const depositsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_deposits,
        SUM(amount_usd) as total_amount,
        COUNT(DISTINCT user_id) as unique_depositors
       FROM deposits
       WHERE status = 'completed' AND completed_at >= $1 AND completed_at < $2`,
      [yesterday, today]
    );

    // Aggregate withdrawals
    const withdrawalsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_withdrawals,
        COUNT(DISTINCT user_id) as unique_withdrawers
       FROM withdrawals
       WHERE created_at >= $1 AND created_at < $2`,
      [yesterday, today]
    );

    const stats = {
      date: yesterday.toISOString().split('T')[0],
      openings: openingsResult.rows[0],
      deposits: depositsResult.rows[0],
      withdrawals: withdrawalsResult.rows[0]
    };

    // Store in daily_statistics table (if exists)
    await pool.query(
      `INSERT INTO daily_statistics (date, data, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (date) DO UPDATE SET data = $2, updated_at = NOW()`,
      [stats.date, JSON.stringify(stats)]
    ).catch(() => {
      // Table might not exist, just log
      logger.info('Daily statistics:', stats);
    });

    logger.info('Daily statistics aggregated successfully');
  } catch (error) {
    logger.error('Statistics aggregation failed:', error);
  }
}

/**
 * Check and alert on pending withdrawals
 */
async function checkPendingWithdrawals() {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        MAX(EXTRACT(EPOCH FROM (NOW() - created_at))/3600) as oldest_hours
       FROM withdrawals
       WHERE status = 'pending_manual'`
    );

    const { total, oldest_hours } = result.rows[0];

    if (total > 0) {
      const hoursOld = parseFloat(oldest_hours);
      
      if (hoursOld > 48) { // Alert if oldest is over 48 hours
        auditLogger.warn('Pending withdrawals require attention', {
          totalPending: total,
          oldestHours: hoursOld.toFixed(2)
        });
      }
      
      logger.info(`Pending manual withdrawals: ${total}, oldest: ${hoursOld.toFixed(2)}h`);
    }
  } catch (error) {
    logger.error('Pending withdrawals check failed:', error);
  }
}

/**
 * Cleanup old backup files
 */
async function cleanupOldBackups(retentionDays) {
  try {
    const backupsDir = path.join(__dirname, '../../backups');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const command = `find ${backupsDir} -name "backup_*.sql" -mtime +${retentionDays} -delete`;
    await execAsync(command);
    
    logger.info(`Old backups cleaned up (retention: ${retentionDays} days)`);
  } catch (error) {
    logger.error('Backup cleanup failed:', error);
  }
}

/**
 * Cleanup old log files
 */
async function cleanupOldLogs() {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    const retentionDays = 90; // Keep logs for 90 days
    
    const command = `find ${logsDir} -name "*.log" -mtime +${retentionDays} -delete`;
    await execAsync(command);
    
    logger.info(`Old logs cleaned up (retention: ${retentionDays} days)`);
  } catch (error) {
    logger.error('Log cleanup failed:', error);
  }
}

export default {
  initializeCronJobs,
  performDatabaseBackup,
  rotateFairnessSeed
};
