import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

/**
 * Request Logger Middleware
 * Logs all incoming requests with correlation ID
 */
export const requestLogger = (req, res, next) => {
  // Generate correlation ID for request tracking
  req.correlationId = uuidv4();

  // Log request details
  logger.info('Incoming Request', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    language: req.language
  });

  // Capture response time
  const startTime = Date.now();

  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing Response', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });

    return originalJson(data);
  };

  next();
};
