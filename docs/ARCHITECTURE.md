# Architecture Documentation

## Overview

Tool Connect Craft is a full-stack integration platform with a React SPA frontend, a Supabase PostgreSQL backend with Row-Level Security, and Deno-based Edge Functions for secure server-side operations. This document describes the system design, data flows, and key decisions.

---

## System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                      Client Layer (React SPA)                    │
│                                                                  │
│  React Router v6 ─ 10 lazy-loaded pages                         │
│  ConnectorContext ─ global state for connectors/jobs/connections │
│  TanStack Query v5 ─ caching, stale-while-revalidate            │
│  Supabase Realtime ─ WebSocket subscriptions for jobs/events    │
│  shadcn/ui + Tailwind CSS ─ design system                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / WSS
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
│                                                                  │
│  PostgreSQL 15+                                                  │
│  ├─ 11 tables with RLS policies                                 │
│  ├─ 6 custom enums                                               │
│  ├─ Realtime (Change Data Capture)                               │
│  └─ Auto-updated timestamps via triggers                         │
│                                                                  │
│  Supabase Auth (JWT, email/password)                             │
│                                                                  │
│  Edge Functions (Deno runtime) ─ 8 functions                     │
│  ├─ execute-tool       (tool dispatch + rate limiting)           │
│  ├─ oauth-start        (PKCE initiation)                         │
│  ├─ oauth-callback     (token exchange + encryption)             │
│  ├─ token-refresh      (automatic token renewal)                 │
│  ├─ health-check       (parallel MCP/REST probes)                │
│  ├─ send-health-alert  (email via Resend)                        │
│  ├─ send-webhook       (HMAC + retry + template)                 │
│  ├─ test-webhook       (connectivity test)                       │
│  └─ retry-webhook      (re-deliver failed)                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   External Services                              │
│  OAuth Providers: Google, GitHub, Slack                          │
│  REST APIs: Gmail, Notion, Airtable, etc.                       │
│  MCP Servers: Any JSON-RPC 2.0 MCP-compatible server            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Routing (Lazy-loaded)

| Route | Page | Description |
|---|---|---|
| `/` | LandingPage | Feature showcase |
| `/connectors` | ConnectorsPage | Browse & filter connectors |
| `/connectors/:slug` | ConnectorDetailPage | Tools & execution |
| `/connections` | ConnectionsPage | Manage active connections |
| `/dashboard` | DashboardPage | Job monitoring |
| `/scheduler` | SchedulerPage | Cron job management |
| `/webhooks` | WebhooksPage | Webhook CRUD + delivery history |
| `/settings/notifications` | NotificationPreferencesPage | Alert preferences |
| `/settings/security` | SecuritySettingsPage | Security settings |

All pages are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` with a `PageLoader` fallback.

### State Management

**ConnectorContext** — single context providing:
- `connectors`, `tools`, `connections`, `jobs`, `events`, `logs`
- Methods: `connect()`, `disconnect()`, `executeTool()`, `fetchEventsForJob()`
- Powered by `useConnectorData` hook which sets up three Realtime channels

**TanStack Query** — configured with:
- 5-minute stale time, 30-minute GC time
- 2 retries for queries, 1 for mutations
- `refetchOnWindowFocus: false`

### Real-time Subscriptions

Three Supabase Realtime channels subscribe to `postgres_changes`:

1. **`jobs-changes`** — `pipeline_jobs` INSERT/UPDATE filtered by `user_id`
2. **`connections-changes`** — `user_connections` INSERT/UPDATE/DELETE filtered by `user_id`
3. **`events-changes`** — `pipeline_events` INSERT (all, joined client-side by `job_id`)

---

## Backend Architecture

### Edge Function Design

Each Edge Function follows a consistent pattern:
1. CORS preflight handling
2. Service-role Supabase client instantiation
3. Request validation
4. Business logic
5. Structured JSON response with appropriate HTTP status

**Key patterns:**
- **Rate limiting** (execute-tool): In-memory sliding window per user (30/min) and per connector (100/min)
- **PKCE** (oauth-start/callback): `crypto.subtle` for SHA-256 hashing and code challenge generation
- **Token encryption** (oauth-callback, token-refresh): AES-GCM with derived key from `TOKEN_ENCRYPTION_KEY` env var
- **Retry with backoff** (send-webhook, retry-webhook): Exponential delays (1s, 2s, 4s), skip retries on 4xx (except 429)
- **Alert deduplication** (send-health-alert): In-memory cooldown map (15 min per connector)

### Tool Execution Flow

```
Client                    Edge Function              Database           External
  │                         │                          │                  │
  ├─ INSERT pipeline_job ──>│                          │                  │
  │  (status: queued)       │                          │                  │
  │                         │                          │                  │
  ├─ invoke execute-tool ──>│                          │                  │
  │                         ├─ check rate limits       │                  │
  │                         ├─ fetch connector ───────>│                  │
  │                         ├─ fetch tool + schema ───>│                  │
  │                         ├─ validate args           │                  │
  │                         ├─ UPDATE job (running) ──>│                  │
  │                         ├─ INSERT event (info) ───>│                  │
  │                         │                          │                  │
  │                         ├─ MCP: POST jsonrpc ─────────────────────────>│
  │                         │  or REST: simulated      │                  │
  │                         │<────────────────────────────── result ───────┤
  │                         │                          │                  │
  │                         ├─ UPDATE job (result) ───>│                  │
  │                         ├─ INSERT event (done) ───>│                  │
  │                         ├─ INSERT action_log ─────>│                  │
  │<── JSON response ───────┤                          │                  │
  │                         │                          │                  │
  │<── Realtime WS push ───────────────────────────────┤                  │
