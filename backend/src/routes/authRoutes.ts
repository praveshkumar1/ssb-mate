import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { logger, authLogger, securityLogger } from '../utils/logger';
import { hash } from 'crypto';
import fetch from 'node-fetch';
import jwtDecode from 'jwt-decode';
import { encryptText, decryptText } from '../utils/crypto';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../middleware/csrf';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Helper: create or update user from Google profile info
// Returns { user, created } where created is true if a new user was created
async function upsertGoogleUser(profile: any) {
  const email = profile.email;
  let user = await User.findOne({ email });
  let created = false;
  if (!user) {
    created = true;
    // create a placeholder password to satisfy schema; mark verified=false so onboarding can verify
    const randomPassword = Math.random().toString(36).slice(2, 10) + 'G';
    const hashed = await bcrypt.hash(randomPassword, 10);
    user = new User({
      email,
      password: hashed,
      firstName: profile.given_name || profile.firstName || '',
      lastName: profile.family_name || profile.lastName || '',
      profileImageUrl: profile.picture || profile.pictureUrl,
      isVerified: false,
      role: 'mentee'
    });
    await user.save();
  } else {
    // update picture/name if changed
    const updates: any = {};
    if (profile.given_name && profile.given_name !== user.firstName) updates.firstName = profile.given_name;
    if (profile.family_name && profile.family_name !== user.lastName) updates.lastName = profile.family_name;
    if (profile.picture && profile.picture !== user.profileImageUrl) updates.profileImageUrl = profile.picture;
    if (Object.keys(updates).length) {
      await User.findByIdAndUpdate(user._id, { $set: updates });
      user = await User.findById(user._id);
    }
  }
  return { user, created };
}

// GET /api/auth/google/url - optional helper to return authorization URL
router.get('/google/url', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'http://localhost:8080'}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    prompt: 'consent'
  });
  return res.json({ success: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});

