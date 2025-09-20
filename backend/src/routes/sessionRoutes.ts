import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Session from '../models/Session';
import { logger, apiLogger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/sessions - Get all sessions
router.get('/', async (req: Request, res: Response) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    apiLogger.info('Fetching all sessions', {
      endpoint: '/api/sessions',
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    
    const sessions = await Session.find()
      .populate('mentorId', 'firstName lastName email')
      .populate('menteeId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    apiLogger.info(`Successfully retrieved ${sessions.length} sessions`, {
      endpoint: '/api/sessions',
      count: sessions.length,
      ip: clientIP
    });

    return res.json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: sessions
    });

  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    apiLogger.error('Error fetching sessions', {
      endpoint: '/api/sessions',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving sessions'
    });
  }
});

// GET /api/sessions/:id - Get session by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate('mentorId', 'firstName lastName email')
      .populate('menteeId', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    logger.info(`Getting session: ${id}`);

    return res.json({
      success: true,
      message: 'Session retrieved successfully',
      data: session
    });

  } catch (error) {
    logger.error('Error getting session:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving session'
    });
  }
});

// POST /api/sessions - Create new session
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters long'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('mentorId').isMongoId().withMessage('Valid mentor ID is required'),
  body('sessionType').isIn(['group_discussion', 'personal_interview', 'planning_exercise', 'general_mentoring']).withMessage('Valid session type is required'),
  body('duration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      mentorId,
      sessionType,
      duration,
      scheduledAt,
      meetingLink
    } = req.body;

  // Use authenticated user as menteeId. `authMiddleware` attaches a minimal `req.user` with `userId`.
  const authUserId = (req as any).user?.userId || (req as any).user?._id && (req as any).user._id.toString();
  const menteeId = authUserId || req.body.menteeId;

  if (!menteeId) {
    logger.warn('Attempt to create session without menteeId (authenticated user missing)', { endpoint: '/api/sessions', ip: req.ip });
    return res.status(401).json({ success: false, message: 'Authentication required to create session' });
  }

    const newSession = new Session({
      title,
      description,
      mentorId,
      menteeId,
      sessionType,
      duration,
      scheduledAt: new Date(scheduledAt),
      meetingLink,
      status: 'scheduled'
    });

  await newSession.save();

    // Populate the saved session with mentor and mentee details
    const populatedSession = await Session.findById(newSession._id)
      .populate('mentorId', 'firstName lastName email')
      .populate('menteeId', 'firstName lastName email');

    logger.info(`New session created: ${newSession._id}`);

    return res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: populatedSession
    });

  } catch (error) {
    logger.error('Error creating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating session'
    });
  }
});

// PUT /api/sessions/:id - Update session
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const session = await Session.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('mentorId', 'firstName lastName email')
      .populate('menteeId', 'firstName lastName email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    logger.info(`Session updated: ${id}`);

    return res.json({
      success: true,
      message: 'Session updated successfully',
      data: session
    });

  } catch (error) {
    logger.error('Error updating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating session'
    });
  }
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await Session.findByIdAndDelete(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    logger.info(`Session deleted: ${id}`);

    return res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting session:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting session'
    });
  }
});

export default router;
