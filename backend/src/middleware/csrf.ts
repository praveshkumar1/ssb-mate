import { Request, Response, NextFunction } from 'express';

// Export names so other modules can reuse the same env-driven values
export const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'ssb_csrf';
export const CSRF_HEADER_NAME = process.env.CSRF_HEADER_NAME || 'x-csrf-token';

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  // Allow unauthenticated auth endpoints (login/register/callback) to bypass CSRF checks
  // since they are used to obtain a session in the first place. Protect other auth endpoints.
  if (req.path.startsWith('/api/auth')) {
    const allowList = ['/api/auth/refresh-session'];
    if (!allowList.includes(req.path)) return next();
  }

  const cookieName = CSRF_COOKIE_NAME;
  const headerName = CSRF_HEADER_NAME;
  const cookie = req.headers.cookie?.split(';').map(s => s.trim()).find(c => c.startsWith(`${cookieName}=`));
  const cookieVal = cookie ? cookie.split('=')[1] : null;
  const headerVal = (req.headers[headerName] as string) || '';
  if (!cookieVal || !headerVal || cookieVal !== headerVal) {
    return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
  }
  return next();
};
