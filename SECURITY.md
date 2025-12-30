# Security Policy

## Reporting a Vulnerability

The Tool Connect Craft team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities through one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Navigate to the [Security tab](https://github.com/Krosebrook/tool-connect-craft/security)
   - Click "Report a vulnerability"
   - Fill out the advisory form

2. **Email**
   - Send to: security@toolconnectcraft.dev
   - Use subject line: `[SECURITY] Brief description`
   - Include details as specified below

### What to Include

Please provide:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Affected versions** (if known)
5. **Suggested fix** (if you have one)
6. **Your contact information** for follow-up

### Example Report

```
Subject: [SECURITY] SQL Injection in connector tool execution

Description:
SQL injection vulnerability in the connector tool execution endpoint
allows authenticated users to execute arbitrary SQL commands.

Steps to Reproduce:
1. Authenticate as a normal user
2. Navigate to /connectors/github
3. Execute tool with payload: {"args": "'; DROP TABLE users; --"}
4. Database command executed

Impact:
- Data breach potential
- Database manipulation
- Privilege escalation

Affected Versions:
v0.1.0 and earlier

Suggested Fix:
Use parameterized queries instead of string concatenation

Contact:
researcher@example.com
```

---

## Response Timeline

We aim to respond to security reports within:

- **48 hours** - Initial response acknowledging receipt
- **7 days** - Assessment of severity and impact
- **30 days** - Fix development and testing
- **60 days** - Public disclosure (coordinated with reporter)

### Severity Levels

We classify vulnerabilities using CVSS (Common Vulnerability Scoring System):

| Severity | CVSS Score | Response Time |
|----------|------------|---------------|
| Critical | 9.0 - 10.0 | 24-48 hours |
| High | 7.0 - 8.9 | 7 days |
| Medium | 4.0 - 6.9 | 30 days |
| Low | 0.1 - 3.9 | 90 days |

---

## Security Measures

### Current Security Features

#### 1. Authentication & Authorization

**Supabase Auth**
- Email/password authentication
- JWT-based sessions
- Automatic token refresh
- Session expiration

**Row Level Security (RLS)**
```sql
-- Example: Users can only access their own data
CREATE POLICY "Users can view own connections"
  ON user_connections FOR SELECT
  USING (auth.uid() = user_id);
```

#### 2. OAuth Security

**PKCE (Proof Key for Code Exchange)**
- Code verifier generation
- SHA-256 code challenge
- State parameter for CSRF protection
- Short-lived authorization codes

**Flow Protection**
- Transaction tracking
- Replay attack prevention
- Callback validation

#### 3. Secret Management

**Current Implementation**
- Secrets stored as references, not plaintext
- Database-level encryption (Supabase)
- User-scoped access only

**Future Enhancement**
- HashiCorp Vault integration
- Automatic secret rotation
- Secret versioning

#### 4. Data Protection

**At Rest**
- Database encryption (Supabase managed)
- Encrypted backup storage

**In Transit**
- HTTPS only (TLS 1.3)
- Secure WebSocket (WSS)
- Certificate pinning (planned)

#### 5. Frontend Security

**XSS Prevention**
- React automatic escaping
- Content Security Policy (CSP) headers
- Input sanitization

**CSRF Protection**
- SameSite cookies
- State parameter in OAuth
- Origin validation

#### 6. Audit Logging

All actions are logged:
- User authentication events
- Connection changes
- Tool executions
- Error occurrences

---

## Known Security Considerations

### Current Limitations (MVP)

1. **Simulated OAuth Flow**
   - Current implementation doesn't actually perform OAuth
   - Real OAuth implementation in progress
   - Impact: Demo only, not production-ready

2. **No Rate Limiting**
   - Users can make unlimited requests
   - Potential for abuse
   - Mitigation: Planned for v0.2.0

3. **Client-Side Secrets**
   - Environment variables prefixed with `VITE_` are exposed
   - Only public keys should use this prefix
   - Warning in `.env.example`

4. **No Email Verification Enforcement**
   - Users can sign up without verifying email
   - Configuration option in Supabase
   - Recommendation: Enable in production

5. **Limited Input Validation**
   - Basic validation on frontend
   - Server-side validation needs enhancement
   - Planned for v0.2.0

### Recommended Security Hardening

Before production deployment:

1. **Enable Email Verification**
   ```bash
   # In Supabase Dashboard > Authentication > Settings
   Enable "Confirm email" requirement
   ```

2. **Configure CORS**
   ```bash
   # In Supabase Dashboard > API > CORS
   Restrict to your domain only
   ```

3. **Set Strong Password Requirements**
   ```bash
   # In Supabase Dashboard > Authentication > Policies
   Minimum length: 12 characters
   Require: uppercase, lowercase, numbers, symbols
   ```

4. **Enable 2FA** (when available)
   - Supabase 2FA support
   - Application-level 2FA planned

5. **Configure Rate Limiting**
   ```typescript
   // Planned implementation
   const rateLimitConfig = {
     maxRequests: 100,
     windowMs: 60000,  // 1 minute
   };
   ```

6. **Set Up Monitoring**
   - Error tracking (Sentry, etc.)
   - Performance monitoring
   - Security scanning
   - Log aggregation

---

## Vulnerability Disclosure Policy

### Our Commitment

- We will respond to reports promptly
- We will work with reporters to understand and fix issues
- We will credit reporters (unless they prefer anonymity)
- We will not pursue legal action against security researchers

### Reporter Recognition

We recognize security researchers who:
- Follow responsible disclosure guidelines
- Provide detailed, actionable reports
- Give us time to fix issues before disclosure

Recognition includes:
- Public acknowledgment (with permission)
- Hall of Fame listing
- Swag (for significant findings)

### Coordinated Disclosure

We prefer coordinated disclosure:

1. **Report** vulnerability privately
2. **Assess** and acknowledge (48 hours)
3. **Fix** and test (30-60 days)
4. **Disclose** publicly with credit to reporter
5. **Update** all users

---

## Security Best Practices for Users

### For Application Users

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of character types
   - Unique per service

2. **Enable 2FA** (when available)
   - Use authenticator apps
   - Store backup codes securely

3. **Monitor Activity**
   - Check action logs regularly
   - Report suspicious activity
   - Revoke unused connections

4. **Keep Connections Updated**
   - Review connected services
   - Disconnect unused services
   - Rotate API keys periodically

### For Developers

1. **Never Commit Secrets**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   *.key
   *.pem
   ```

2. **Use Environment Variables**
   ```typescript
   // ✅ Good
   const apiKey = import.meta.env.VITE_API_KEY;
   
   // ❌ Bad
   const apiKey = "sk_live_abc123";
   ```

3. **Validate All Input**
   ```typescript
   // ✅ Good
   const schema = z.object({
     email: z.string().email(),
     age: z.number().min(0).max(120),
   });
   const validated = schema.parse(input);
   
   // ❌ Bad
   const email = input.email;  // No validation
   ```

4. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

5. **Review Permissions**
   - Request minimum necessary scopes
   - Explain why permissions are needed
   - Allow users to audit permissions

---

## Security Checklist for Deployment

Before deploying to production:

- [ ] Enable email verification
- [ ] Configure CORS properly
- [ ] Set strong password requirements
- [ ] Enable HTTPS only
- [ ] Configure CSP headers
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Review RLS policies
- [ ] Test OAuth flows
- [ ] Verify secret management
- [ ] Review API permissions
- [ ] Test error handling
- [ ] Perform security scan
- [ ] Review access controls
- [ ] Document security procedures
- [ ] Train team on security practices

---

## Security Updates

### Staying Informed

- Watch the repository for security advisories
- Subscribe to security announcements (coming soon)
- Review CHANGELOG.md for security fixes

### Update Process

When a security update is released:

1. **Read the advisory** carefully
2. **Assess impact** on your deployment
3. **Update immediately** if affected
4. **Test** the update in staging
5. **Deploy** to production
6. **Verify** the fix

```bash
# Update to latest version
npm update tool-connect-craft
npm run build
npm run preview  # Test locally
# Then deploy to production
```

---

## Compliance

### Current Status

This is an MVP application. For production use, additional compliance measures may be required:

- **GDPR** - EU data protection (partially compliant)
- **CCPA** - California privacy (partially compliant)
- **SOC 2** - Security controls (not certified)
- **HIPAA** - Healthcare data (not compliant)
- **PCI DSS** - Payment data (not applicable)

### Future Compliance Goals

- GDPR full compliance
- SOC 2 Type II certification
- ISO 27001 certification
- Regular penetration testing
- Third-party security audits

---

## Contact

### Security Team

- **Email**: security@toolconnectcraft.dev
- **PGP Key**: [Coming soon]
- **GitHub**: [@Krosebrook](https://github.com/Krosebrook)

### General Security Questions

For non-vulnerability security questions:
- Open a GitHub Discussion
- Tag with "security" label
- We'll respond publicly

---

## Acknowledgments

We would like to thank the following security researchers for their contributions:

*No reports received yet*

---

## Version History

- **v1.0** (2024-12-30) - Initial security policy
- Future updates will be tracked here

---

Thank you for helping keep Tool Connect Craft and its users safe!
