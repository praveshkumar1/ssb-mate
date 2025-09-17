import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    jwt.verify(token, secret, async (err: any, decoded: any) => {
      if (err) {
        logger.error('Token verification failed:', err.message);
        res.status(403).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }

      try {
        // Get user from database to ensure they still exist and are active
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user || !user.isActive) {
          res.status(403).json({
            success: false,
            error: 'User not found or inactive'
          });
          return;
        }

        req.user = user;
        next();
      } catch (dbError) {
        logger.error('Database error in auth middleware:', dbError);
        res.status(500).json({
          success: false,
          error: 'Authentication error'
        });
      }
    });
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};
