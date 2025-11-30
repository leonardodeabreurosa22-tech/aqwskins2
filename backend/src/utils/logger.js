import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define transports
const transports = [
  // Write all logs to combined.log
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Write errors to error.log
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5,
  }),
];

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create audit logger for critical operations
export const auditLogger = winston.createLogger({
  level: 'info',
  format,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Create fairness logger for lootbox operations
export const fairnessLogger = winston.createLogger({
  level: 'info',
  format,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/fairness.log'),
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});

// Create transaction logger for financial operations
export const transactionLogger = winston.createLogger({
  level: 'info',
  format,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/transactions.log'),
      maxsize: 20971520, // 20MB
      maxFiles: 20,
    }),
  ],
});

export default logger;
