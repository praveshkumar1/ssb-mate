import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import User from '../models/User';
import { logger, authLogger, securityLogger } from '../utils/logger';
import { hash } from 'crypto';

const router = Router();

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Stricter rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Registration validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim()
    .escape()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must be 2-50 characters and contain only letters'),
  body('lastName')
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must be 2-50 characters and contain only letters'),
  body('role')
    .isIn(['mentor', 'mentee'])
    .withMessage('Role must be either mentor or mentee'),
  body('phoneNumber')
    .optional()
    .trim()
    .escape()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('bio')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters')
];

// Additional optional validation for mentor fields when role=mentor
const mentorConditionalValidation = [
  body('experience').optional().isFloat({ min: 0 }).withMessage('Experience must be a non-negative number'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a non-negative number'),
  body('education').optional().isString().isLength({ min: 1 }).withMessage('Education must be a non-empty string'),
  body('achievements').optional().custom(value => {
    // allow array or comma-separated string
    if (Array.isArray(value)) return true;
    if (typeof value === 'string') return value.length > 0;
    throw new Error('Achievements must be an array or comma-separated string');
  }),
  body('specializations').optional().custom(value => {
    if (Array.isArray(value)) return true;
    if (typeof value === 'string') return value.length > 0;
    throw new Error('Specializations must be an array or comma-separated string');
  })
];

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim()
    .escape()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .trim()
    .withMessage('Password is required')
];

// POST /api/auth/register - Register a new user
router.post('/register', authLimiter, registerValidation, async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

  const { email, password, firstName, lastName, role, phoneNumber, bio } = req.body;
    // If role is mentor, validate mentor-specific fields more strictly
    if (role === 'mentor') {
      const mentorErrors: any[] = [];
      if (req.body.experience !== undefined) {
        const exp = Number(req.body.experience);
        if (Number.isNaN(exp) || exp < 0) mentorErrors.push({ param: 'experience', msg: 'Experience must be a non-negative number' });
      }
      if (req.body.hourlyRate !== undefined) {
        const hr = Number(req.body.hourlyRate);
        if (Number.isNaN(hr) || hr < 0) mentorErrors.push({ param: 'hourlyRate', msg: 'Hourly rate must be a non-negative number' });
      }
      if (req.body.education !== undefined && String(req.body.education).trim().length === 0) {
        mentorErrors.push({ param: 'education', msg: 'Education must be a non-empty string' });
      }
      if (mentorErrors.length > 0) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: mentorErrors });
      }
    }
  // Optional mentor-specific fields
  const experience = req.body.experience !== undefined ? Number(req.body.experience) : undefined;
  const education = req.body.education ? String(req.body.education) : undefined;
  const achievements = req.body.achievements ? (Array.isArray(req.body.achievements) ? req.body.achievements : String(req.body.achievements).split(',').map((s: string) => s.trim()).filter(Boolean)) : [];
  const hourlyRate = req.body.hourlyRate !== undefined ? Number(req.body.hourlyRate) : undefined;
  const specializations = req.body.specializations ? (Array.isArray(req.body.specializations) ? req.body.specializations : String(req.body.specializations).split(',').map((s: string) => s.trim()).filter(Boolean)) : [];

    // Get IP address for logging
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      securityLogger.suspiciousActivity(
        'Registration attempt with existing email',
        email,
        clientIP,
        { userAgent: req.get('User-Agent') }
      );
      
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phoneNumber,
      bio,
      experience: typeof experience === 'number' && !Number.isNaN(experience) ? experience : undefined,
      education: education || undefined,
      achievements: achievements,
      hourlyRate: typeof hourlyRate === 'number' && !Number.isNaN(hourlyRate) ? hourlyRate : undefined,
      specializations: specializations,
      isActive: true,
      isVerified: role === 'mentee' // Auto-verify mentees, mentors need manual verification
    });

    await newUser.save();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not configured');
      return res.status(500).json({
        success: false,
        message: 'Authentication configuration error'
      });
    }

    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email, 
        role: newUser.role 
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    authLogger.register(email, role, clientIP);
    logger.info(`New user registered: ${email} as ${role}`, {
      userId: newUser._id,
      email,
      role,
      ip: clientIP,
      userAgent: req.get('User-Agent')
    });

    // Remove password from response
    const userResponse = newUser.toJSON();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', loginLimiter, loginValidation, async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

  let { email, password } = req.body;
  if (typeof password === 'string') password = password.trim();

    // Get IP address and User Agent for logging
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

  // Find user by email
  const user = await User.findOne({ email });
    if (!user) {
      authLogger.login(email, false, clientIP, userAgent);
      securityLogger.suspiciousActivity(
        'Login attempt with non-existent email',
        email,
        clientIP,
        { userAgent }
      );
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      authLogger.login(email, false, clientIP, userAgent);
      securityLogger.suspiciousActivity(
        'Login attempt with deactivated account',
        email,
        clientIP,
        { userAgent, userId: user._id }
      );
      
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      authLogger.login(email, false, clientIP, userAgent);
      securityLogger.suspiciousActivity(
        'Login attempt with invalid password',
        email,
        clientIP,
        { userAgent, userId: user._id }
      );
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not configured');
      return res.status(500).json({
        success: false,
        message: 'Authentication configuration error'
      });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log successful login
    authLogger.login(email, true, clientIP, userAgent);
    logger.info(`User logged in: ${email}`, {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: clientIP,
      userAgent
    });

    // Remove password from response
    const userResponse = user.toJSON();

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
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

    const { email } = req.body;

    // Get IP address for logging
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const user = await User.findOne({ email });
    if (!user) {
      // Log password reset attempt for non-existent user
      securityLogger.suspiciousActivity(
        'Password reset attempt for non-existent email',
        email,
        clientIP,
        { userAgent }
      );
      
      // Don't reveal whether user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link will be sent.'
      });
    }

    // Log password reset request
    authLogger.passwordReset(email, clientIP);
    logger.info(`Password reset requested for: ${email}`, {
      userId: user._id,
      email,
      ip: clientIP,
      userAgent
    });

    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link will be sent.'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
