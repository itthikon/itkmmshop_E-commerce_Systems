# Security Implementation Guide

## Overview

This document describes the security measures implemented in the itkmmshop e-commerce backend system to protect against common vulnerabilities and attacks.

## Security Features

### 1. Authentication & Authorization

#### JWT-Based Authentication

- **Token Generation:** Secure JWT tokens with configurable expiration
- **Password Hashing:** bcrypt with salt rounds for password storage
- **Token Validation:** Middleware validates tokens on protected routes
- **Role-Based Access Control (RBAC):** Customer, Staff, and Admin roles

**Implementation:**
```javascript
// middleware/auth.js
- authenticate: Validates JWT token
- authorize: Checks user role permissions
```

#### Best Practices

- Never store passwords in plain text
- Use strong JWT secrets (minimum 32 characters)
- Set appropriate token expiration times
- Implement token refresh mechanism for production

### 2. Rate Limiting

#### Multiple Rate Limiters

**General API Rate Limiter:**
- 100 requests per 15 minutes per IP
- Applied to all `/api/*` routes
- Prevents API abuse and DoS attacks

**Authentication Rate Limiter:**
- 5 attempts per 15 minutes per IP
- Applied to login and registration
- Prevents brute force attacks
- Skips successful requests

**Payment Rate Limiter:**
- 10 attempts per hour per IP
- Applied to payment-related endpoints
- Prevents payment fraud attempts

**Configuration:**
```javascript
// middleware/security.js
- apiLimiter: General API protection
- authLimiter: Authentication protection
- paymentLimiter: Payment protection
```

### 3. Input Validation & Sanitization

#### Multiple Layers of Protection

**Express Validator:**
- Validates request parameters
- Sanitizes user input
- Prevents malformed data

**Mongo Sanitize:**
- Removes MongoDB operators from input
- Prevents NoSQL injection attacks

**XSS Clean:**
- Removes malicious scripts from input
- Prevents Cross-Site Scripting attacks

**Custom Sanitization:**
- Additional input cleaning
- Removes special characters
- Validates data types

**Implementation:**
```javascript
// server.js
app.use(mongoSanitize());
app.use(xss());
app.use(sanitizeInput);
```

### 4. HTTP Security Headers

#### Helmet.js Configuration

**Content Security Policy (CSP):**
- Restricts resource loading
- Prevents XSS attacks
- Configurable directives

**HTTP Strict Transport Security (HSTS):**
- Forces HTTPS connections
- 1 year max-age
- Includes subdomains
- Preload enabled

**Other Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

**Configuration:**
```javascript
app.use(helmet({
  contentSecurityPolicy: { /* CSP rules */ },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

### 5. HTTPS Enforcement

#### Production HTTPS

**Middleware:**
- Checks for HTTPS in production
- Rejects HTTP requests
- Supports reverse proxy detection

**Configuration:**
```javascript
// middleware/security.js
enforceHTTPS: Enforces HTTPS in production
```

**Deployment:**
- Use SSL/TLS certificates
- Configure reverse proxy (nginx, Apache)
- Enable HTTPS redirect

### 6. CORS Configuration

#### Cross-Origin Resource Sharing

**Settings:**
- Whitelist specific origins
- Allow credentials
- Restrict HTTP methods
- Control allowed headers

**Configuration:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 7. SQL Injection Prevention

#### Prepared Statements

**MySQL2 Parameterized Queries:**
- All queries use prepared statements
- Parameters are properly escaped
- Prevents SQL injection attacks

**Example:**
```javascript
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

**Best Practices:**
- Never concatenate user input into queries
- Always use parameterized queries
- Validate input before database operations

### 8. File Upload Security

#### Multer Configuration

**Restrictions:**
- File type validation
- File size limits (5MB)
- Secure filename generation
- Organized storage structure

**Implementation:**
```javascript
// middleware/upload.js
- File type whitelist
- Size limits
- Custom filename generation
- Directory organization
```

**Best Practices:**
- Validate file types on server
- Scan uploaded files for malware
- Store files outside web root
- Use CDN for production

### 9. Logging & Monitoring

#### Winston Logger

**Security Logging:**
- Failed authentication attempts
- Rate limit violations
- Suspicious activities
- Error tracking

**Log Files:**
- `logs/error.log` - Security incidents
- `logs/combined.log` - All activities

**Request Logging:**
- IP addresses
- User agents
- Request methods
- Response codes
- Request duration

**Configuration:**
```javascript
// config/logger.js
- Structured logging
- Log rotation
- Multiple transports
```

### 10. Error Handling

#### Secure Error Messages

**Production:**
- Generic error messages
- No stack traces
- No sensitive information

**Development:**
- Detailed error messages
- Stack traces for debugging
- Full error context

