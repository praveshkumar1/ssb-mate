import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import Resource from '../models/Resource';

const router = Router();

// GET /api/resources - Get all resources
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Getting all resources');
    
    const resources = await Resource.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      data: resources,
      count: resources.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting resources:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch resources'
    });
  }
});

// GET /api/resources/by-category/:category - Get resources by category
router.get('/by-category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    logger.info(`Getting resources for category: ${category}`);
    
    const resources = await Resource.find({ 
      category,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      data: resources,
      count: resources.length,
      category,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting resources by category:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch resources'
    });
  }
});

export default router;
