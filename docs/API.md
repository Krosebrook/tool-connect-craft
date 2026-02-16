# API Reference

Complete reference for Edge Functions, React hooks, and database schema.

---

## Table of Contents

- [Edge Functions](#edge-functions)
  - [execute-tool](#execute-tool)
  - [oauth-start](#oauth-start)
  - [oauth-callback](#oauth-callback)
  - [token-refresh](#token-refresh)
  - [health-check](#health-check)
  - [send-health-alert](#send-health-alert)
  - [send-webhook](#send-webhook)
  - [test-webhook](#test-webhook)
  - [retry-webhook](#retry-webhook)
- [React Context & Hooks](#react-context--hooks)
- [Database Schema](#database-schema)
- [Type Reference](#type-reference)

---

## Edge Functions

All functions accept `OPTIONS` for CORS preflight and return JSON with `Content-Type: application/json`.

### execute-tool

Validates arguments against tool JSON Schema, dispatches to MCP server or REST adapter, and records audit logs.

**Method:** `POST`

**Request:**
```json
{
  "jobId": "uuid",
  "connectorId": "uuid",
  "toolName": "send_email",
  "args": { "to": "user@example.com", "subject": "Hello" },
  "userId": "uuid"
}
```

**Responses:**

| Status | Description |
|---|---|
| 200 | `{ success: true, result: {...}, latencyMs: 1234 }` |
| 400 | Missing fields or validation errors |
| 404 | Connector or tool not found |
| 429 | Rate limit exceeded (includes `Retry-After` header) |
| 500 | Execution failure |

**Rate Limit Headers:**
- `X-RateLimit-Limit-User` / `X-RateLimit-Remaining-User` / `X-RateLimit-Reset-User`
- `X-RateLimit-Limit-Connector` / `X-RateLimit-Remaining-Connector` / `X-RateLimit-Reset-Connector`

---

### oauth-start

Generates PKCE code verifier/challenge, creates an `oauth_transactions` record, and returns the provider's authorization URL.

**Method:** `POST`

**Request:**
```json
{
  "connectorId": "uuid",
  "userId": "uuid",
  "redirectUri": "https://example.com/callback"
}
```

**Response (200):**
```json
{
  "success": true,
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "hex-string",
  "codeVerifier": "base64url-string"
}
```

**Supported providers:** `google`, `github`, `slack`

---

### oauth-callback

Verifies state and code verifier hash, exchanges authorization code for tokens, encrypts tokens with AES-GCM, and upserts the `user_connections` record.

**Method:** `POST`

**Request:**
```json
{
  "code": "authorization-code",
  "state": "hex-string",
  "codeVerifier": "base64url-string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OAuth connection established",
  "connectorId": "uuid",
  "connectorName": "GitHub",
  "scopes": ["repo", "read:user"]
}
```

---

### token-refresh

Refreshes expiring OAuth tokens. Can target a specific connection or batch-refresh all connections expiring within 5 minutes.

**Method:** `POST`

**Request (optional body):**
```json
{
  "connectionId": "uuid",
  "force": false
}
```

**Response (200):**
```json
{
  "success": true,
  "refreshed": 2,
  "failed": 0,
  "results": [
    { "connectionId": "uuid", "connectorName": "Google", "success": true, "expiresAt": "..." }
  ]
}
```

---

### health-check

Runs parallel connectivity checks against all active connectors (or a specific one). Tests MCP server reachability via `initialize` JSON-RPC call and REST API endpoints with GET requests.

**Method:** `GET`

**Query params:** `?connectorId=uuid` (optional)

**Response (200):**
```json
{
  "success": true,
  "summary": { "total": 8, "healthy": 6, "degraded": 1, "unhealthy": 1 },
  "results": [
    {
      "connectorId": "uuid",
      "connectorName": "GitHub",
      "status": "healthy",
      "mcpServer": { "configured": false, "reachable": false, "latencyMs": null, "error": null },
      "restApi": { "configured": true, "reachable": true, "latencyMs": 142, "error": null },
      "checkedAt": "2026-02-16T..."
    }
  ]
}
```

---

### send-health-alert

Sends HTML email alerts via Resend for unhealthy/degraded connectors. Includes a 15-minute per-connector cooldown to prevent alert spam.

**Method:** `POST`

**Request:**
```json
{
  "connectorName": "GitHub",
  "connectorSlug": "github",
  "status": "unhealthy",
  "error": "Connection timeout (10s)",
  "latencyMs": 10023,
  "timestamp": "2026-02-16T...",
  "recipientEmail": "admin@example.com"
}
```

**Requires:** `RESEND_API_KEY` environment variable.

---

### send-webhook

Dispatches event payloads to all active webhooks subscribed to the event type. Supports custom payload templates with `{{variable}}` substitution.

**Method:** `POST`

**Request:**
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

**Template variables:** `event`, `timestamp`, `connectionId`, `connectorId`, `connectorName`, `connectorSlug`, `userId`, `status`, `previousStatus`

**Webhook delivery headers:**
- `Content-Type: application/json`
- `User-Agent: Lovable-Webhooks/1.0`
- `X-Webhook-Attempt: 1`
- `X-Webhook-Signature: sha256=...` (if secret configured)

---

### test-webhook

Sends a single test payload to a webhook URL. Returns the response status and body.

**Method:** `POST`

**Request:**
```json
{
  "url": "https://example.com/webhook",
  "secret": "optional-hmac-secret",
  "payload": { "test": true }
}
```

---

### retry-webhook

Re-delivers a previously failed webhook delivery with fresh retry logic (3 attempts, exponential backoff).

**Method:** `POST`

**Request:**
```json
{ "deliveryId": "uuid" }
```

---

## React Context & Hooks

### ConnectorContext

**Provider:** `<ConnectorProvider>` — wraps app in `App.tsx`

**Hook:** `useConnectors()` — throws if used outside provider

**Shape:**
```typescript
interface ConnectorContextType {
  connectors: DbConnector[];
  tools: Map<string, DbConnectorTool[]>;
  connections: DbUserConnection[];
  jobs: DbPipelineJob[];
  events: Map<string, DbPipelineEvent[]>;
  logs: DbActionLog[];
  loading: boolean;

  getConnectorWithConnection(slug: string): ConnectorWithConnection | undefined;
  getToolsForConnector(connectorId: string): DbConnectorTool[];
  connect(connectorId: string): Promise<void>;
  disconnect(connectionId: string): Promise<void>;
  executeTool(connectorSlug: string, toolName: string, args: Record<string, unknown>): Promise<DbPipelineJob>;
  fetchEventsForJob(jobId: string): Promise<void>;
}
```

### Key Hooks

| Hook | Location | Purpose |
|---|---|---|
| `useConnectorData` | `src/hooks/useConnectorData.ts` | Core data fetching + Realtime subscriptions |
| `useOAuthFlow` | `src/hooks/useOAuthFlow.ts` | OAuth PKCE flow orchestration |
| `useHealthAlerts` | `src/hooks/useHealthAlerts.ts` | Health check trigger + alert dispatch |
| `useHealthNotifications` | `src/hooks/useHealthNotifications.ts` | Push notification logic |
| `useKeyboardShortcuts` | `src/hooks/useKeyboardShortcuts.ts` | Global keyboard shortcuts |
| `useLocalStorage` | `src/hooks/useLocalStorage.ts` | Type-safe localStorage wrapper |

---

## Database Schema

### Tables

#### connectors
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto-generated |
| `name` | text | required |
| `slug` | text | unique |
| `description` | text | nullable |
| `category` | text | nullable |
| `icon_url` | text | nullable |
| `auth_type` | enum `auth_type` | default `none` |
| `oauth_provider` | text | nullable |
| `oauth_scopes` | text[] | nullable |
| `oauth_config` | jsonb | nullable (authUrl, tokenUrl, clientId) |
| `mcp_server_url` | text | nullable |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | auto |

#### connector_tools
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `connector_id` | uuid FK → connectors | |
| `name` | text | |
| `description` | text | nullable |
| `schema` | jsonb | JSON Schema for args |
| `source` | enum `tool_source` | `mcp` or `rest` |
| `created_at` | timestamptz | |

#### user_connections
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `connector_id` | uuid FK → connectors | |
| `status` | enum `connection_status` | |
| `secret_ref_access` | text | AES-GCM encrypted |
| `secret_ref_refresh` | text | AES-GCM encrypted |
| `expires_at` | timestamptz | nullable |
| `scopes` | text[] | nullable |
| `last_used_at` | timestamptz | nullable |
| `created_at` / `updated_at` | timestamptz | |

#### pipeline_jobs
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `connector_id` | uuid FK → connectors | |
| `type` | text | e.g. `tool_execution` |
| `status` | enum `job_status` | |
| `input` / `output` | jsonb | nullable |
| `error` | text | nullable |
| `started_at` / `finished_at` | timestamptz | nullable |
| `created_at` | timestamptz | |

#### webhooks
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `name` | text | |
| `url` | text | |
| `events` | text[] | e.g. `['connection.active']` |
| `secret` | text | nullable, for HMAC |
| `is_active` | boolean | |
| `payload_template` | jsonb | nullable, custom template |
| `created_at` / `updated_at` | timestamptz | |

#### webhook_deliveries
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `webhook_id` | uuid FK → webhooks | |
| `event_type` | text | |
| `payload` | jsonb | |
| `status` | text | `pending`, `delivered`, `failed` |
| `response_code` | int | nullable |
| `response_body` | text | nullable |
| `attempts` | int | |
| `delivered_at` | timestamptz | nullable |
| `created_at` | timestamptz | |

See `src/integrations/supabase/types.ts` for the complete auto-generated TypeScript types.

---

## Type Reference

### Domain Types (`src/types/connector.ts`)

```typescript
type AuthType = 'oauth' | 'api_key' | 'none';
type ToolSource = 'mcp' | 'rest';
type ConnectionStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'error';
type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
type EventLevel = 'info' | 'warn' | 'error';
type OAuthTransactionStatus = 'started' | 'completed' | 'failed';
```

### Configuration (`src/lib/config.ts`)

```typescript
import { appConfig, ROUTES, CONNECTOR_CATEGORIES } from '@/lib/config';

appConfig.features.enableOAuth  // boolean
ROUTES.connectorDetail('github') // '/connectors/github'
```
