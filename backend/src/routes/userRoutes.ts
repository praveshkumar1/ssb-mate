import { Router, Request, Response } from 'express';
import { logger, apiLogger } from '../utils/logger';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/users/profile - Get authenticated user's profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    const userId = (req as any).user?.userId || (req as any).user?._id;
    if (!userId) {
      apiLogger.warn('Access to /api/users/profile without userId in token', {
        endpoint: '/api/users/profile',
        ip: clientIP,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const found = await User.findById(userId).select('-password');
    if (!found) {
      apiLogger.warn('Authenticated user not found', {
        endpoint: '/api/users/profile',
        userId,
        ip: clientIP
      });
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    apiLogger.info('Returning authenticated user profile', {
      endpoint: '/api/users/profile',
      userId,
      ip: clientIP
    });

    return res.json({ success: true, data: found, timestamp: new Date().toISOString() });
  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    apiLogger.error('Error fetching user profile', {
      endpoint: '/api/users/profile',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/users/profile - Update authenticated user's profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    // `authenticateToken` attaches full user document to req.user
    const currentUser: any = (req as any).user;
    if (!currentUser || !currentUser._id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Allow only a safe subset of fields to be updated
    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'bio', 'experience', 'specializations',
      'rank', 'unit', 'achievements', 'hourlyRate', 'availability', 'location',
      'profileImageUrl', 'certifications', 'sportsPlayed'
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided to update' });
    }

    // If specializations/achievements/availability/certifications/sportsPlayed are provided as comma-separated strings, normalize to arrays
    const arrayFields = ['specializations', 'achievements', 'availability', 'certifications', 'sportsPlayed'];
    for (const f of arrayFields) {
      if (f in updates && typeof updates[f] === 'string') {
        updates[f] = updates[f].split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Update the user document
    const updated = await User.findByIdAndUpdate(currentUser._id, { $set: updates }, { new: true }).select('-password');

    apiLogger.info('User profile updated', {
      endpoint: '/api/users/profile',
      userId: currentUser._id.toString(),
      updatedFields: Object.keys(updates)
    });

    return res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
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

// GET /api/users - Get all users (paginated)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    logger.info('Getting users with filters:', { page, limit });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find({ isActive: true })
        .select('-password')
        .sort({ isVerified: -1, rating: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments({ isActive: true })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data: users,
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
    logger.error('Error getting users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

export default router;
