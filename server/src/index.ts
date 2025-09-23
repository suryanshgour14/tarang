import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { app, initializeServices } from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize services
    await initializeServices();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Ocean Hazard API server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
