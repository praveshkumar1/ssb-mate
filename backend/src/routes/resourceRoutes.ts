import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Resource from '../models/Resource';
import { logger, apiLogger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/resources - Get all resources with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, category, difficulty, tags } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (tags) {
      // Handle multiple tags
      const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
      filter.tags = { $in: tagArray };
    }

    const resources = await Resource.find(filter)
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 });

    logger.info('Getting all resources');

    return res.json({
      success: true,
      message: 'Resources retrieved successfully',
      data: resources
    });

  } catch (error) {
    logger.error('Error getting resources:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving resources'
    });
  }
});

// GET /api/resources/:id - Get resource by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id)
      .populate('authorId', 'firstName lastName');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    logger.info(`Getting resource: ${id}`);

    return res.json({
      success: true,
      message: 'Resource retrieved successfully',
      data: resource
    });

  } catch (error) {
    logger.error('Error getting resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving resource'
    });
  }
});

// POST /api/resources - Create new resource
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters long'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters long'),
  body('category').isIn(['interview_tips', 'preparation_guide', 'assessment_format', 'success_stories', 'mock_tests', 'video_tutorials']).withMessage('Valid category is required'),
  body('fileUrl').optional().isURL().withMessage('Valid file URL is required'),
  body('thumbnailUrl').optional().isURL().withMessage('Valid thumbnail URL is required'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Valid difficulty level is required'),
  body('tags').optional().custom((v) => Array.isArray(v) || typeof v === 'string').withMessage('Tags must be an array or comma-separated string')
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
      content,
      category,
      fileUrl,
      thumbnailUrl,
      difficulty,
      tags
    } = req.body;

    // Use authenticated user as author. `authMiddleware` may attach either {_id} or {userId}.
    const rawAuthUser = (req as any).user?._id ?? (req as any).user?.userId;
    const authUserId = rawAuthUser ? (rawAuthUser.toString ? rawAuthUser.toString() : String(rawAuthUser)) : undefined;
    if (!authUserId) {
      return res.status(401).json({ success: false, message: 'Authentication required to create resource' });
    }

    // Normalize tags: accept comma-separated string or array
    let normalizedTags: string[] = [];
    if (tags) {
      if (Array.isArray(tags)) normalizedTags = tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean);
      else if (typeof tags === 'string') normalizedTags = tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    }

    const newResource = new Resource({
      title,
      description,
      content,
      category,
      fileUrl: fileUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      difficulty: difficulty || 'beginner',
      tags: normalizedTags,
      authorId: authUserId,
      isPublic: true
    });

    await newResource.save();

    // Populate the saved resource with creator details
    const populatedResource = await Resource.findById(newResource._id)
      .populate('authorId', 'firstName lastName');

    logger.info(`New resource created: ${newResource._id}`);

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: populatedResource
    });

  } catch (error) {
    logger.error('Error creating resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating resource'
    });
  }
});

// PUT /api/resources/:id - Update resource
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Prevent changing creator from request body
    if ('createdBy' in updateData) delete (updateData as any).createdBy;

  const rawAuthUser = (req as any).user?._id ?? (req as any).user?.userId;
  const authUserId = rawAuthUser ? (rawAuthUser.toString ? rawAuthUser.toString() : String(rawAuthUser)) : undefined;

    // Ensure resource exists and check authorization (only creator or admin can update)
  const existing = await Resource.findById(id).populate('authorId', 'firstName lastName');
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const isCreator = existing.authorId && ((existing.authorId as any)._id || (existing.authorId as any).id)
      ? ((existing.authorId as any)._id || (existing.authorId as any).id).toString() === authUserId
      : false;
    const isAdmin = (req as any).user?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to update resource' });
    }

    const resource = await Resource.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('authorId', 'firstName lastName');

    logger.info(`Resource updated: ${id}`);

    return res.json({
      success: true,
      message: 'Resource updated successfully',
      data: resource
    });

  } catch (error) {
    logger.error('Error updating resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating resource'
    });
  }
});

// DELETE /api/resources/:id - Delete resource
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

  const rawAuthUser2 = (req as any).user?._id ?? (req as any).user?.userId;
  const authUserId = rawAuthUser2 ? (rawAuthUser2.toString ? rawAuthUser2.toString() : String(rawAuthUser2)) : undefined;

  const existing = await Resource.findById(id).populate('authorId', 'firstName lastName');
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const isCreator = existing.authorId && ((existing.authorId as any)._id || (existing.authorId as any).id)
      ? ((existing.authorId as any)._id || (existing.authorId as any).id).toString() === authUserId
      : false;
    const isAdmin = (req as any).user?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to delete resource' });
    }

    const resource = await Resource.findByIdAndDelete(id);

    logger.info(`Resource deleted: ${id}`);

    return res.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting resource:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting resource'
    });
  }
});

export default router;
