import { Request, Response, NextFunction } from 'express';
import { apiLogger } from '../utils/logger';

// Extend Request interface to include startTime
interface TimedRequest extends Request {
  startTime?: number;
}

export const requestLogger = (req: TimedRequest, res: Response, next: NextFunction) => {
  // Record start time
  req.startTime = Date.now();
  
  // Get client information
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const userId = (req as any).user?._id || (req as any).user?.userId || undefined; // From auth middleware if available
  const email = (req as any).user?.email || undefined;
  const requestId = (req as any).requestId || undefined;
  
  // Override res.end to capture response details
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log the request
    apiLogger.request(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      clientIP,
      userId
    );
    // add granular log with meta for important tracing
    apiLogger.info('API completed', { requestId, method: req.method, url: req.originalUrl, statusCode: res.statusCode, responseTime, ip: clientIP, userId, email });
    
    // Call original end method
    return originalEnd(chunk, encoding, cb);
  } as any;
  
  next();
};

// Middleware to log errors
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  const userId = (req as any).user?._id || (req as any).user?.userId || undefined;
  const email = (req as any).user?.email || undefined;
  const requestId = (req as any).requestId || undefined;
  
  apiLogger.error(
    req.method,
    req.originalUrl,
    error,
    clientIP,
    userId
  );
  apiLogger.error('API error details', { requestId, email });
  
  next(error);
};

export default { requestLogger, errorLogger };
