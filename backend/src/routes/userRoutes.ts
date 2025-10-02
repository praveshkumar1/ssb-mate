import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger, apiLogger } from '../utils/logger';
import User from '../models/User';
import Session from '../models/Session';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer storage for avatars
// Resolve relative to this file's folder (src/routes or dist/routes) to always map to backend/uploads/avatars
// In dev (ts-node): __dirname = backend/src/routes => ../../uploads/avatars => backend/uploads/avatars
// In prod (compiled): __dirname = backend/dist/routes => ../../uploads/avatars => backend/uploads/avatars
const avatarsDir = path.resolve(__dirname, '../../uploads/avatars');
try {
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
    logger.info(`Created avatars directory at ${avatarsDir}`);
  }
} catch (err) {
  logger.error('Failed to create avatars directory', err);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext) || allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png)'));
    }
  }
});

// POST /api/users/upload - upload avatar image (authenticated)
router.post('/upload', authenticateToken, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Build public URL for the uploaded file
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const appBase = process.env.APP_BASE_URL || `${forwardedProto}://${forwardedHost}`;
  const relativePath = path.posix.join('/uploads', 'avatars', file.filename);
  const fileUrl = appBase + relativePath;
  const absoluteFsPath = path.join(avatarsDir, file.filename);
  const exists = fs.existsSync(absoluteFsPath);

    apiLogger.info('Avatar uploaded', { endpoint: '/api/users/upload', file: file.filename, user: (req as any).user?.userId });

    const payload: any = { url: fileUrl, filename: file.filename, path: relativePath };
    if (process.env.NODE_ENV !== 'production') {
      payload.exists = exists;
      payload.fsPath = absoluteFsPath;
    }
    return res.json({ success: true, data: payload, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

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

    // Normalize availability: convert legacy "start|end" and single ISO strings to structured objects for the frontend
    const doc: any = found?.toObject ? found.toObject() : found;
    if (doc && Array.isArray(doc.availability)) {
      doc.availability = doc.availability.map((a: any) => {
        if (!a) return a;
        if (typeof a === 'string') {
          if (a.includes('|')) {
            const [s, e] = a.split('|');
            return { start: s, end: e };
          }
          return { start: a };
        }
        return a;
      });
    }

    return res.json({ success: true, data: doc, timestamp: new Date().toISOString() });
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
    // `authenticateToken` may attach either a full user document or a small payload.
    // Normalize to a userId so we accept both shapes: { _id } or { userId }.
    const currentUser: any = (req as any).user;
    console.log('Current User in PUT /profile:', currentUser);

    const userId = currentUser?._id ?? currentUser?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Allow only a safe subset of fields to be updated
    const allowedFields = [
      'firstName', 'lastName', 'phoneNumber', 'bio', 'experience', 'specializations',
      'education', 'rank', 'unit', 'achievements', 'hourlyRate', 'availability', 'location',
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

    // Availability normalization: accept structured objects or strings; store as structured objects {start,end?}
    if ('availability' in updates && Array.isArray(updates.availability)) {
      updates.availability = updates.availability.map((a: any) => {
        if (!a) return a;
        if (typeof a === 'string') {
          if (a.includes('|')) {
            const [s, e] = a.split('|');
            return { start: new Date(s).toISOString(), end: new Date(e).toISOString() };
          }
          return { start: new Date(a).toISOString() };
        }
        const s = a.start || a.iso || null;
        const e = a.end || a.until || null;
        if (s && e) return { start: new Date(s).toISOString(), end: new Date(e).toISOString() };
        if (s) return { start: new Date(s).toISOString() };
        return a;
      });
    }

    // Update the user document
    const updated = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('-password');

    apiLogger.info('User profile updated', {
      endpoint: '/api/users/profile',
      userId: userId?.toString ? userId.toString() : String(userId),
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

// GET /api/users/stats - Get aggregated stats for the authenticated user (mentor)
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUser: any = (req as any).user;
    const userId = currentUser?._id ?? currentUser?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    // Aggregate sessions where the user is the mentor
    const match = { mentorId: userId } as any;

    const totalBookings = await Session.countDocuments(match);
    const completed = await Session.countDocuments({ ...match, status: 'completed' });
    // Assume sessions have a `price` or `paidAmount` field to sum revenue. Fallback to 0.
    const revenueAgg = await Session.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$paidAmount', '$price', 0] } } } }
    ]);
    const revenue = (revenueAgg && revenueAgg[0] && revenueAgg[0].total) ? revenueAgg[0].total : 0;

    return res.json({ success: true, data: { totalBookings, completed, revenue }, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// POST /api/users/choose-role - set role for current authenticated user (mentor or mentee)
router.post('/choose-role', authenticateToken, [
  body('role').isIn(['mentor', 'mentee']).withMessage('Role must be mentor or mentee')
], async (req: Request, res: Response) => {
  try {
    const currentUser: any = (req as any).user;
    const userId = currentUser?._id ?? currentUser?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { role } = req.body;
    const updates: any = { role };
    if (role === 'mentor') {
      updates.isVerified = false;
    } else {
      updates.isVerified = true;
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    apiLogger.info('User chose role', { userId, role });

    return res.json({ success: true, data: { user } });
  } catch (e) {
    logger.error('Choose role error', e);
    return res.status(500).json({ success: false, error: 'Failed to set role' });
  }
});

export default router;

