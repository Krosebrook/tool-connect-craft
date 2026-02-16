# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ✨ Features

**Webhook System**
- Full webhook lifecycle management (create, edit, delete)
- Reusable `WebhookFormDialog` component for create/edit flows
- Custom payload templates with `{{variable}}` substitution
- HMAC-SHA256 signature verification (`X-Webhook-Signature` header)
- Exponential backoff retry (1s, 2s, 4s — max 3 attempts)
- 7-day delivery stats chart (Recharts)
- Delivery history with event/status filtering
- Manual single and bulk retry for failed deliveries
- Test endpoint for validating webhook connectivity
- `send-webhook`, `test-webhook`, `retry-webhook` Edge Functions

**OAuth 2.0 + PKCE**
- Complete `oauth-start` Edge Function (PKCE challenge, state, transaction record)
- Complete `oauth-callback` Edge Function (token exchange, AES-GCM encryption, upsert)
- Provider configurations for Google, GitHub, Slack
- `useOAuthFlow` hook for client-side orchestration
- `OAuthConnectorCard` component
- `token-refresh` Edge Function with batch and single-connection modes

**Tool Execution Engine**
- `execute-tool` Edge Function with full validation pipeline
- MCP server JSON-RPC 2.0 dispatch
- REST adapter (simulated — placeholder for real integrations)
- Per-user (30/min) and per-connector (100/min) rate limiting
- Pipeline events streaming and action log recording

**Health Monitoring**
- `health-check` Edge Function with parallel MCP/REST probes
- Tri-state status model (healthy, degraded, unhealthy)
- `HealthCheckDashboard` component
- `send-health-alert` Edge Function (Resend email, 15-min cooldown)
- `useHealthAlerts` and `useHealthNotifications` hooks
- `TokenExpiryBanner` dashboard component

**Scheduler**
- `scheduler_jobs` table with cron expressions
- `SchedulerPage` with active/inactive toggle and run history

**Notification Preferences**
- `notification_preferences` table
- `NotificationPreferencesPage` with email/push/quiet hours settings

**UI & Infrastructure**
- Lazy-loaded code-split pages (React.lazy + Suspense)
- `ErrorBoundary` component for graceful error handling
- `ConnectionsPage` for managing active connections
- Service worker and PWA manifest
- Lighthouse CI configuration
- GitHub Actions CI workflow
- Issue templates (bug report, feature request)
- PR template with comprehensive checklist

### 🔄 Refactoring
- Centralized configuration module (`src/lib/config.ts`)
- Formatters and validation utilities extracted to `src/lib/`
- Keyboard shortcuts hook
- Local storage hook

---

## [0.1.0] - 2024-12-29

### 🎉 Initial Release

**Core Platform**
- React 18 + TypeScript + Vite SPA
- Supabase backend (PostgreSQL, Auth, Realtime)
- 7 core database tables with RLS policies
- 6 custom PostgreSQL enums
- Realtime subscriptions for jobs, connections, events

**Authentication**
- Email/password authentication via Supabase Auth
- JWT session management with auto-refresh
- Protected routes

**Connector Management**
- 8 pre-configured connectors (Gmail, GitHub, Slack, Notion, etc.)
- Tool definitions with JSON Schema
- Connection lifecycle (connect, disconnect, revoke)
- Category filtering

**Pipeline Engine**
- Job creation and status tracking
- Real-time event streaming via WebSocket
- Dashboard monitoring

**UI**
- shadcn/ui component library
- Tailwind CSS design system
- Responsive design with dark mode
- Landing page, connector browser, dashboard

---

## Categories

- **✨ Features** — New features and functionality
- **🐛 Bug Fixes** — Bug fixes
- **🔒 Security** — Security improvements
- **⚡ Performance** — Performance improvements
- **🔄 Refactoring** — Code refactoring
- **📚 Documentation** — Documentation changes
- **🧪 Testing** — Test additions or modifications
- **🔧 Infrastructure** — Build, CI/CD, or tooling changes

---

[Unreleased]: https://github.com/Krosebrook/tool-connect-craft/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Krosebrook/tool-connect-craft/releases/tag/v0.1.0
