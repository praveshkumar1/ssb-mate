import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import BlogPost from '../models/BlogPost';
import { authenticateToken } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/blog - list published posts, optional category, search, featured
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, q, featured, limit } = req.query as { category?: string; q?: string; featured?: string; limit?: string };
    const filter: any = { published: true };
    if (category) filter.category = category;
    if (featured === 'true' || featured === '1') filter.featured = true;
    let query = BlogPost.find(filter).populate('authorId', 'firstName lastName profileImageUrl').sort({ createdAt: -1 });
    if (q) {
      query = BlogPost.find({ ...filter, $text: { $search: q } }).populate('authorId', 'firstName lastName profileImageUrl').sort({ createdAt: -1 });
    }
    const lim = Math.min(Math.max(parseInt(limit || '0', 10) || 0, 0), 50);
    if (lim > 0) query = query.limit(lim);
    const posts = await query.exec();
    return res.json({ success: true, data: posts });
  } catch (err) {
    logger.error('Error listing blog posts', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/blog/:id - get a single post
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('authorId', 'firstName lastName profileImageUrl');
    if (!post || !post.published) return res.status(404).json({ success: false, message: 'Post not found' });
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/blog - create a post (mentee, mentor, or admin)
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('content').trim().isLength({ min: 20 }).withMessage('Content must be at least 20 characters'),
  body('excerpt').optional({ checkFalsy: true, nullable: true }).trim().isString().isLength({ max: 500 }).withMessage('Excerpt must be 500 characters or less'),
  // Accept empty string as "not provided" for thumbnailUrl
  body('thumbnailUrl').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Thumbnail URL must be a valid URL'),
  body('category').optional({ checkFalsy: true, nullable: true }).trim().isString(),
  body('featured').optional().isBoolean(),
  body('published').optional().isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const user = (req as any).user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!['mentee', 'mentor', 'admin'].includes(user.role)) return res.status(403).json({ success: false, message: 'Only authenticated users can create blog posts' });

    // Normalize body fields
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '').trim();
    const excerpt = typeof req.body.excerpt === 'string' ? req.body.excerpt.trim() : undefined;
    const category = typeof req.body.category === 'string' ? req.body.category.trim() : undefined;
    const thumbnailUrl = typeof req.body.thumbnailUrl === 'string' ? req.body.thumbnailUrl.trim() : undefined;

    const post = await BlogPost.create({
      title,
      excerpt: excerpt || undefined,
      content,
      category: category || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      featured: !!req.body.featured,
      published: 'published' in req.body ? !!req.body.published : true,
      authorId: user._id || user.userId
    });

    const populated = await post.populate('authorId', 'firstName lastName profileImageUrl');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('Error creating blog post', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/blog/:id - update own post (mentor) or any (admin)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const existing = await BlogPost.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Post not found' });
    const isAuthor = existing.authorId && (existing.authorId as any).toString() === ((user._id || user.userId || '').toString());
    const isAdmin = user.role === 'admin';
    if (!isAuthor && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const update: any = { ...req.body, updatedAt: new Date() };
    delete update.authorId;

    const updated = await BlogPost.findByIdAndUpdate(req.params.id, update, { new: true }).populate('authorId', 'firstName lastName profileImageUrl');
    return res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Error updating blog post', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/blog/:id - delete own post (mentor) or any (admin)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const existing = await BlogPost.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Post not found' });
    const isAuthor = existing.authorId && (existing.authorId as any).toString() === ((user._id || user.userId || '').toString());
    const isAdmin = user.role === 'admin';
    if (!isAuthor && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });
    await existing.deleteOne();
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    logger.error('Error deleting blog post', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
