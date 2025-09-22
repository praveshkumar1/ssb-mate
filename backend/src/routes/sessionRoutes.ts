import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Session from '../models/Session';
import User from '../models/User';
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
    
    // Support optional query params: mentorId, type=upcoming|past
    const { mentorId, type } = req.query as any;
    const query: any = {};
    if (mentorId) query.mentorId = mentorId;
    if (type === 'upcoming') query.scheduledAt = { $gte: new Date() };
    if (type === 'past') query.scheduledAt = { $lt: new Date() };

    const sessions = await Session.find(query)
      .populate('mentorId', 'firstName lastName email')
      .populate('menteeId', 'firstName lastName email')
      .sort({ scheduledAt: -1 });

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
  body('title').trim().isLength({ min: 0 }).withMessage('Title must be at least 3 characters long'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('mentorId').isMongoId().withMessage('Valid mentor ID is required'),
  body('sessionType').isIn(['group_discussion', 'personal_interview', 'planning_exercise', 'general_mentoring']).withMessage('Valid session type is required'),
  body('duration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Map express-validator errors to clearer field-specific messages
      const mapped = errors.array().map(err => {
        const e: any = err;
        const field = e.param || 'unknown';
        let message = e.msg || 'Invalid value';

        // Provide friendlier and more specific messages for common fields
        if (field === 'sessionType') {
          message = 'Session type must be one of: group_discussion, personal_interview, planning_exercise, general_mentoring';
        } else if (field === 'mentorId') {
          message = 'A valid mentorId (MongoDB ObjectId) is required.';
        } else if (field === 'duration') {
          message = 'Duration must be an integer between 15 and 180 minutes.';
        } else if (field === 'scheduledAt') {
          message = 'Please provide a valid scheduled date/time (ISO 8601).' ;
        } else if (field === 'description') {
          message = 'Description must be at least 10 characters long.';
        } else if (field === 'title') {
          message = 'Title must be a non-empty string.';
        }

        return { field, message };
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: mapped
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

  // Use authenticated user as menteeId. `authMiddleware` may attach either {_id} or {userId}.
  const rawAuthUser = (req as any).user?._id ?? (req as any).user?.userId;
  const authUserId = rawAuthUser ? (rawAuthUser.toString ? rawAuthUser.toString() : String(rawAuthUser)) : undefined;
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

    // Attempt to remove the booked slot from the mentor's availability so the coach sees the updated availability
    try {
      const scheduledTime = new Date(scheduledAt).getTime();
      const TOLERANCE_MS = 2 * 60 * 1000; // 2 minutes tolerance to account for format/offset differences
      const mentor = await User.findById(mentorId);
      if (mentor) {
        const before = Array.isArray(mentor.availability) ? mentor.availability.slice() : [] as any[];
        const removed: any[] = [];
        const updated = before.filter((a: any) => {
          try {
            if (!a) return true;
            const candidateIso = typeof a === 'string' ? a : (a.start || a.iso || null);
            if (!candidateIso) return true;
            const candidateTime = new Date(candidateIso).getTime();
            const diff = Math.abs(candidateTime - scheduledTime);
            if (!Number.isFinite(candidateTime) || Number.isNaN(candidateTime)) return true;
            if (diff <= TOLERANCE_MS) {
              removed.push(candidateIso);
              return false; // filter out (remove)
            }
            return true; // keep
          } catch (err) {
            return true;
          }
        });
        mentor.availability = updated as any;
        await mentor.save();
        apiLogger.info('Updated mentor availability after booking', { endpoint: '/api/sessions', mentorId, removedSlots: removed, beforeCount: before.length, afterCount: updated.length });
      } else {
        apiLogger.warn('Mentor not found when attempting to remove booked availability', { endpoint: '/api/sessions', mentorId });
      }
    } catch (e) {
      apiLogger.error('Failed to update mentor availability after booking', { endpoint: '/api/sessions', error: e instanceof Error ? e.message : e });
    }

    // Log simulated emails to coach and mentee (actual mailing to be implemented separately)
    try {
  const coachEmail = (populatedSession?.mentorId as any)?.email || null;
  const menteeEmail = (populatedSession?.menteeId as any)?.email || null;
      apiLogger.info('Simulated email sent to coach (booking notification)', { endpoint: '/api/sessions', sessionId: newSession._id, to: coachEmail, subject: 'New session booked' });
      apiLogger.info('Simulated email sent to mentee (booking confirmation)', { endpoint: '/api/sessions', sessionId: newSession._id, to: menteeEmail, subject: 'Session confirmation' });
    } catch (e) {
      apiLogger.error('Failed to log simulated email notifications', { endpoint: '/api/sessions', error: e instanceof Error ? e.message : e });
    }

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

    // Find the session first to enforce authorization
    const existing = await Session.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Ensure request has authenticated user
    const authUserId = (req as any).user?.userId || (req as any).user?._id;
    const authUserRole = (req as any).user?.role;
    if (!authUserId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Only the mentor who owns the session or an admin can update
    const ownerId = existing.mentorId ? (existing.mentorId as any).toString() : null;
    if (String(authUserId) !== String(ownerId) && authUserRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this session' });
    }

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

    // If this update includes a menteeRating, update mentor's aggregate rating
    try {
      if (updateData && updateData.menteeRating && session && session.mentorId) {
        const mId = (session.mentorId as any)._id || session.mentorId;
        const mentor = await User.findById(mId);
        if (mentor) {
          const newRating = Number(updateData.menteeRating);
          if (!Number.isNaN(newRating)) {
            const oldRating = (mentor.rating || 0) as number;
            const oldCount = (mentor.totalReviews || 0) as number;
            const updatedCount = oldCount + 1;
            const updatedRating = ((oldRating * oldCount) + newRating) / updatedCount;
            mentor.rating = Math.round((updatedRating + Number.EPSILON) * 100) / 100;
            mentor.totalReviews = updatedCount;
            await mentor.save();
            apiLogger.info('Updated mentor aggregate rating', { mentorId: mId, rating: mentor.rating, totalReviews: mentor.totalReviews });
          }
        }
      }
    } catch (e) {
      apiLogger.error('Failed to update mentor rating after session feedback', { error: e instanceof Error ? e.message : e });
    }

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

    // Find the session first to enforce authorization
    const existing = await Session.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const authUserId = (req as any).user?.userId || (req as any).user?._id;
    const authUserRole = (req as any).user?.role;
    if (!authUserId) return res.status(401).json({ success: false, message: 'Authentication required' });

    const ownerId = existing.mentorId ? (existing.mentorId as any).toString() : null;
    if (String(authUserId) !== String(ownerId) && authUserRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this session' });
    }

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
