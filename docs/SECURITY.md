# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow responsible disclosure:

### How to Report

**DO**:
1. Email security@toolconnectcraft.dev (or create a private GitHub Security Advisory)
2. Provide detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Allow reasonable time for us to respond (48-72 hours)
4. Keep the vulnerability confidential until we've addressed it

**DO NOT**:
- Open a public GitHub issue for security vulnerabilities
- Share vulnerability details publicly before a fix is released
- Exploit the vulnerability beyond what's necessary to demonstrate it

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Development**: Varies by severity (critical: days, low: weeks)
- **Public Disclosure**: After fix is deployed and users have time to update

### Reward

While we don't currently have a formal bug bounty program, we:
- Acknowledge contributors in our security advisories
- Provide swag/credits for significant findings (when possible)
- Will consider bug bounty program in future versions

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

We recommend always using the latest version.

---

## Security Features

### Authentication & Authorization

**Supabase Auth**:
- Email/password authentication with verification
- Secure session management with JWT
- Automatic token refresh
- Password hashing (bcrypt)

**Row-Level Security (RLS)**:
- Database-level access control
- User can only access their own data
- Policies enforced at PostgreSQL level
- No data leakage between users

**Protected Routes**:
- Frontend route protection via `ProtectedRoute` component
- Server-side validation via RLS
- Session validation on every request

### OAuth 2.0 Security

**PKCE Flow**:
- Proof Key for Code Exchange prevents authorization code interception
- State parameter prevents CSRF attacks
- Code verifier hashed and stored securely
- Short-lived authorization codes

**Token Storage**:
- Access tokens stored in Vault (not client-side)
- Refresh tokens encrypted at rest
- Secret references used instead of actual tokens
- Token rotation on refresh

### Data Protection

**In Transit**:
- All API calls over HTTPS
- WebSocket connections over WSS
- TLS 1.2+ enforced

**At Rest**:
- PostgreSQL encryption at rest (Supabase managed)
- Secrets encrypted in Vault
- Password hashing with bcrypt (cost factor: 10)
- Sensitive fields not logged

**In Use**:
- Secrets never sent to client
- API keys masked in UI
- Tokens excluded from error messages

### Input Validation

**Frontend**:
- Zod schema validation
- React Hook Form validation
- Type checking with TypeScript

**Backend**:
- Database constraints (NOT NULL, CHECK, etc.)
- Foreign key integrity
- RLS policy validation
- SQL injection prevention (parameterized queries)

### Rate Limiting (Roadmap)

**Planned Features**:
- Per-user API rate limits
- Per-connector rate limits
- Token bucket algorithm
- Exponential backoff on failures
- DDoS protection at edge

### Audit Logging

**Action Logs**:
- All API interactions logged
- User ID, timestamp, and operation tracked
- Request/response payloads (sanitized)
- Latency metrics
- Success/failure status

**Immutable Logs**:
- Append-only table structure
- No deletion or modification of logs
- Retention policy (90 days default)

### Secret Management

**Current Implementation**:
- Secret references stored in database
- Actual secrets stored separately
- Secrets not exposed in API responses
- Environment variables for config

**Roadmap**:
- Supabase Vault integration
- Automatic secret rotation
- Secret versioning
- Audit trail for secret access

---

## Security Best Practices

### For Developers

**Code Security**:
- Never commit secrets to version control
- Use `.env` files for local development
- Validate all user inputs
- Use parameterized queries (Supabase handles this)
- Escape output to prevent XSS
- Keep dependencies updated

**Authentication**:
- Always check `auth.uid()` in RLS policies
- Use `ProtectedRoute` for sensitive pages
- Validate JWT on server side (Supabase does this)
- Never trust client-side authentication checks alone

**API Security**:
- Use HTTPS for all requests
- Implement CSRF protection
- Validate request origins
- Use secure headers (CSP, X-Frame-Options, etc.)

### For Users

**Account Security**:
- Use strong, unique passwords
- Enable two-factor authentication (when available)
- Don't share credentials
- Review connected services regularly
- Revoke unused connections

**OAuth Connections**:
- Only connect trusted services
- Review requested scopes before authorizing
- Revoke access when no longer needed
- Monitor action logs for suspicious activity

