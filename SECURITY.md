# AQW Skins - Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

### How to Report

1. **Email**: Send details to `security@aqw-skins.com`
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Response Time**: We will respond within 48 hours
4. **Disclosure**: We follow responsible disclosure practices

### What to Expect

1. **Acknowledgment**: Within 48 hours
2. **Initial Assessment**: Within 7 days
3. **Fix Development**: Depends on severity
4. **Patch Release**: As soon as safely possible
5. **Public Disclosure**: After patch is deployed

## Security Measures

### Authentication & Authorization
- ✅ JWT with short expiration (15 minutes)
- ✅ Refresh tokens with 7-day expiration
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Account lockout after failed login attempts

### Data Protection
- ✅ HTTPS/TLS 1.3 required in production
- ✅ Encrypted sensitive data at rest
- ✅ Secure cookies (HttpOnly, Secure, SameSite)
- ✅ Environment variables for secrets
- ✅ No credentials in version control

### Input Validation
- ✅ Server-side validation for all inputs
- ✅ Parameterized SQL queries (no string concatenation)
- ✅ Input sanitization to prevent XSS
- ✅ CSRF tokens on all state-changing operations
- ✅ File upload restrictions

### Rate Limiting
- ✅ Global rate limit: 100 req/15min per IP
- ✅ Auth endpoints: 5 attempts/15min
- ✅ Loot box opening: 30/min per user
- ✅ Withdrawals: 10/hour per user
- ✅ API endpoints: Custom limits per route

### Monitoring & Logging
- ✅ All authentication attempts logged
- ✅ Admin actions in audit log
- ✅ Failed requests monitored
- ✅ Error tracking with Sentry
- ✅ Suspicious activity alerts

### Database Security
- ✅ Connection string in environment variables
- ✅ SSL/TLS for database connections
- ✅ Least privilege database user
- ✅ Regular backups (daily + PITR)
- ✅ Foreign key constraints enforced

### API Security
- ✅ CORS whitelist for allowed origins
- ✅ Helmet.js security headers
- ✅ Request size limits
- ✅ JSON schema validation
- ✅ API versioning

### Fairness & Anti-Cheat
- ✅ Cryptographically secure random number generation
- ✅ HMAC-based result verification
- ✅ Immutable loot box opening logs
- ✅ Anomaly detection for unusual patterns
- ✅ Weekly seed rotation

### Anti-Abuse
- ✅ Browser fingerprinting for coupon usage
- ✅ IP-based abuse detection
- ✅ Duplicate account detection
- ✅ Automated ban system for violations
- ✅ Manual review queue for suspicious activity

## Security Checklist for Deployment

Before deploying to production:

- [ ] All environment variables set correctly
- [ ] HTTPS certificate valid and auto-renewing
- [ ] Database backups configured and tested
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS configured with production domains
- [ ] Monitoring and alerting active
- [ ] Secrets rotated from defaults
- [ ] Admin accounts have strong passwords
- [ ] 2FA enabled for admin accounts (if available)
- [ ] Security headers verified (via securityheaders.com)
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] SQL injection testing completed
- [ ] XSS testing completed
- [ ] CSRF protection verified
- [ ] File upload restrictions tested

## Known Security Considerations

### Planned Improvements
- [ ] Implement 2FA for all users
- [ ] Add hardware security key support
- [ ] Implement IP geolocation anomaly detection
- [ ] Add machine learning fraud detection
- [ ] Implement content security policy (CSP)
- [ ] Add subresource integrity (SRI) for CDN assets
- [ ] Implement security.txt file

### Third-Party Dependencies
We regularly update dependencies to patch vulnerabilities:
```bash
npm audit
npm audit fix
```

## Compliance

### Data Privacy
- GDPR compliant (user data rights)
- CCPA compliant (California residents)
- User data deletion on request
- Privacy policy published

### Payment Security
- PCI DSS Level 1 compliant via Stripe/PayPal
- No credit card data stored on our servers
- Tokenization for all payment information

## Contact

For security concerns:
- **Email**: security@aqw-skins.com
- **PGP Key**: [Link to public key]

For general inquiries:
- **Email**: support@aqw-skins.com

---

**Last Updated**: 2025-11-30  
**Version**: 1.0.0
