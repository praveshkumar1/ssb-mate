import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger, errorLogger } from './middleware/requestLogger';
import { connectDatabase } from './database/connection';
import { seedDatabase } from './database/seed';
import { csrfProtection } from './middleware/csrf';

// Import routes
import testRoutes from './routes/testRoutes';
import coachRoutes from './routes/coachRoutes'
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import sessionRoutes from './routes/sessionRoutes';
import resourceRoutes from './routes/resourceRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:8082',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    'x-requested-with'
  ],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (avatars, etc.) from the uploads directory
import path from 'path';
import fs from 'fs';

// Use repository root (process.cwd()) so the uploads path is consistent whether running via ts-node or built dist
const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info(`Created uploads directory at ${uploadsDir}`);
  }
} catch (err) {
  logger.error('Failed to create uploads directory', err);
}

app.use('/uploads', express.static(uploadsDir));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SSB Connect Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: {
        test: '/api/test/hello',
        auth: '/api/auth/login',
        coaches: '/api/coaches/verified',
        users: '/api/users/profile',
        sessions: '/api/sessions',
        resources: '/api/resources'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SSB Connect API v1.0.0',
    description: 'Services Selection Board mentoring platform API',
    version: '1.0.0',
    endpoints: {
      test: '/api/test/hello',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        forgotPassword: '/api/auth/forgot-password'
      },
      coaches: {
        verified: '/api/coaches/verified',
        all: '/api/coaches',
        search: '/api/coaches/search'
      },
      users: {
        profile: '/api/users/profile',
        all: '/api/users'
      },
      sessions: '/api/sessions',
      resources: '/api/resources'
    },
    timestamp: new Date().toISOString(),
    status: 'online'
  });
});

// API Routes
app.use('/api/test', testRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/resources', resourceRoutes);

// CSRF protection for state-changing requests (reads cookie header and validates header token)
app.use(csrfProtection);

// 404 handler
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize MongoDB connection
    try {
      await connectDatabase();
      logger.info('Database connection established successfully');
    } catch (dbError) {
      logger.error('Database connection failed:', dbError);
      process.exit(1);
    }

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 CORS Allowed Origins: ${allowedOrigins.join(', ')}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app;
