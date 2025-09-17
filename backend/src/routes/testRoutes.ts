import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { seedDatabase } from '../database/seed';

const router = Router();

// GET /api/test/hello - Test endpoint
router.get('/hello', (req: Request, res: Response) => {
  try {
    logger.info('Test endpoint accessed');
    
    res.json({
      success: true,
      message: 'Hello from SSB Connect Backend!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/test/health - Health check
router.get('/health', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    logger.error('Error in health endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// POST /api/test/seed - Seed database with test data
router.post('/seed', async (req: Request, res: Response) => {
  try {
    logger.info('Seeding database with test data');
    
    await seedDatabase();
    
    res.json({
      success: true,
      message: 'Database seeded successfully with test data',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed database'
    });
  }
});

export default router;
