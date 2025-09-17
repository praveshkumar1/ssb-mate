import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import User from '../models/User';

const router = Router();

// GET /api/users/profile - Get user profile (placeholder)
router.get('/profile', (req: Request, res: Response) => {
  try {
    logger.info('Getting user profile');
    
    return res.json({
      success: true,
      message: 'User profile endpoint - authentication required',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in user profile endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/users/mentors - Get all mentors
router.get('/mentors', async (req: Request, res: Response) => {
  try {
    logger.info('Getting all mentors');
    
    const mentors = await User.find({ 
      role: 'mentor',
      isActive: true 
    }).select('-password').sort({ isVerified: -1, rating: -1 });
    
    return res.json({
      success: true,
      data: mentors,
      count: mentors.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting mentors:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch mentors'
    });
  }
});

export default router;
