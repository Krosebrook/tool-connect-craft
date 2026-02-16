# Roadmap

**MCP Connector Hub** — Product Roadmap

---

## Current Status: Production (February 2026)

### ✅ Completed Features

**Core Platform**
- [x] Connector registry with 8 pre-configured services (GitHub, Slack, Gmail, Notion, etc.)
- [x] Tool catalog with JSON schema validation
- [x] User connections with status tracking (pending/active/expired/revoked/error)
- [x] Real-time pipeline job execution with event streaming
- [x] Audit logging with latency metrics

**Authentication & Security**
- [x] OAuth 2.0 PKCE flow via Edge Functions (`oauth-start`, `oauth-callback`)
- [x] AES-GCM token encryption at rest
- [x] Automatic token refresh (pg_cron, 5-minute intervals)
- [x] Row-Level Security on all 11 tables
- [x] HMAC-SHA256 webhook signature verification

**Edge Functions (8 deployed)**
- [x] `execute-tool` — Tool execution engine with job lifecycle
- [x] `oauth-start` — PKCE challenge generation + authorization URL
- [x] `oauth-callback` — Token exchange + encrypted storage
- [x] `token-refresh` — Automatic renewal of expired tokens
- [x] `health-check` — Connector availability monitoring
- [x] `send-webhook` — Delivery with exponential backoff (1s/2s/4s)
- [x] `test-webhook` — Endpoint validation
- [x] `retry-webhook` — Manual + bulk retry for failed deliveries
- [x] `send-health-alert` — Critical email alerts via Resend (15-min cooldown)

**Webhook System**
- [x] Full CRUD (create, edit, delete) with reusable form dialog
- [x] Event subscription (connection.active, job.completed, etc.)
- [x] Delivery history with event/status filtering
- [x] 7-day performance stats chart
- [x] Payload template with live JSON validation

**Monitoring & Notifications**
- [x] Health check dashboard with status indicators
- [x] Token expiry banner (alerts for tokens expiring within 1 hour)
- [x] Notification preferences (email, push, webhook channels)
- [x] Quiet hours configuration
- [x] Browser push notifications for health alerts

**Scheduler**
- [x] Cron job management UI at `/scheduler`
- [x] Manual trigger, pause, resume controls
- [x] Run history with error tracking

**Developer Experience**
- [x] CI/CD via GitHub Actions (lint, type-check, test, build, Lighthouse)
- [x] Vitest test suite with React Testing Library
- [x] Zod-based input validation
- [x] Route-based code splitting (React.lazy + Suspense)
- [x] PWA support (service worker, manifest, icon set)
- [x] Comprehensive documentation suite

---

## Next: v1.1 — Connector Ecosystem Expansion

**Focus**: More integrations and developer tooling

- [ ] Pre-built connectors: Google Drive, Jira, Linear, Trello
- [ ] Connector SDK for third-party developers
- [ ] Connector versioning and update management
- [ ] Connector marketplace (basic listing)
- [ ] Interactive API documentation

---

## v1.2 — Advanced Reliability

**Focus**: Production hardening

- [ ] Circuit breaker pattern for failing connectors
- [ ] Per-user and per-connector rate limiting with dashboard
- [ ] Job timeout handling and cancellation
- [ ] Distributed job queue (BullMQ or equivalent)
- [ ] Error tracking integration (Sentry)

---

## v1.3 — Analytics & Insights

**Focus**: Visibility into platform usage

- [ ] Usage statistics dashboard (calls, latency, error rates)
- [ ] Cost analysis per connector
- [ ] Popular tools/connectors ranking
- [ ] Export reports (CSV, JSON)
- [ ] Scheduled report delivery

---

## v1.4 — MCP Protocol Support

**Focus**: Native Model Context Protocol integration

- [ ] MCP server discovery and registration
- [ ] WebSocket transport for MCP communication
- [ ] Protocol version negotiation
- [ ] Streaming response handling
- [ ] File system and database MCP connectors

---

## v2.0 — Team Collaboration & AI Agents

**Focus**: Multi-user and autonomous workflows

- [ ] Organization accounts with team management
- [ ] Role-based access control (RBAC)
- [ ] Shared connectors and workspaces
- [ ] AI agent integration (Claude, GPT-4) via MCP tool calling
- [ ] Multi-step workflow builder with visual editor
- [ ] Agent templates and orchestration

---

## v2.1 — Enterprise Features

**Focus**: Enterprise readiness

- [ ] SSO integration (SAML, OIDC)
- [ ] Advanced audit log export and retention
- [ ] IP whitelisting
- [ ] Custom encryption keys
- [ ] SOC 2 and GDPR compliance
- [ ] Self-hosted deployment (Docker/Kubernetes)

---

## Research & Exploration

Areas of interest (no commitment):
- GraphQL API layer
- gRPC for internal communication
- Event sourcing architecture
- Edge computing for low-latency execution

---

## Contributing to the Roadmap

1. Star the repository to show interest
2. Comment on roadmap issues
3. Submit PRs for features you'd like to see
4. Share use cases in GitHub Discussions

---

## Disclaimer

This roadmap is a living document subject to change based on user feedback, technical constraints, and team capacity. Features may be re-prioritized without notice.

---

**Last Updated**: February 2026
