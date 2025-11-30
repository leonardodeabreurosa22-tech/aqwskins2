import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import middlewares
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { csrfProtection } from './middlewares/csrfProtection.js';
import { i18nMiddleware } from './middlewares/i18n.js';
import { requestLogger } from './middlewares/requestLogger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import lootboxRoutes from './routes/lootbox.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import depositRoutes from './routes/deposit.routes.js';
import withdrawRoutes from './routes/withdraw.routes.js';
import exchangerRoutes from './routes/exchanger.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import adminRoutes from './routes/admin.routes.js';
import fairnessRoutes from './routes/fairness.routes.js';
import currencyRoutes from './routes/currency.routes.js';

// Import utilities
import { logger } from './utils/logger.js';
import { connectDatabase } from './config/database.js';
import { initializeCronJobs } from './utils/cronJobs.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io for real-time features (tickets, notifications)
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  'https://aqwskins2.vercel.app',
  'https://aqwskins2-git-main-dominiks-projects-dfdcda04.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept-Language']
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// Compression
app.use(compression());

// Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Internationalization
app.use(i18nMiddleware);

// Rate Limiting (Global)
app.use(rateLimiter);

// Health Check Endpoint (No auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes (v1)
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/lootboxes`, lootboxRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/deposits`, depositRoutes);
app.use(`${API_PREFIX}/withdrawals`, withdrawRoutes);
app.use(`${API_PREFIX}/exchanger`, exchangerRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);
app.use(`${API_PREFIX}/tickets`, ticketRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/fairness`, fairnessRoutes);
app.use(`${API_PREFIX}/currency`, currencyRoutes);

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// Socket.io Event Handlers
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket_${ticketId}`);
    logger.info(`Socket ${socket.id} joined ticket ${ticketId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Server Initialization
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Initialize Cron Jobs (backups, seed rotation, etc)
    initializeCronJobs();
    logger.info('✅ Cron jobs initialized');

    // Start HTTP Server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 API URL: ${process.env.API_URL}`);
      
      if (process.env.MAINTENANCE_MODE === 'true') {
        logger.warn('⚠️  MAINTENANCE MODE ENABLED');
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

export default app;
