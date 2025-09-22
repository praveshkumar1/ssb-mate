# Security Guidelines for SSB-Mate

## Overview
This document outlines the security measures and best practices implemented in the SSB-Mate application.

## Security Measures Implemented

### Authentication & Authorization
- **JWT Secret Validation**: No hardcoded fallback secrets - application fails safely if JWT_SECRET is not configured
- **Token Validation**: Comprehensive JWT token validation with user existence and data consistency checks
- **Rate Limiting**: Strict rate limiting on authentication endpoints:
  - Registration: 5 attempts per IP per 15 minutes
  - Login: 3 attempts per IP per 15 minutes
- **Password Requirements**: Strong password policy requiring 8+ characters with uppercase, lowercase, numbers, and special characters
- **Role-based Access Control**: Proper authorization middleware for different user roles

### Input Validation & Sanitization
- **Comprehensive Validation**: All user inputs are validated and sanitized using express-validator
- **XSS Prevention**: Input escaping and sanitization to prevent cross-site scripting
- **SQL Injection Prevention**: Using parameterized queries and ORM (Mongoose)

### File Upload Security
- **File Type Validation**: Strict MIME type and extension validation for image uploads
- **File Size Limits**: 2MB maximum file size for uploads
- **Path Traversal Prevention**: Filename validation to prevent directory traversal attacks
- **Secure Filename Generation**: Cryptographically secure random filename generation
- **Upload Limits**: Maximum 1 file per upload request

### Security Headers
- **Helmet.js Integration**: Comprehensive security headers including:
  - Content Security Policy (CSP)
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
- **CORS Configuration**: Strict CORS policy with origin validation
- **Production CORS**: More restrictive CORS in production environment

### Dependency Security
- **Updated Dependencies**: All packages updated to latest secure versions
- **Multer Security**: Upgraded from vulnerable 1.x to secure 2.x version
- **Regular Audits**: Zero high/critical vulnerabilities in production dependencies

### Logging & Monitoring
- **Security Logging**: Comprehensive logging of security events including:
  - Failed authentication attempts
  - Suspicious activities
  - CORS violations
  - Rate limit violations
- **User Activity Tracking**: IP address and user agent logging for security events

## Environment Configuration

### Required Environment Variables
```env
# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=24h

# CORS Configuration (REQUIRED for production)
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Best Practices for Deployment

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, randomly generated JWT secrets (32+ characters)
   - Set appropriate CORS origins for production

2. **HTTPS**
   - Always use HTTPS in production
   - Implement HSTS headers
   - Use secure cookies

3. **Database Security**
   - Use connection encryption
   - Implement proper database access controls
   - Regular security updates

4. **Monitoring**
   - Monitor security logs regularly
   - Set up alerts for suspicious activities
   - Regular security audits

## Vulnerability Reporting

If you discover a security vulnerability, please report it privately to the development team rather than opening a public issue.

## Regular Security Maintenance

1. **Dependency Updates**: Run `npm audit` regularly and update dependencies
2. **Security Reviews**: Regular code reviews focusing on security
3. **Penetration Testing**: Periodic security testing of the application
4. **Log Analysis**: Regular review of security logs for anomalies

## Known Limitations

1. The current esbuild vulnerability in frontend dev dependencies is development-only and doesn't affect production builds
2. File upload validation relies on MIME type which can be spoofed - consider additional validation if needed
3. Rate limiting is IP-based - consider user-based limiting for authenticated endpoints

## Security Checklist for Developers

- [ ] Validate all user inputs
- [ ] Use parameterized queries
- [ ] Implement proper error handling without exposing sensitive information
- [ ] Use HTTPS for all communications
- [ ] Implement proper session management
- [ ] Regular dependency updates and security audits
- [ ] Follow principle of least privilege
- [ ] Implement comprehensive logging
- [ ] Regular security testing