// GET /api/auth/google/callback - exchange code for tokens and sign-in
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.status(400).json({ success: false, error: 'Missing code' });

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', process.env.GOOGLE_CLIENT_ID || '');
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '');
    params.append('redirect_uri', process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'http://localhost:8080'}/api/auth/google/callback`);
    params.append('grant_type', 'authorization_code');

    const tokenResp = await fetch(tokenUrl, { method: 'POST', body: params });
    const tokenJson = await tokenResp.json();
    const { id_token, access_token, refresh_token } = tokenJson;
    if (!id_token) return res.status(500).json({ success: false, error: 'No id_token in token response', tokenJson });

    // decode id_token
    const decoded: any = jwtDecode(id_token);
    const profile = {
      email: decoded.email,
      given_name: decoded.given_name || decoded.givenName,
      family_name: decoded.family_name || decoded.familyName,
      picture: decoded.picture,
      sub: decoded.sub,
      name: decoded.name
    };

    // create or update user
    const { user, created } = await upsertGoogleUser(decoded);
    if (!user) {
      return res.status(500).json({ success: false, error: 'Failed to create or fetch user' });
    }

    // persist google refresh token if provided (store server-side, encrypted)
    if (refresh_token) {
      try {
        const enc = encryptText(refresh_token);
        if (enc) {
          await User.findByIdAndUpdate(user._id, { $set: { googleRefreshToken: enc, googleId: decoded.sub } });
        } else {
          logger.warn('REFRESH_TOKEN_ENC_KEY not set - skipping persisting google refresh token');
        }
      } catch (e) {
        logger.warn('Could not persist google refresh token', e);
      }
    }

    // issue our app JWT
    const appToken = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    // Set HttpOnly cookie with app JWT for session authentication
    const cookieName = process.env.SESSION_COOKIE_NAME || 'ssb_token';
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: (process.env.JWT_EXPIRES_SECONDS ? parseInt(process.env.JWT_EXPIRES_SECONDS) : 24 * 60 * 60) * 1000
    };
    res.cookie(cookieName, appToken, cookieOptions);

    // Generate a CSRF double-submit token and set it as a non-HttpOnly cookie so the browser JS can read it
    try {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      const csrfCookieOptions: any = {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: cookieOptions.maxAge
      };
      res.cookie(CSRF_COOKIE_NAME, encodeURIComponent(csrfToken), csrfCookieOptions);
        // If we just created a new user via Google, set a short-lived non-HttpOnly cookie
        // so the frontend can reliably detect and route them into the role-selection flow.
        if (created) {
          try {
            res.cookie('ssb_new_user', '1', { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 1000 });
          } catch (e) {
            logger.warn('Failed to set ssb_new_user cookie', e);
          }
        }
    } catch (e) {
      logger.warn('Failed to set CSRF cookie', e);
    }

    // For web flow, redirect back to frontend. Cookie holds the app JWT; do not include tokens in query for security.
  const frontendRedirect = process.env.FRONTEND_URL || 'http://localhost:9000';
  // If this was a new user creation, include a created flag so frontend can route to role-selection/onboarding
  const createdFlag = created ? '?created=1' : '';
  return res.redirect(`${frontendRedirect}/auth/success${createdFlag}`);
  } catch (error) {
    logger.error('Google callback error', error);
    return res.status(500).json({ success: false, error: 'Google callback failed' });
  }
});

// (Moved choose-role endpoint to userRoutes.ts so it lives under /api/users/choose-role)

// POST /api/auth/refresh - exchange refresh_token for new access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ success: false, error: 'Missing refresh_token' });

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('client_id', process.env.GOOGLE_CLIENT_ID || '');
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '');
    params.append('refresh_token', refresh_token);
    params.append('grant_type', 'refresh_token');

    const tokenResp = await fetch(tokenUrl, { method: 'POST', body: params });
    const tokenJson = await tokenResp.json();
    const { access_token, id_token } = tokenJson;

    return res.json({ success: true, data: { access_token, id_token } });
  } catch (error) {
    logger.error('Refresh token error', error);
    return res.status(500).json({ success: false, error: 'Failed to refresh token' });
  }
});

// POST /api/auth/refresh-session - uses stored googleRefreshToken to refresh Google token and issue new app JWT
router.post('/refresh-session', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUser: any = (req as any).user;
    const userId = currentUser?._id ?? currentUser?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const user = await User.findById(userId).select('+googleRefreshToken');
    if (!user || !user.googleRefreshToken) return res.status(400).json({ success: false, error: 'No refresh token available' });

    let refreshTokenPlain: string;
    try {
      refreshTokenPlain = decryptText(user.googleRefreshToken);
    } catch (e) {
      logger.error('Failed to decrypt googleRefreshToken', e);
      return res.status(500).json({ success: false, error: 'Token decrypt failed' });
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('client_id', process.env.GOOGLE_CLIENT_ID || '');
    params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET || '');
    params.append('refresh_token', refreshTokenPlain);
    params.append('grant_type', 'refresh_token');

    const tokenResp = await fetch(tokenUrl, { method: 'POST', body: params });
    const tokenJson = await tokenResp.json();
    const { access_token, id_token, refresh_token: newRefreshToken } = tokenJson;

    // If Google returned a new refresh token, persist (encrypted)
    if (newRefreshToken) {
      try {
        const enc = encryptText(newRefreshToken);
        await User.findByIdAndUpdate(user._id, { $set: { googleRefreshToken: enc } });
      } catch (e) {
        logger.warn('Could not update googleRefreshToken', e);
      }
    }

    // issue a new app JWT
    const appToken = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    // set cookie
    const cookieName = process.env.SESSION_COOKIE_NAME || 'ssb_token';
    res.cookie(cookieName, appToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

    // rotate CSRF token as well
    try {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE_NAME, encodeURIComponent(csrfToken), { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: (process.env.JWT_EXPIRES_SECONDS ? parseInt(process.env.JWT_EXPIRES_SECONDS) : 24 * 60 * 60) * 1000 });
    } catch (e) {
      logger.warn('Failed to set CSRF cookie', e);
    }

    return res.json({ success: true, data: { access_token, id_token } });
  } catch (error) {
    logger.error('Refresh session failed', error);
    return res.status(500).json({ success: false, error: 'Failed to refresh session' });
  }
});

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

    // Also set session cookie + CSRF cookie for cookie-based auth
    try {
      const cookieName = process.env.SESSION_COOKIE_NAME || 'ssb_token';
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: (process.env.JWT_EXPIRES_SECONDS ? parseInt(process.env.JWT_EXPIRES_SECONDS) : 24 * 60 * 60) * 1000
      };
      res.cookie(cookieName, token, cookieOptions);
      // set CSRF cookie (non-HttpOnly) so client JS can read and send header
      try {
        const csrfToken = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, encodeURIComponent(csrfToken), { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: cookieOptions.maxAge });
      } catch (e) {
        logger.warn('Failed to set CSRF cookie on register', e);
      }
    } catch (e) {
      logger.warn('Failed to set session cookie on register', e);
    }

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

    // Also set session cookie + CSRF cookie for cookie-based auth
    try {
      const cookieName = process.env.SESSION_COOKIE_NAME || 'ssb_token';
      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: (process.env.JWT_EXPIRES_SECONDS ? parseInt(process.env.JWT_EXPIRES_SECONDS) : 24 * 60 * 60) * 1000
      };
      res.cookie(cookieName, token, cookieOptions);
      try {
        const csrfToken = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, encodeURIComponent(csrfToken), { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: cookieOptions.maxAge });
      } catch (e) {
        logger.warn('Failed to set CSRF cookie on login', e);
      }
    } catch (e) {
      logger.warn('Failed to set session cookie on login', e);
    }

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
