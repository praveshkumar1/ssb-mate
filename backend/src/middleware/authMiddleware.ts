import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authLogger, securityLogger } from '../utils/logger';
import User from '../models/User';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
        user?: {
          userId: string;
          _id?: string;
          email: string;
          role: string;
          isVerified: boolean;
        };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  isVerified: boolean;
  iat: number;
  exp: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      authLogger.warn('Authentication attempted without token', {
        endpoint: req.originalUrl,
        method: req.method,
        ip: clientIP,
        userAgent
      });

      res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      authLogger.error('JWT_SECRET not configured', {
        endpoint: req.originalUrl,
        method: req.method,
        ip: clientIP
      });

      res.status(500).json({
        success: false,
        error: 'Authentication configuration error'
      });
      return;
    }

  const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      securityLogger.warn('Token used for inactive or non-existent user', {
        endpoint: req.originalUrl,
        method: req.method,
        userId: decoded.userId,
        userEmail: decoded.email,
        ip: clientIP,
        userAgent
      });

      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    // Check if user data in token matches current user data
    if (user.email !== decoded.email || user.role !== decoded.role) {
      securityLogger.warn('Token data mismatch with current user data', {
        endpoint: req.originalUrl,
        method: req.method,
        userId: decoded.userId,
        tokenEmail: decoded.email,
        currentEmail: user.email,
        tokenRole: decoded.role,
        currentRole: user.role,
        ip: clientIP,
        userAgent
      });

      res.status(401).json({
        success: false,
        error: 'Token is outdated, please login again'
      });
      return;
    }

    // Add user info to request (attach both userId and _id as string for compatibility)
    const userIdStr = (user as any)._id ? (user as any)._id.toString() : undefined;
    req.user = {
      userId: userIdStr,
      _id: userIdStr,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    authLogger.info('Authentication successful', {
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      ip: clientIP,
      userAgent
    });

  next();
  return;

  } catch (error) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    if (error instanceof jwt.JsonWebTokenError) {
      securityLogger.warn('Invalid JWT token', {
        endpoint: req.originalUrl,
        method: req.method,
        error: error.message,
        ip: clientIP,
        userAgent
      });

      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      authLogger.warn('Expired JWT token', {
        endpoint: req.originalUrl,
        method: req.method,
        error: error.message,
        ip: clientIP,
        userAgent
      });

      res.status(401).json({
        success: false,
        error: 'Token expired, please login again'
      });
      return;
    }

    authLogger.error('Authentication error', {
      endpoint: req.originalUrl,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: clientIP,
      userAgent
    });

    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
    return;
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    // No token provided, continue without authentication
    return next();
  }

  // Token provided, validate it
  return authenticateToken(req, res, next);
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!req.user) {
      securityLogger.warn('Role check attempted without authentication', {
        endpoint: req.originalUrl,
        method: req.method,
        requiredRoles: allowedRoles,
        ip: clientIP
      });

      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes((req.user as any).role)) {
      securityLogger.warn('Insufficient role permissions', {
        endpoint: req.originalUrl,
        method: req.method,
        userId: (req.user as any).userId,
        userRole: (req.user as any).role,
        requiredRoles: allowedRoles,
        ip: clientIP
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
    return;
  };
};

// Require verified user
export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (!(req.user as any).isVerified) {
    securityLogger.warn('Unverified user attempted protected action', {
      endpoint: req.originalUrl,
      method: req.method,
      userId: (req.user as any).userId,
      userEmail: (req.user as any).email,
      ip: clientIP
    });

    res.status(403).json({
      success: false,
      error: 'Account verification required'
    });
    return;
  }

  next();
  return;
};

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireVerified
};
