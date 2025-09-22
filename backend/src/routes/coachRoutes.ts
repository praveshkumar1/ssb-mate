import { Router, Request, Response } from 'express';
import { logger, apiLogger } from '../utils/logger';
import User from '../models/User';

const router = Router();

// GET /api/coaches/verified - Get all verified coaches
router.get('/verified', async (req: Request, res: Response) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    apiLogger.info('Fetching verified coaches list', {
      endpoint: '/api/coaches/verified',
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    
    const coaches = await User.find({ 
      role: 'mentor',
      isVerified: true,
      isActive: true 
    }).select('-password').sort({ rating: -1, totalReviews: -1 });
    
    apiLogger.info(`Successfully retrieved ${coaches.length} verified coaches`, {
      endpoint: '/api/coaches/verified',
      count: coaches.length,
      ip: clientIP
    });
    
    return res.json({
      success: true,
      data: coaches,
      count: coaches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    apiLogger.error('Error fetching verified coaches', {
      endpoint: '/api/coaches/verified',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch verified coaches'
    });
  }
});

// GET /api/coaches/top-rated - Get top rated coaches (by rating and totalReviews)
router.get('/top-rated', async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    apiLogger.info('Fetching top-rated coaches', {
      endpoint: '/api/coaches/top-rated',
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      limit
    });

    const limitNum = parseInt(limit as string) || 5;
    const coaches = await User.find({ role: 'mentor', isActive: true })
      .select('-password')
      .sort({ rating: -1, totalReviews: -1 })
      .limit(limitNum);

    apiLogger.info(`Returning ${coaches.length} top-rated coaches`, {
      endpoint: '/api/coaches/top-rated',
      count: coaches.length,
      ip: clientIP
    });

    return res.json({
      success: true,
      data: coaches,
      count: coaches.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    apiLogger.error('Error fetching top-rated coaches', {
      endpoint: '/api/coaches/top-rated',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    return res.status(500).json({ success: false, error: 'Failed to fetch top-rated coaches' });
  }
});

// GET /api/coaches/:id - Get coach by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    apiLogger.info(`Fetching coach profile by ID`, {
      endpoint: `/api/coaches/${id}`,
      coachId: id,
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    
    const coach = await User.findOne({
      _id: id,
      role: 'mentor',
      isActive: true
    }).select('-password');
    
    if (!coach) {
      apiLogger.warn(`Coach not found`, {
        endpoint: `/api/coaches/${id}`,
        coachId: id,
        ip: clientIP
      });
      
      return res.status(404).json({
        success: false,
        error: 'Coach not found'
      });
    }
    
    apiLogger.info(`Successfully retrieved coach profile`, {
      endpoint: `/api/coaches/${id}`,
      coachId: id,
      coachName: coach.firstName + ' ' + coach.lastName,
      ip: clientIP
    });
    
    return res.json({
      success: true,
      data: coach,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    apiLogger.error('Error fetching coach profile', {
      endpoint: `/api/coaches/${req.params.id}`,
      coachId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch coach'
    });
  }
});

// GET /api/coaches - Get all coaches with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, verified, specialization, minRating } = req.query;
    logger.info('Getting coaches with filters:', { page, limit, verified, specialization, minRating });
    
    // Build query
    const query: any = { 
      role: 'mentor',
      isActive: true 
    };
    
    if (verified === 'true') {
      query.isVerified = true;
    }
    
    if (specialization) {
      query.specializations = { $in: [specialization] };
    }
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating as string) };
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const [coaches, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ isVerified: -1, rating: -1, totalReviews: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limitNum);
    
    return res.json({
      success: true,
      data: coaches,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting coaches:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch coaches'
    });
  }
});

// GET /api/coaches/search/:term - Search coaches
router.get('/search/:term', async (req: Request, res: Response) => {
  try {
    const { term } = req.params;
    const { limit = 10 } = req.query;
    
    logger.info(`Searching coaches with term: ${term}`);
    
    const coaches = await User.find({
      role: 'mentor',
      isActive: true,
      $or: [
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } },
        { bio: { $regex: term, $options: 'i' } },
        { specializations: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } }
      ]
    })
    .select('-password')
    .sort({ isVerified: -1, rating: -1 })
    .limit(parseInt(limit as string));
    
    return res.json({
      success: true,
      data: coaches,
      count: coaches.length,
      searchTerm: term,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error searching coaches:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search coaches'
    });
  }
});

export default router;