```

### OAuth Flow (PKCE)

```
Client                  oauth-start              Provider           oauth-callback
  │                        │                        │                    │
  ├─ POST {connectorId} ──>│                        │                    │
  │                        ├─ gen codeVerifier       │                    │
  │                        ├─ gen codeChallenge      │                    │
  │                        ├─ gen state              │                    │
  │                        ├─ INSERT oauth_tx ──>DB  │                    │
  │<── {authUrl, codeV} ───┤                        │                    │
  │                        │                        │                    │
  ├─ redirect ────────────────────────────────────>│                    │
  │<─ callback?code=X&state=Y ────────────────────┤                    │
  │                        │                        │                    │
  ├─ POST {code, state, codeVerifier} ─────────────────────────────────>│
  │                        │                        │  ├─ verify state   │
  │                        │                        │  ├─ verify hash    │
  │                        │                        │  ├─ exchange code─>│
  │                        │                        │  │<── tokens ──────┤
  │                        │                        │  ├─ encrypt tokens │
  │                        │                        │  ├─ UPSERT conn   │
  │                        │                        │  ├─ UPDATE tx done│
  │<── {success, scopes} ──────────────────────────────────────────────┤
```

---

## Data Model

### Entity Relationships

```
connectors ──1:N──> connector_tools
connectors ──1:N──> user_connections <──N:1── users (implicit)
connectors ──1:N──> oauth_transactions <──N:1── users
users ──1:N──> pipeline_jobs ──1:N──> pipeline_events
users ──1:N──> action_logs
users ──1:N──> webhooks ──1:N──> webhook_deliveries
users ──1:1──> notification_preferences
scheduler_jobs (standalone)
```

### Enums

| Enum | Values |
|---|---|
| `auth_type` | `oauth`, `api_key`, `none` |
| `connection_status` | `pending`, `active`, `expired`, `revoked`, `error` |
| `job_status` | `queued`, `running`, `succeeded`, `failed`, `canceled` |
| `event_level` | `info`, `warn`, `error` |
| `oauth_transaction_status` | `started`, `completed`, `failed` |
| `tool_source` | `mcp`, `rest` |

### Job State Machine

```
  queued ──> running ──┬──> succeeded
                       └──> failed
                       └──> canceled
```

---

## Security Architecture

### Defense in Depth

| Layer | Mechanism |
|---|---|
| **Database** | RLS policies on all 11 tables; `auth.uid()` scoping |
| **Transport** | HTTPS/WSS enforced by Supabase |
| **Auth** | JWT with auto-refresh; email/password |
| **Secrets** | AES-GCM application-layer encryption; key from env var |
| **OAuth** | PKCE with SHA-256 code challenge |
| **Webhooks** | HMAC-SHA256 signature verification |
| **Rate Limiting** | Per-user (30/min) and per-connector (100/min) |
| **Audit** | Complete action_logs with request/response/latency |
| **Input Validation** | Zod schemas (frontend), JSON Schema (execute-tool) |

### Token Storage

Tokens are encrypted with AES-GCM before being stored in `user_connections.secret_ref_access` / `secret_ref_refresh`. The encryption key is derived from the `TOKEN_ENCRYPTION_KEY` environment variable via SHA-256.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Supabase** | All-in-one (DB + Auth + Realtime + Edge Functions + RLS) |
| **Edge Functions over client-side execution** | Keeps secrets server-side; enables rate limiting |
| **Context API over Redux** | Sufficient for current scale; less boilerplate |
| **Lazy loading** | All pages code-split for optimal initial load |
| **In-memory rate limiting** | Acceptable for single-instance Edge Functions; resets on cold start |
| **HMAC webhook signing** | Industry standard for webhook verification |
| **Exponential backoff** | Prevents thundering herd on transient failures |

---

## Performance

| Metric | Target | Notes |
|---|---|---|
| Initial page load | < 2s | Code-split pages, 5-min query stale time |
| Tool execution | < 5s | Depends on external service latency |
| Realtime latency | < 500ms | Supabase Realtime CDC |
| Health check | < 15s | 10s timeout per connector, run in parallel |
