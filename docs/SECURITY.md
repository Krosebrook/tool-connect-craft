# Security Policy

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

Report via [GitHub's private vulnerability reporting](https://github.com/Krosebrook/tool-connect-craft/security/advisories/new).

Include:
- Type of vulnerability and affected source files
- Steps to reproduce
- Proof-of-concept (if possible)
- Impact assessment

**Response time:** 48 hours. **Critical issues:** 24 hours.

---

## Implemented Security Features

### ✅ Row-Level Security (RLS)

All 11 database tables have RLS policies enforced at the PostgreSQL level. Users can only access rows where `auth.uid() = user_id`. Connector and tool catalogs are readable by all authenticated users.

### ✅ OAuth 2.0 + PKCE

Full Proof Key for Code Exchange implementation:
- `crypto.getRandomValues()` for code verifier generation
- SHA-256 code challenge (`S256` method)
- Cryptographically random state parameter (64 hex chars)
- State + code verifier hash verified server-side before token exchange
- Transaction records expire and are marked `failed` on mismatch

### ✅ Token Encryption

OAuth access and refresh tokens are encrypted at the application layer using AES-GCM before storage:
- 256-bit key derived from `TOKEN_ENCRYPTION_KEY` env var via SHA-256
- 96-bit random IV per encryption operation
- IV prepended to ciphertext, Base64-encoded for storage
- Decryption happens only in Edge Functions (server-side)

### ✅ HMAC Webhook Signatures

Webhook payloads are signed with HMAC-SHA256 using the user's webhook secret:
- Signature sent as `X-Webhook-Signature: sha256=<hex>`
- Signature computed over the JSON-stringified payload body
- Consumers can verify authenticity by recomputing the HMAC

### ✅ Rate Limiting

The `execute-tool` Edge Function enforces:
- **Per-user:** 30 requests per 60-second sliding window
- **Per-connector:** 100 requests per 60-second sliding window
- Response includes `X-RateLimit-*` headers and `429` status with `Retry-After`

### ✅ Audit Logging

Every tool execution is recorded in `action_logs` with:
- User ID, connector ID, tool name
- Full request payload and response
- Success/error status with error messages
- Latency in milliseconds
- Timestamp

### ✅ Input Validation

- **Frontend:** Zod schemas for form validation
- **Edge Functions:** JSON Schema validation against tool definitions
- **Database:** PostgreSQL enums enforce valid status values

### ✅ Secret Management

- Environment variables for all sensitive configuration
- Only `VITE_`-prefixed vars exposed to browser
- OAuth client secrets stored as env vars, never in database
- Encrypted token references in database, not plaintext tokens

---

## Security Best Practices

### For Users

1. Use strong, unique passwords (12+ characters)
2. Rotate API keys regularly
3. Use minimal OAuth scopes when connecting services
4. Review and revoke unused connections
5. Monitor action logs for suspicious activity
6. Set webhook secrets for HMAC verification

### For Developers

1. Never commit `.env` files — use `.env.example` as template
2. Run `npm audit` regularly
3. Keep dependencies updated
4. All PRs require review with security checklist
5. Use `unknown` over `any` in TypeScript
6. Validate all user inputs server-side

---

## Security Headers (Recommended for Production)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

---

## Incident Response

1. **Contain** — Isolate affected systems, revoke compromised credentials
2. **Assess** — Determine scope via audit logs and database inspection
3. **Notify** — Affected users within 24 hours; authorities if required
4. **Remediate** — Patch vulnerability, force credential rotation
5. **Review** — Post-mortem document, update security measures

---

## Known Limitations

| Item | Severity | Mitigation |
|---|---|---|
| In-memory rate limiter resets on cold start | Low | Acceptable for current scale |
| No account lockout after failed login attempts | Medium | Planned for future release |
| No 2FA/MFA | Medium | Planned |
| No CSRF token (stateless JWT) | Low | PKCE + state param for OAuth flows |
| `TOKEN_ENCRYPTION_KEY` has fallback default | High | Must be set in production |