**Implementation:**
```javascript
app.use((err, req, res, next) => {
  logger.error('Error occurred', { error: err.message });
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

## Security Checklist

### Development

- [ ] Use environment variables for secrets
- [ ] Never commit `.env` files
- [ ] Use strong JWT secrets
- [ ] Implement input validation
- [ ] Use prepared statements
- [ ] Hash passwords with bcrypt
- [ ] Validate file uploads
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Enable CORS properly

### Production

- [ ] Enable HTTPS
- [ ] Use strong SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement backup strategy
- [ ] Use environment-specific configs
- [ ] Enable production logging
- [ ] Configure reverse proxy

### Database

- [ ] Use connection pooling
- [ ] Implement proper indexes
- [ ] Regular backups
- [ ] Restrict database access
- [ ] Use strong passwords
- [ ] Enable query logging
- [ ] Monitor slow queries
- [ ] Implement data encryption

## Common Vulnerabilities & Mitigations

### 1. SQL Injection

**Risk:** Attackers inject malicious SQL code
**Mitigation:** 
- Use parameterized queries
- Validate input
- Use ORM/query builder

### 2. Cross-Site Scripting (XSS)

**Risk:** Attackers inject malicious scripts
**Mitigation:**
- Input sanitization
- Output encoding
- Content Security Policy
- XSS-clean middleware

### 3. Cross-Site Request Forgery (CSRF)

**Risk:** Unauthorized actions on behalf of users
**Mitigation:**
- CSRF tokens
- SameSite cookies
- Verify origin headers

### 4. Brute Force Attacks

**Risk:** Attackers guess passwords
**Mitigation:**
- Rate limiting
- Account lockout
- Strong password policies
- Multi-factor authentication

### 5. Denial of Service (DoS)

**Risk:** System overwhelmed with requests
**Mitigation:**
- Rate limiting
- Request size limits
- Connection pooling
- Load balancing

### 6. Insecure Direct Object References

**Risk:** Unauthorized access to resources
**Mitigation:**
- Authorization checks
- Resource ownership validation
- Indirect references

### 7. Security Misconfiguration

**Risk:** Default or weak configurations
**Mitigation:**
- Remove default accounts
- Disable unnecessary features
- Keep software updated
- Regular security audits

### 8. Sensitive Data Exposure

**Risk:** Unauthorized access to sensitive data
**Mitigation:**
- Encrypt data at rest
- Use HTTPS
- Secure password storage
- Minimize data collection

## Environment Variables

Required security-related environment variables:

```bash
# JWT Configuration
JWT_SECRET=your_very_long_and_random_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d

# Node Environment
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
PAYMENT_RATE_LIMIT_MAX=10

# Logging
LOG_LEVEL=info
```

## Security Testing

### Manual Testing

1. **Authentication:**
   - Test with invalid credentials
   - Test with expired tokens
   - Test role-based access

2. **Rate Limiting:**
   - Exceed rate limits
   - Verify error responses
   - Test different endpoints

3. **Input Validation:**
   - Submit malformed data
   - Test SQL injection attempts
   - Test XSS payloads

4. **File Uploads:**
   - Upload invalid file types
   - Upload oversized files
   - Test malicious files

### Automated Testing

Consider implementing:
- OWASP ZAP scanning
- Dependency vulnerability scanning
- Penetration testing
- Security code reviews

## Incident Response

### Security Incident Procedure

1. **Detection:**
   - Monitor logs for suspicious activity
   - Set up alerts for security events
   - Regular security audits

2. **Response:**
   - Isolate affected systems
   - Investigate the incident
   - Document findings

3. **Recovery:**
   - Patch vulnerabilities
   - Restore from backups
   - Update security measures

4. **Post-Incident:**
   - Review incident response
   - Update security policies
   - Train team members

## Compliance

### Data Protection

- **GDPR Compliance:** If serving EU customers
- **PDPA Compliance:** Thai Personal Data Protection Act
- **PCI DSS:** If handling credit cards directly

### Best Practices

- Minimize data collection
- Implement data retention policies
- Provide data export/deletion
- Maintain audit logs
- Regular compliance reviews

## Resources

### Security Tools

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Node.js Security:** https://nodejs.org/en/docs/guides/security/
- **npm audit:** Built-in dependency scanner
- **Snyk:** Vulnerability scanning

### Regular Maintenance

- Update dependencies monthly
- Review security logs weekly
- Conduct security audits quarterly
- Update security policies annually

## Conclusion

Security is an ongoing process, not a one-time implementation. Regular monitoring, testing, and updates are essential to maintain a secure system. Always stay informed about new vulnerabilities and best practices in the Node.js and Express.js ecosystem.
