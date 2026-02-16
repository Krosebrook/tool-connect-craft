# Edge Functions Reference

Complete per-function documentation for all MCP Connector Hub backend functions. Each section includes purpose, environment variables, request/response schemas, error codes, and ready-to-use `curl` examples.

> **Base URL:** `https://<project-ref>.supabase.co/functions/v1`
>
> **Common Headers:** All functions accept `OPTIONS` for CORS preflight. All JSON responses include `Content-Type: application/json`.

---

## Table of Contents

1. [execute-tool](#1-execute-tool)
2. [oauth-start](#2-oauth-start)
3. [oauth-callback](#3-oauth-callback)
4. [token-refresh](#4-token-refresh)
5. [health-check](#5-health-check)
6. [send-health-alert](#6-send-health-alert)
7. [send-webhook](#7-send-webhook)
8. [test-webhook](#8-test-webhook)
9. [retry-webhook](#9-retry-webhook)

---

## 1. execute-tool

Validates arguments against a tool's JSON Schema, dispatches execution to an MCP server (JSON-RPC 2.0) or REST adapter, manages job lifecycle, streams pipeline events, and records audit logs.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key for database operations |

### Rate Limits

| Scope | Limit | Window |
|---|---|---|
| Per user | 30 requests | 1 minute |
| Per connector | 100 requests | 1 minute |

Rate limit state is held in-memory and resets on function cold start.

### Request

**Method:** `POST`

```json
{
  "jobId": "uuid",
  "connectorId": "uuid",
  "toolName": "send_email",
  "args": { "to": "user@example.com", "subject": "Hello" },
  "userId": "uuid"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `jobId` | uuid | ✅ | Pre-created `pipeline_jobs` row ID |
| `connectorId` | uuid | ✅ | Target connector |
| `toolName` | string | ✅ | Tool name from `connector_tools` |
| `args` | object | ✅ | Arguments validated against tool's JSON Schema |
| `userId` | uuid | ✅ | Calling user |

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, result: {...}, latencyMs: 1234 }` | Tool executed successfully |
| `400` | `{ success: false, error: "...", validationErrors: [...] }` | Missing fields or schema validation failure |
| `404` | `{ success: false, error: "Connector not found" }` | Invalid `connectorId` or `toolName` |
| `429` | `{ success: false, error: "...", retryAfter: "..." }` | Rate limit exceeded |
| `500` | `{ success: false, error: "...", latencyMs: 1234 }` | MCP/REST execution failure |

### Rate Limit Response Headers

```
X-RateLimit-Limit-User: 30
X-RateLimit-Remaining-User: 28
X-RateLimit-Reset-User: 1708123456
X-RateLimit-Limit-Connector: 100
X-RateLimit-Remaining-Connector: 97
X-RateLimit-Reset-Connector: 1708123456
Retry-After: 1708123456          # Only on 429
```

### Side Effects

- Updates `pipeline_jobs` status: `queued → running → succeeded | failed`
- Inserts `pipeline_events` rows (info/error) at each lifecycle stage
- Inserts `action_logs` row with request, response, status, and latency

### curl Examples

```bash
# Execute a tool
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/execute-tool \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "connectorId": "11111111-2222-3333-4444-555555555555",
    "toolName": "send_email",
    "args": { "to": "user@example.com", "subject": "Test" },
    "userId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
  }'

# Expected 200:
# { "success": true, "result": { ... }, "latencyMs": 523 }

# Expected 429:
# { "success": false, "error": "User rate limit exceeded. Retry after 42 seconds", "retryAfter": "1708123456" }
```

---

## 2. oauth-start

Generates PKCE code verifier/challenge, creates an `oauth_transactions` record, and returns the provider's authorization URL.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |
| `GOOGLE_CLIENT_ID` | ⚠️ | Required if Google connector lacks `oauth_config.client_id` |
| `GITHUB_CLIENT_ID` | ⚠️ | Required if GitHub connector lacks `oauth_config.client_id` |
| `SLACK_CLIENT_ID` | ⚠️ | Required if Slack connector lacks `oauth_config.client_id` |

### Supported Providers

| Provider | Auth URL | Scopes (defaults) |
|---|---|---|
| Google | `accounts.google.com/o/oauth2/v2/auth` | `openid email profile calendar.readonly drive.readonly` |
| GitHub | `github.com/login/oauth/authorize` | `read:user user:email repo read:org` |
| Slack | `slack.com/oauth/v2/authorize` | `channels:read chat:write users:read team:read` |

### Request

**Method:** `POST`

```json
{
  "connectorId": "uuid",
  "userId": "uuid",
  "redirectUri": "https://example.com/callback"
}
```

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, authorizationUrl, state, codeVerifier }` | URL generated |
| `400` | `{ success: false, error: "..." }` | Missing fields, non-OAuth connector, or unsupported provider |
| `404` | `{ success: false, error: "Connector not found" }` | Invalid `connectorId` |
| `500` | `{ success: false, error: "..." }` | Client ID missing or DB insert failure |

### Side Effects

- Inserts `oauth_transactions` row with `status: 'started'`, hashed code verifier, and state

### curl Example

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/oauth-start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "connectorId": "11111111-2222-3333-4444-555555555555",
    "userId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "redirectUri": "https://myapp.com/oauth/callback"
  }'

# Expected 200:
# {
#   "success": true,
#   "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&scope=...&state=abc123...",
#   "state": "abc123def456...",
#   "codeVerifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
# }
```

---

## 3. oauth-callback

Verifies state and code verifier hash, exchanges the authorization code for tokens, encrypts tokens with AES-GCM, and upserts the `user_connections` record.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |
| `TOKEN_ENCRYPTION_KEY` | ⚠️ | AES-GCM key material (defaults to hardcoded dev key) |
| `GOOGLE_CLIENT_ID` | ⚠️ | Fallback if not in `oauth_config` |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | Fallback if not in `oauth_config` |
| `GITHUB_CLIENT_ID` | ⚠️ | Fallback |
| `GITHUB_CLIENT_SECRET` | ⚠️ | Fallback |
| `SLACK_CLIENT_ID` | ⚠️ | Fallback |
| `SLACK_CLIENT_SECRET` | ⚠️ | Fallback |

### Encryption Details

- **Algorithm:** AES-GCM with 256-bit key derived from SHA-256 of `TOKEN_ENCRYPTION_KEY`
- **IV:** 12-byte random nonce prepended to ciphertext
- **Storage:** Base64-encoded `iv + ciphertext` stored in `user_connections.secret_ref_access` and `secret_ref_refresh`

### Request

**Method:** `POST`

```json
{
  "code": "authorization-code-from-provider",
  "state": "hex-string-from-oauth-start",
  "codeVerifier": "base64url-string-from-oauth-start"
}
```

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, message, connectorId, connectorName, scopes }` | Tokens exchanged and stored |
| `400` | `{ success: false, error: "..." }` | Missing fields, invalid state, or code verifier mismatch |
| `500` | `{ success: false, error: "..." }` | Credentials missing, token exchange failure, or DB error |

### Side Effects

- Updates `oauth_transactions` to `status: 'completed'` or `'failed'`
- Upserts `user_connections` with encrypted tokens and `status: 'active'`

### curl Example

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/oauth-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "code": "4/0AY0e-g7...",
    "state": "abc123def456...",
    "codeVerifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  }'

# Expected 200:
# {
#   "success": true,
#   "message": "OAuth connection established",
#   "connectorId": "11111111-2222-3333-4444-555555555555",
#   "connectorName": "Google",
#   "scopes": ["openid", "email", "profile"]
# }
```

---

## 4. token-refresh

Refreshes expiring OAuth tokens. Can target a specific connection or batch-refresh all connections expiring within 5 minutes. Failed refreshes mark the connection as `expired`.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |
| `TOKEN_ENCRYPTION_KEY` | ⚠️ | For decrypting/re-encrypting tokens |
| `{PROVIDER}_CLIENT_ID` | ⚠️ | Per-provider fallback |
| `{PROVIDER}_CLIENT_SECRET` | ⚠️ | Per-provider fallback |

### Provider Notes

| Provider | Refresh Support | Notes |
|---|---|---|
| Google | ✅ | Standard OAuth2 refresh |
| Slack | ✅ | Custom response format handled |
| GitHub | ❌ | Throws error — re-authentication required |

### Request

**Method:** `POST`

```json
{
  "connectionId": "uuid",
  "force": false
}
```

Both fields are optional:
- Omit body entirely for batch mode (tokens expiring in ≤5 min)
- Set `force: true` to refresh all active connections regardless of expiry
- Set `connectionId` to target a single connection

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, refreshed: 2, failed: 0, results: [...] }` | Batch complete |
| `200` | `{ success: true, message: "No tokens need refreshing", refreshed: 0 }` | Nothing to refresh |
| `500` | `{ success: false, error: "..." }` | DB fetch failure |

### Side Effects

- Updates `user_connections.secret_ref_access`, `secret_ref_refresh`, `expires_at` on success
- Sets `user_connections.status = 'expired'` on failure

### curl Examples

```bash
# Batch refresh (tokens expiring within 5 minutes)
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/token-refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>"

# Force refresh all connections
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/token-refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{ "force": true }'

# Refresh a specific connection
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/token-refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{ "connectionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }'

# Expected 200:
# {
#   "success": true,
#   "refreshed": 2,
#   "failed": 0,
#   "results": [
#     { "connectionId": "...", "connectorName": "Google", "success": true, "expiresAt": "2026-02-16T..." },
#     { "connectionId": "...", "connectorName": "Slack", "success": true, "expiresAt": "2026-02-16T..." }
#   ]
# }
```

---

## 5. health-check

Runs parallel connectivity probes against all active connectors (or a specific one). Tests MCP server reachability via `initialize` JSON-RPC call and REST APIs with GET requests.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |

### Probe Details

| Probe | Method | Timeout | Success Criteria |
|---|---|---|---|
| MCP Server | `POST` JSON-RPC `initialize` | 10s | HTTP 200 |
| REST API | `GET` to known endpoint | 10s | HTTP 200, 401, or 403 (reachable) |

**Known REST endpoints:**
- Google → `googleapis.com/oauth2/v3/tokeninfo`
- GitHub → `api.github.com/zen`
- Slack → `slack.com/api/api.test`
- Notion → `api.notion.com/v1/users/me`
- Linear → `api.linear.app/graphql`

### Status Model

| Status | Condition |
|---|---|
| `healthy` | All configured probes reachable |
| `degraded` | At least one probe reachable, at least one failing |
| `unhealthy` | All configured probes unreachable |

### Request

**Method:** `GET`

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `connectorId` | uuid | ❌ | Check single connector (omit for all active) |

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, summary: {...}, results: [...] }` | Check complete |
| `200` | `{ success: true, results: [], message: "No connectors found" }` | No connectors to check |
| `500` | `{ success: false, error: "..." }` | DB or internal failure |

### curl Examples

```bash
# Check all active connectors
curl -X GET \
  "https://<project-ref>.supabase.co/functions/v1/health-check" \
  -H "Authorization: Bearer <anon-key>"

# Check a specific connector
curl -X GET \
  "https://<project-ref>.supabase.co/functions/v1/health-check?connectorId=11111111-2222-3333-4444-555555555555" \
  -H "Authorization: Bearer <anon-key>"

# Expected 200:
# {
#   "success": true,
#   "summary": { "total": 8, "healthy": 6, "degraded": 1, "unhealthy": 1 },
#   "results": [
#     {
#       "connectorId": "...",
#       "connectorName": "GitHub",
#       "status": "healthy",
#       "mcpServer": null,
#       "restApi": { "configured": true, "reachable": true, "latencyMs": 142, "error": null },
#       "checkedAt": "2026-02-16T12:00:00.000Z"
#     }
#   ]
# }
```

---

## 6. send-health-alert

Sends HTML email alerts via Resend for unhealthy or degraded connectors. Includes a **15-minute per-connector cooldown** to prevent alert spam. Supports single or batch alerts.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |
| `RESEND_API_KEY` | ✅ | Resend email service API key |
| `ALERT_RECIPIENT_EMAIL` | ❌ | Default recipient (falls back to `admin@example.com`) |

### Cooldown Logic

- 15-minute cooldown per `connectorSlug`
- Cooldown resets if the **status changes** (e.g., `degraded → unhealthy`)
- Cooldown state is in-memory and resets on function cold start

### Request

**Method:** `POST`

Single alert:
```json
{
  "connectorName": "GitHub",
  "connectorSlug": "github",
  "status": "unhealthy",
  "error": "Connection timeout (10s)",
  "latencyMs": 10023,
  "timestamp": "2026-02-16T12:00:00.000Z",
  "recipientEmail": "admin@example.com"
}
```

Batch alerts: Send an array of the above objects.

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, sent: 1, skipped: 0, results: [...] }` | Processed |
| `500` | `{ success: false, error: "Email service not configured" }` | Missing `RESEND_API_KEY` |
| `500` | `{ success: false, error: "..." }` | Internal failure |

### curl Example

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/send-health-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "connectorName": "GitHub",
    "connectorSlug": "github",
    "status": "unhealthy",
    "error": "Connection timeout (10s)",
    "latencyMs": 10023,
    "timestamp": "2026-02-16T12:00:00.000Z",
    "recipientEmail": "ops@mycompany.com"
  }'

# Expected 200:
# { "success": true, "sent": 1, "skipped": 0, "results": [{ "connectorSlug": "github", "sent": true }] }

# Cooldown active (repeat within 15 min):
# { "success": true, "sent": 0, "skipped": 1, "results": [{ "connectorSlug": "github", "sent": false, "reason": "cooldown" }] }
```

---

## 7. send-webhook

Dispatches event payloads to all active webhooks subscribed to the event type. Supports custom payload templates with `{{variable}}` substitution. Includes automatic retry with exponential backoff.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |

### Retry Strategy

| Attempt | Delay | Behavior |
|---|---|---|
| 1 | Immediate | First try |
| 2 | 1,000ms | Exponential backoff |
| 3 | 2,000ms | Final attempt |

**Non-retryable:** 4xx errors (except 429) abort immediately.

### HMAC Signature

If a webhook has a `secret` configured, a `X-Webhook-Signature` header is sent:

```
X-Webhook-Signature: sha256=<hex-encoded-hmac-sha256-of-json-body>
```

### Template Variables

Available in `payload_template` with `{{variable}}` syntax:

| Variable | Description |
|---|---|
| `{{event}}` | Event type (e.g., `connection.active`) |
| `{{timestamp}}` | ISO 8601 timestamp |
| `{{connectionId}}` | Connection UUID |
| `{{connectorId}}` | Connector UUID |
| `{{connectorName}}` | Human-readable connector name |
| `{{connectorSlug}}` | URL-safe connector slug |
| `{{userId}}` | User UUID |
| `{{status}}` | Current status |
| `{{previousStatus}}` | Previous status |

### Request

**Method:** `POST`

```json
{
  "event": "connection.active",
  "connectionId": "uuid",
  "connectorId": "uuid",
  "userId": "uuid",
  "status": "active",
  "previousStatus": "pending"
}
```

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ message: "Sent 2/3 webhooks", results: [...] }` | Dispatch complete |
| `200` | `{ message: "No webhooks to send", count: 0 }` | No matching webhooks |
| `500` | `{ error: "..." }` | DB or internal failure |

### Delivery Headers (sent to webhook endpoint)

```
Content-Type: application/json
User-Agent: Lovable-Webhooks/1.0
X-Webhook-Attempt: 1
X-Webhook-Signature: sha256=...   # If secret configured
```

### Side Effects

- Creates `webhook_deliveries` row with `status: 'pending'`
- Updates to `'delivered'` or `'failed'` after execution

### curl Example

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/send-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "event": "connection.active",
    "connectionId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "connectorId": "11111111-2222-3333-4444-555555555555",
    "userId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
    "status": "active",
    "previousStatus": "pending"
  }'

# Expected 200:
# {
#   "message": "Sent 1/1 webhooks",
#   "results": [
#     { "webhookId": "...", "deliveryId": "...", "success": true, "statusCode": 200, "attempts": 1 }
#   ]
# }
```

---

## 8. test-webhook

Sends a single test payload to a webhook URL. Returns the response status and body. Does **not** create a delivery record.

### Environment Variables

None required (no database access).

### Request

**Method:** `POST`

```json
{
  "url": "https://example.com/webhook",
  "secret": "optional-hmac-secret",
  "payload": { "test": true, "message": "Hello from MCP Connector Hub" }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✅ | Target webhook URL |
| `secret` | string | ❌ | HMAC-SHA256 signing secret |
| `payload` | object | ✅ | JSON payload to send |

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, statusCode: 200, body: "..." }` | Target responded with 2xx |
| `200` | `{ success: false, statusCode: 500, body: "..." }` | Target responded with non-2xx |
| `200` | `{ success: false, error: "Request timed out after 10 seconds" }` | 10s timeout exceeded |
| `400` | `{ success: false, error: "URL is required" }` | Missing URL |
| `500` | `{ success: false, error: "..." }` | Internal error |

### Delivery Headers (sent to target)

```
Content-Type: application/json
User-Agent: Lovable-Webhooks/1.0
X-Webhook-Test: true
X-Webhook-Signature: sha256=...   # If secret provided
```

### curl Example

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/test-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "secret": "my-signing-secret",
    "payload": { "test": true, "timestamp": "2026-02-16T12:00:00Z" }
  }'

# Expected 200:
# { "success": true, "statusCode": 200, "body": "OK" }
```

---

## 9. retry-webhook

Re-delivers a previously failed webhook delivery with fresh retry logic (3 attempts, exponential backoff). Resets the delivery record before attempting.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key |

### Retry Strategy

Same as [send-webhook](#7-send-webhook): 3 attempts with 1s/2s/4s exponential backoff. 4xx errors (except 429) are non-retryable.

### Request

**Method:** `POST`

```json
{
  "deliveryId": "uuid"
}
```

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ success: true, attempts: 1, statusCode: 200 }` | Delivery succeeded |
| `200` | `{ success: false, attempts: 3, statusCode: 500, error: "..." }` | All retries exhausted |
| `400` | `{ error: "deliveryId is required" }` | Missing field |
| `404` | `{ error: "Delivery not found" }` | Invalid `deliveryId` |
| `404` | `{ error: "Associated webhook not found" }` | Webhook deleted |
| `500` | `{ error: "..." }` | Internal failure |

### Side Effects

- Resets `webhook_deliveries` row: `status → 'pending'`, `attempts → 0`, clears response fields
- Updates to `'delivered'` or `'failed'` with final attempt count after execution

### Delivery Headers (sent to target)

```
Content-Type: application/json
User-Agent: Lovable-Webhooks/1.0
X-Webhook-Attempt: 1
X-Webhook-Retry: true
X-Webhook-Signature: sha256=...   # If webhook has secret
```

### curl Example

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/retry-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{ "deliveryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }'

# Expected 200 (success):
# { "success": true, "attempts": 1, "statusCode": 200 }

# Expected 200 (exhausted):
# { "success": false, "attempts": 3, "statusCode": 502, "error": "HTTP 502: Bad Gateway" }
```

---

## HMAC Signature Verification

All webhook functions that send payloads support HMAC-SHA256 signatures. Here's how to verify them on your receiving server:

### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Express middleware
app.post('/webhook', express.json(), (req, res) => {
  const sig = req.headers['x-webhook-signature'];
  if (!verifyWebhookSignature(req.body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  // Process webhook...
  res.sendStatus(200);
});
```

### Python

```python
import hmac, hashlib, json

def verify_signature(body: dict, signature: str, secret: str) -> bool:
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        json.dumps(body, separators=(',', ':')).encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```

### Go

```go
import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
)

func verifySignature(body []byte, signature, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(body)
    expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(signature), []byte(expected))
}
```

---

## JWT Configuration

All functions are configured with `verify_jwt = false` in `supabase/config.toml` and validate authentication in code where required. See `supabase/config.toml` for the full configuration.

---

## Error Code Summary

| HTTP Status | Meaning | Functions |
|---|---|---|
| `200` | Success (check `success` field in body) | All |
| `400` | Bad request — missing or invalid fields | execute-tool, oauth-start, oauth-callback, test-webhook, retry-webhook |
| `404` | Resource not found | execute-tool, oauth-start, retry-webhook |
| `429` | Rate limit exceeded | execute-tool |
| `500` | Internal server error | All |
