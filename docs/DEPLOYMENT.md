# Deployment Guide

Production deployment reference for Tool Connect Craft — covering environment configuration, secrets, Edge Function deployment, and operational checklists.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Environment Configuration](#environment-configuration)
- [Required Secrets](#required-secrets)
- [Edge Function Deployment](#edge-function-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Migrations](#database-migrations)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring & Observability](#monitoring--observability)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Lovable Cloud Edge   │────▶│  PostgreSQL DB  │
│  (Vite + TS)    │     │  Functions (Deno)     │     │  (11 tables)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
        │                        │
        │                        ├── execute-tool
        │                        ├── oauth-start / oauth-callback
        │                        ├── token-refresh
        │                        ├── health-check / send-health-alert
        │                        └── send-webhook / test-webhook / retry-webhook
        │
        └── Supabase JS Client (realtime subscriptions, direct queries)
```

**Hosting**: Lovable Cloud handles both frontend hosting and backend infrastructure. Edge Functions deploy automatically on code push.

---

## Environment Configuration

### Frontend Variables (`.env`)

These are auto-managed by Lovable Cloud. **Do not edit manually.**

| Variable | Description | Auto-configured |
|---|---|---|
| `VITE_SUPABASE_URL` | Backend API endpoint | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key for client-side auth | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier | ✅ |

### Runtime Validation

The `src/lib/config.ts` module validates all required variables at startup. In production, missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` throws a fatal error before the app renders.

```typescript
// Production guard in src/lib/config.ts
if (appConfig.isProduction) {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error('Critical configuration missing for production');
  }
}
```

---

## Required Secrets

Secrets are stored encrypted in the backend and available to Edge Functions via `Deno.env.get()`.

### Core Secrets (Auto-Provisioned)

| Secret | Used By | Description |
|---|---|---|
| `SUPABASE_URL` | All Edge Functions | Backend API endpoint |
| `SUPABASE_ANON_KEY` | All Edge Functions | Public key for client-scoped queries |
| `SUPABASE_SERVICE_ROLE_KEY` | All Edge Functions | Admin key — bypasses RLS |
| `SUPABASE_DB_URL` | Internal | Direct PostgreSQL connection string |
| `SUPABASE_PUBLISHABLE_KEY` | Internal | Alias for anon key |

### Application Secrets (User-Configured)

| Secret | Used By | Required | Description |
|---|---|---|---|
| `RESEND_API_KEY` | `send-health-alert` | Yes (for email alerts) | [Resend](https://resend.com) API key for transactional email |
| `LOVABLE_API_KEY` | AI features | Auto-provisioned | Lovable AI Gateway access |
| `TOKEN_ENCRYPTION_KEY` | `oauth-callback`, `token-refresh` | **Critical** | AES-GCM 256-bit key for OAuth token encryption |

### OAuth Provider Secrets (Per-Connector)

Each OAuth connector requires its own client credentials:

| Secret Pattern | Example | Description |
|---|---|---|
| `{PROVIDER}_CLIENT_ID` | `GITHUB_CLIENT_ID` | OAuth app client ID |
| `{PROVIDER}_CLIENT_SECRET` | `GITHUB_CLIENT_SECRET` | OAuth app client secret |

**Adding secrets:**

```bash
# Via Lovable Cloud UI: Settings → Secrets
# Or programmatically via the secrets management tools
```

### Security Requirements

| Secret | Minimum Requirements |
|---|---|
| `TOKEN_ENCRYPTION_KEY` | 32+ character random string. **No fallback in production.** |
| `{PROVIDER}_CLIENT_SECRET` | Obtained from provider's OAuth app settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Never expose client-side. Edge Functions only. |

---

## Edge Function Deployment

### Automatic Deployment

All 9 Edge Functions deploy automatically when code is pushed. No manual deployment steps required.

### Function Inventory

| Function | Path | JWT Required | Purpose |
|---|---|---|---|
| `execute-tool` | `supabase/functions/execute-tool/` | No (validated in code) | Tool execution with rate limiting |
| `oauth-start` | `supabase/functions/oauth-start/` | No | Initiate PKCE OAuth flow |
| `oauth-callback` | `supabase/functions/oauth-callback/` | No | Complete OAuth exchange, encrypt tokens |
| `token-refresh` | `supabase/functions/token-refresh/` | No | Refresh expired OAuth tokens |
| `health-check` | `supabase/functions/health-check/` | No | System health status |
| `send-health-alert` | `supabase/functions/send-health-alert/` | No | Email alerts via Resend |
| `send-webhook` | `supabase/functions/send-webhook/` | No | Deliver webhook payloads with HMAC signing |
| `test-webhook` | `supabase/functions/test-webhook/` | No | Send test payload to webhook endpoint |
| `retry-webhook` | `supabase/functions/retry-webhook/` | No | Retry failed deliveries with backoff |

### JWT Configuration

All functions use `verify_jwt = false` in `supabase/config.toml` and perform authentication in code:

```toml
[functions.execute-tool]
verify_jwt = false

[functions.health-check]
verify_jwt = false
# ... etc
```

### Calling Edge Functions

```bash
# Base URL pattern
https://{PROJECT_ID}.supabase.co/functions/v1/{function-name}

# Example: Health check
curl https://jlnrqriebkfuglwmbniw.supabase.co/functions/v1/health-check
```

---

## Frontend Deployment

### Build Process

```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Build for production
npm run build
# Output: dist/
```

### Build Configuration

`vite.config.ts` handles:
- Code splitting (React, Supabase in separate chunks)
- Asset hashing for cache busting
- Source map generation for error tracking

### SPA Routing

The app uses `react-router-dom` with client-side routing. All deployment targets must serve `index.html` for unmatched routes.

**10 Routes:**

| Route | Page | Auth Required |
|---|---|---|
| `/` | Landing Page | No |
| `/connectors` | Connector Catalog | No |
| `/connectors/:slug` | Connector Detail | No |
| `/connections` | User Connections | No* |
| `/dashboard` | Dashboard | No* |
| `/webhooks` | Webhook Management | No* |
| `/scheduler` | Job Scheduler | No* |
| `/notifications` | Notification Preferences | No* |
| `/settings/security` | Security Settings | No* |
| `*` | 404 Not Found | No |

*\*Uses hardcoded internal user ID — see [auth configuration memory](#).*

---

## Database Migrations

### 11 Tables

| Table | RLS | Purpose |
|---|---|---|
| `connectors` | ✅ | Connector catalog (read-all) |
| `connector_tools` | ✅ | Tool definitions per connector |
| `user_connections` | ✅ | OAuth connections per user |
| `oauth_transactions` | ✅ | PKCE flow state tracking |
| `pipeline_jobs` | ✅ | Async job execution records |
| `pipeline_events` | ✅ | Job event log entries |
| `action_logs` | ✅ | Tool execution audit trail |
| `webhooks` | ✅ | Webhook endpoint configurations |
| `webhook_deliveries` | ✅ | Delivery attempts and responses |
| `scheduler_jobs` | ✅ | Scheduled job definitions |
| `notification_preferences` | ✅ | Per-user notification settings |

### Applying Migrations

Migrations in `supabase/migrations/` are applied automatically by Lovable Cloud. For manual application:

```bash
# Via Lovable Cloud UI: open backend → Run SQL
# Paste migration contents and execute
```

### Enums

```sql
-- 6 custom enums
auth_type:                 'oauth' | 'api_key' | 'none'
connection_status:         'pending' | 'active' | 'expired' | 'revoked' | 'error'
event_level:               'info' | 'warn' | 'error'
job_status:                'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
oauth_transaction_status:  'started' | 'completed' | 'failed'
tool_source:               'mcp' | 'rest'
```

---

## Pre-Deployment Checklist

### Critical (Must Pass)

- [ ] `npm run build` succeeds with zero errors
- [ ] `npx tsc --noEmit` passes type checking
- [ ] `npx eslint .` passes with no errors
- [ ] All tests pass: `npx vitest run`
- [ ] `TOKEN_ENCRYPTION_KEY` is set (not using fallback default)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is configured
- [ ] All OAuth provider secrets are set for enabled connectors
- [ ] RLS is enabled on all 11 tables
- [ ] No `VITE_` variables contain sensitive data

### Recommended

- [ ] `RESEND_API_KEY` configured for health alert emails
- [ ] Lighthouse score > 90 for performance
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] Webhook secrets are set for HMAC signature verification
- [ ] Review `action_logs` retention policy
- [ ] Service worker (`public/sw.js`) cache strategy reviewed
- [ ] `public/robots.txt` configured for production

### Security Audit

- [ ] No secrets in source code or `.env.example`
- [ ] Edge Functions validate auth headers before data access
- [ ] Rate limiting active on `execute-tool` (30 req/min/user, 100 req/min/connector)
- [ ] OAuth state parameters use cryptographic randomness (64 hex chars)
- [ ] PKCE code verifiers use SHA-256 challenge method
- [ ] Token encryption uses AES-GCM with random IV per operation

---

## Post-Deployment Verification

### Smoke Tests

```bash
PROJECT_URL="https://jlnrqriebkfuglwmbniw.supabase.co"

# 1. Health check
curl -s "$PROJECT_URL/functions/v1/health-check" | jq .

# 2. Frontend loads
curl -s -o /dev/null -w "%{http_code}" https://tool-connect-craft.lovable.app

# 3. Connectors API (via Supabase client)
curl -s "$PROJECT_URL/rest/v1/connectors?select=name,slug&limit=5" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq .

# 4. Test webhook delivery
curl -X POST "$PROJECT_URL/functions/v1/test-webhook" \
  -H "Content-Type: application/json" \
  -d '{"webhookId": "<webhook-id>"}'
```

### Verify Key Flows

1. **Landing page** → `/` renders without console errors
2. **Connector browsing** → `/connectors` lists available connectors
3. **Dashboard** → `/dashboard` shows connection stats and recent activity
4. **Webhook management** → `/webhooks` displays delivery history charts
5. **Health check** → Edge Function returns `{ status: "ok" }`

---

## Monitoring & Observability

### Built-In Monitoring

| Component | Method | Location |
|---|---|---|
| Edge Function logs | Lovable Cloud logs viewer | Backend → Logs |
| Database queries | `action_logs` table | Queryable via SQL |
| Webhook deliveries | `webhook_deliveries` table | Includes response codes and bodies |
| Job execution | `pipeline_events` table | Event-level granularity |
| Health status | `health-check` function | Polled by scheduler |

### Key Metrics to Monitor

| Metric | Source | Alert Threshold |
|---|---|---|
| Tool execution errors | `action_logs.status = 'error'` | > 5% error rate |
| Webhook delivery failures | `webhook_deliveries.status = 'failed'` | > 3 consecutive failures |
| Token refresh failures | `user_connections.status = 'error'` | Any occurrence |
| Rate limit hits | `execute-tool` response headers | Sustained 429 responses |
| Job queue depth | `pipeline_jobs.status = 'queued'` | > 50 queued jobs |

### Health Alert Configuration

The `send-health-alert` function sends email notifications via Resend when health checks detect issues. Requires `RESEND_API_KEY` secret.

---

## Rollback Procedures

### Frontend Rollback

Lovable Cloud maintains deployment history. To rollback:

1. Navigate to project settings in Lovable
2. Restore to a previous version
3. Verify the restored version loads correctly

### Database Rollback

**⚠️ Destructive schema changes require manual data migration.**

Before publishing schema changes that drop columns or tables:

1. Check Live environment for existing data
2. Export affected data if preservation is needed
3. Run migration queries in Cloud View → Run SQL (with Live selected)
4. Then publish the schema changes

### Edge Function Rollback

Edge Functions deploy with the frontend. Rolling back the frontend also rolls back function code. If only function logic needs reverting:

1. Revert the specific function file in source control
2. Push the change — auto-deploys the previous version

---

## Troubleshooting

### Common Issues

#### Build Fails with Type Errors

```bash
# Check for type issues
npx tsc --noEmit

# Common fix: regenerate Supabase types after schema changes
# Types in src/integrations/supabase/types.ts update automatically
```

#### Edge Function Returns 500

1. Check function logs in Lovable Cloud backend
2. Verify all required secrets are set
3. Test locally with curl — check response body for error details
4. Common cause: missing `TOKEN_ENCRYPTION_KEY` or `RESEND_API_KEY`

#### CORS Errors in Browser

All Edge Functions include CORS headers. If errors persist:
- Verify the function handles `OPTIONS` preflight requests
- Check that `Access-Control-Allow-Headers` includes all custom headers
- Standard headers allowed: `authorization, x-client-info, apikey, content-type`

#### OAuth Flow Fails

1. Verify provider client ID and secret are set as secrets
2. Check `oauth_transactions` table for failed transactions
3. Ensure redirect URI matches the registered OAuth app callback
4. PKCE: verify code challenge method is `S256`

#### Webhook Deliveries Failing

1. Check `webhook_deliveries` for `response_code` and `response_body`
2. Verify target URL is reachable from the backend
3. Check HMAC signature verification on the consumer side
4. Review retry backoff: attempts at 1s, 2s, 4s intervals

#### Rate Limiting Triggered

The `execute-tool` function enforces:
- **30 requests per 60 seconds** per user
- **100 requests per 60 seconds** per connector

Response includes `X-RateLimit-Remaining` and `Retry-After` headers. The in-memory rate limiter resets on cold start.

---

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push:

| Step | Command | Purpose |
|---|---|---|
| Lint | `npx eslint .` | Code quality |
| Type Check | `npx tsc --noEmit` | Type safety |
| Security | `npm audit` | Dependency vulnerabilities |
| Test | `npx vitest run` | Unit and integration tests |
| Lighthouse | Lighthouse CI | Performance auditing |

Production deployments are triggered automatically by Lovable Cloud on code push to the main branch.

---

## Support

- [Project Documentation](../README.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Edge Functions Reference](./EDGE_FUNCTIONS.md)
- [Security Policy](./SECURITY.md)
- [API Reference](./API.md)
