import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Resource from '../models/Resource';
import { logger, apiLogger } from '../utils/logger';

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
      .populate('createdBy', 'firstName lastName')
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
      .populate('createdBy', 'firstName lastName');

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
router.post('/', [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters long'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('type').isIn(['study_material', 'video', 'practice_test', 'article', 'ebook', 'webinar']).withMessage('Valid resource type is required'),
  body('category').isIn(['interview_preparation', 'group_discussion', 'planning_exercise', 'psychological_tests', 'general']).withMessage('Valid category is required'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Valid difficulty level is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
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
      type,
      category,
      url,
      difficulty,
      tags
    } = req.body;

    // For now, we'll use a placeholder createdBy since we don't have auth middleware
    // In production, this would come from the authenticated user
    const createdBy = req.body.createdBy || '507f1f77bcf86cd799439011'; // placeholder

    const newResource = new Resource({
      title,
      description,
      type,
      category,
      url,
      difficulty: difficulty || 'intermediate',
      tags: tags || [],
      createdBy,
      isActive: true
    });

    await newResource.save();

    // Populate the saved resource with creator details
    const populatedResource = await Resource.findById(newResource._id)
      .populate('createdBy', 'firstName lastName');

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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByIdAndDelete(id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

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
