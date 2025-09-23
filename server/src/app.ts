import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import reportRoutes from './routes/reports';
import mediaRoutes from './routes/media';
import nlpRoutes from './routes/nlp';
import syncRoutes from './routes/sync';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error';
import { generalLimiter } from './middleware/rateLimit';
import { sanitizeInput } from './middleware/validation';

// Import services
import { testConnection } from './config/database';
import { NLPService } from './services/nlpService';
import { MediaService } from './services/mediaService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ocean Hazard Monitoring API',
      version: '1.0.0',
      description: 'Production-ready backend for crowdsourced ocean hazard monitoring platform',
      contact: {
        name: 'Ocean Hazard Team',
        email: 'support@oceanhazard.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.oceanhazard.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Reports',
        description: 'Hazard report operations',
      },
      {
        name: 'Media',
        description: 'Media upload and management',
      },
      {
        name: 'NLP',
        description: 'Natural language processing for hazard analysis',
      },
      {
        name: 'Sync',
        description: 'Offline synchronization',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://oceanhazard.com', 'https://www.oceanhazard.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes
app.use(generalLimiter);

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ocean Hazard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ocean Hazard API Documentation',
}));

// API routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/reports', reportRoutes);
app.use('/media', mediaRoutes);
app.use('/nlp', nlpRoutes);
app.use('/sync', syncRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Ocean Hazard Monitoring API',
    documentation: '/docs',
    health: '/health',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Database connection failed');
      process.exit(1);
    }

    // Initialize NLP service
    NLPService.initialize();
    logger.info('NLP service initialized');

    // Ensure media bucket exists
    await MediaService.ensureMediaBucket();
    logger.info('Media service initialized');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, initializeServices };
