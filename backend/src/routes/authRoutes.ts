import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { logger, authLogger, securityLogger } from '../utils/logger';
import { hash } from 'crypto';

const router = Router();

// Registration validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('role')
    .isIn(['mentor', 'mentee'])
    .withMessage('Role must be either mentor or mentee')
];

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// POST /api/auth/register - Register a new user
router.post('/register', registerValidation, async (req: Request, res: Response) => {
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
      isActive: true,
      isVerified: role === 'mentee' // Auto-verify mentees, mentors need manual verification
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
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
router.post('/login', loginValidation, async (req: Request, res: Response) => {
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
    console.log('password validity result',isPasswordValid);
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
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
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
