import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import LiveDiscussion from '../models/LiveDiscussion';
import { authenticateToken } from '../middleware/authMiddleware';
import { apiLogger } from '../utils/logger';

const router = Router();

// Helper to check admin
function requireAdmin(req: Request, res: Response, next: (err?: any) => void) {
  const role = (req as any).user?.role;
  if (role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin only' });
    return;
  }
  return next();
}

// List upcoming discussions
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const list = await LiveDiscussion.find({ startTime: { $gte: new Date(now.getTime() - 24*60*60*1000) } })
      .sort({ startTime: 1 })
      .populate('attendees', 'firstName lastName profileImageUrl')
      .populate('createdBy', 'firstName lastName');
    res.json({ success: true, data: list });
  } catch (e: any) {
    apiLogger.error('Failed to list discussions', { error: e?.message || e });
    res.status(500).json({ success: false, error: 'Failed to list discussions' });
  }
});

// Admin create a discussion
router.post('/admin', authenticateToken, requireAdmin, [
  body('title').isString().isLength({ min: 3 }),
  body('startTime').isISO8601(),
  body('capacity').optional().isInt({ min: 1 }),
  body('meetLink').isString().isLength({ min: 8 }),
  body('description').optional().isString(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  try {
    const { title, description, startTime, capacity = 10, meetLink } = req.body;
    const createdBy = (req as any).user?._id || (req as any).user?.userId;
    const doc = await LiveDiscussion.create({ title, description, startTime: new Date(startTime), capacity, meetLink, attendees: [], createdBy });
    res.status(201).json({ success: true, data: doc });
  } catch (e: any) {
    apiLogger.error('Failed to create discussion', { error: e?.message || e });
    res.status(500).json({ success: false, error: 'Failed to create discussion' });
  }
});

// Join a discussion (reserve a seat)
router.post('/:id/join', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    const disc = await LiveDiscussion.findById(req.params.id);
    if (!disc) return res.status(404).json({ success: false, error: 'Discussion not found' });

    const now = new Date();
    const start = new Date(disc.startTime);
    // Must join no later than 10 minutes before start
    const cutoff = new Date(start.getTime() - 10 * 60 * 1000);
    if (now > cutoff) {
      return res.status(400).json({ success: false, error: 'Join window closed' });
    }
    // capacity check
    const already = disc.attendees.some(a => String(a) === String(userId));
    if (!already && disc.attendees.length >= disc.capacity) {
      return res.status(400).json({ success: false, error: 'Room is full' });
    }
    if (!already) disc.attendees.push(userId);
    await disc.save();
    res.json({ success: true, data: { status: 'joined' } });
  } catch (e: any) {
    apiLogger.error('Failed to join discussion', { error: e?.message || e });
    res.status(500).json({ success: false, error: 'Failed to join discussion' });
  }
  return; // satisfy TS that function completes
});

// Access the meet link (enforce timing: disabled until 5 minutes before start)
router.get('/:id/access', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
    const disc = await LiveDiscussion.findById(req.params.id);
    if (!disc) return res.status(404).json({ success: false, error: 'Discussion not found' });

    const isAttendee = disc.attendees.some(a => String(a) === String(userId));
    if (!isAttendee && (req as any).user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not joined' });
    }
    const now = new Date();
    const start = new Date(disc.startTime);
    const enableAt = new Date(start.getTime() - 5 * 60 * 1000);
    if (now < enableAt) {
      return res.status(403).json({ success: false, error: 'Access not yet enabled', enableAt: enableAt.toISOString() });
    }
    res.json({ success: true, data: { meetLink: disc.meetLink } });
  } catch (e: any) {
    apiLogger.error('Failed to access discussion', { error: e?.message || e });
    res.status(500).json({ success: false, error: 'Failed to access discussion' });
  }
  return; // satisfy TS
});

export default router;
