import winston from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, errors, json, printf, colorize, splat } = winston.format;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, service, userId, email, ip, userAgent, ...meta }) => {
  let logMessage = `${timestamp} [${level}]: ${stack || message}`;
  
  // Add user context if available
  if (userId || email) {
    logMessage += ` | User: ${email || userId}`;
  }
  
  // Add IP and User Agent for security logs
  if (ip) {
    logMessage += ` | IP: ${ip}`;
  }
  
  // Add any additional metadata
  if (Object.keys(meta).length > 0) {
    logMessage += ` | Meta: ${JSON.stringify(meta)}`;
  }
  
  return logMessage;
});

// Custom format for file output (JSON with more details)
const fileFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  splat(),
  json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { 
    service: 'ssb-connect-backend',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  },
  transports: [
    // Write all logs with level `error` and above to `error.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Write all logs to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    // Write auth-specific logs to `auth.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'auth.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: combine(
        winston.format((info) => {
          // Only log auth-related messages
          return info.type === 'auth' ? info : false;
        })(),
        fileFormat
      )
    }),
    // Write security-specific logs to `security.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: combine(
        winston.format((info) => {
          // Only log security-related messages
          return info.type === 'security' ? info : false;
        })(),
        fileFormat
      )
    })
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  }));
}

// Helper functions for specific log types
export const authLogger = {
  login: (email: string, success: boolean, ip?: string, userAgent?: string) => {
    logger.info('User login attempt', {
      type: 'auth',
      action: 'login',
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  register: (email: string, role: string, ip?: string) => {
    logger.info('User registration', {
      type: 'auth',
      action: 'register',
      email,
      role,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logout: (email: string, ip?: string) => {
    logger.info('User logout', {
      type: 'auth',
      action: 'logout',
      email,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  passwordReset: (email: string, ip?: string) => {
    logger.info('Password reset requested', {
      type: 'auth',
      action: 'password_reset_request',
      email,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

export const securityLogger = {
  suspiciousActivity: (reason: string, email?: string, ip?: string, details?: any) => {
    logger.warn('Suspicious activity detected', {
      type: 'security',
      reason,
      email,
      ip,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  bruteForce: (email: string, ip: string, attempts: number) => {
    logger.warn('Potential brute force attack', {
      type: 'security',
      action: 'brute_force_attempt',
      email,
      ip,
      attempts,
      timestamp: new Date().toISOString()
    });
  },
  
  unauthorizedAccess: (endpoint: string, ip?: string, userAgent?: string) => {
    logger.warn('Unauthorized access attempt', {
      type: 'security',
      action: 'unauthorized_access',
      endpoint,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }
};

export const apiLogger = {
  request: (method: string, url: string, statusCode: number, responseTime: number, ip?: string, userId?: string) => {
    logger.info('API Request', {
      type: 'api',
      method,
      url,
      statusCode,
      responseTime,
      ip,
      userId,
      timestamp: new Date().toISOString()
    });
  },
  
  error: (method: string, url: string, error: Error, ip?: string, userId?: string) => {
    logger.error('API Error', {
      type: 'api',
      method,
      url,
      error: error.message,
      stack: error.stack,
      ip,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;