**Data Privacy**:
- Don't include sensitive data in tool inputs
- Understand what data services can access
- Export your data periodically
- Use security settings to control access

---

## Known Security Considerations

### Current Limitations

1. **No 2FA Yet**: Two-factor authentication not implemented (roadmap: v0.3)
2. **No Rate Limiting**: Basic rate limiting planned for v0.4
3. **Simulated Job Execution**: Not calling real APIs yet (v0.4)
4. **Limited Secrets Management**: Full Vault integration coming in v0.3

### Mitigations

- RLS policies prevent unauthorized access
- All authentication via Supabase (battle-tested)
- HTTPS enforced for all communications
- Regular security audits planned

---

## Security Checklist

### Development

- [ ] Review code for security issues before PR
- [ ] Never commit secrets or credentials
- [ ] Use TypeScript for type safety
- [ ] Validate all user inputs
- [ ] Test RLS policies thoroughly
- [ ] Update dependencies regularly
- [ ] Run security linters (ESLint security rules)

### Deployment

- [ ] Use strong passwords for all services
- [ ] Enable 2FA on all accounts (GitHub, Supabase, etc.)
- [ ] Rotate secrets regularly
- [ ] Monitor logs for suspicious activity
- [ ] Keep Supabase and dependencies updated
- [ ] Use HTTPS for custom domains
- [ ] Configure security headers

### Operations

- [ ] Regular security audits
- [ ] Penetration testing (when resources allow)
- [ ] Monitor vulnerability databases
- [ ] Respond to security advisories promptly
- [ ] Review access logs monthly
- [ ] Test incident response plan

---

## Incident Response

### Detection

- Monitor error rates
- Review audit logs
- User reports
- Security scanning tools

### Response Process

1. **Identify**: Confirm the incident is real
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove the threat
4. **Recover**: Restore services safely
5. **Learn**: Post-mortem and improvements

### Communication

- Notify affected users within 24 hours (if data breach)
- Provide clear timeline and actions taken
- Offer remediation steps for users
- Public disclosure after resolution

---

## Compliance

### Current Status

- **GDPR**: Partial compliance (data export planned)
- **SOC 2**: Not certified (roadmap: v1.0)
- **ISO 27001**: Not certified

### Privacy

- User data stored in EU or US (Supabase region)
- No third-party tracking (no Google Analytics)
- No data selling or sharing
- Minimal data collection

### Data Retention

- User accounts: Indefinite (until deletion)
- Action logs: 90 days
- Pipeline jobs: 30 days
- Pipeline events: 7 days

### Data Deletion

Users can:
- Delete their account (self-service)
- Disconnect services
- Request data export
- Request complete data deletion

---

## Security Updates

### Security Advisories

Published on:
- GitHub Security Advisories
- Project README
- Email notifications (for critical issues)

### Update Process

1. Security fix developed
2. Testing in staging environment
3. Deployment to production
4. User notification
5. Public advisory published

---

## Security Roadmap

### v0.3 (Q1 2025)
- [ ] Full OAuth PKCE implementation
- [ ] Supabase Vault integration
- [ ] CSRF protection
- [ ] Basic rate limiting

### v0.4 (Q1 2025)
- [ ] Advanced rate limiting
- [ ] Request signing
- [ ] Security headers (CSP, HSTS)
- [ ] Dependency scanning

### v0.6 (Q2 2025)
- [ ] Circuit breaker pattern
- [ ] Webhook verification
- [ ] Enhanced audit logging

### v1.0 (Q3 2025)
- [ ] SOC 2 Type I
- [ ] Penetration testing
- [ ] Security certifications
- [ ] Bug bounty program

### v1.3 (Q1 2026)
- [ ] SSO integration
- [ ] Advanced audit logging
- [ ] IP whitelisting
- [ ] Custom encryption keys

---

## Resources

### External References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

### Tools

- GitHub Security Scanning
- Dependabot for dependency updates
- ESLint security plugin
- npm audit

---

## Contact

- **Security Issues**: security@toolconnectcraft.dev
- **General Support**: support@toolconnectcraft.dev
- **GitHub**: https://github.com/Krosebrook/tool-connect-craft

---

**Last Updated**: December 29, 2024
