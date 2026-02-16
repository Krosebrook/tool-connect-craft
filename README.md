# Tool Connect Craft 🔌

A production-grade **Model Context Protocol (MCP) Connector Hub** for integrating and automating services via OAuth 2.0 PKCE, API keys, and MCP servers. Built for developers, AI agents, and automation workflows.

[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Edge Functions](#edge-functions)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Development](#development)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Tool Connect Craft** is a unified integration platform that enables seamless connectivity between applications and external services. It acts as a central hub for managing OAuth connections, executing tools via MCP or REST adapters, monitoring pipeline health, and dispatching webhook notifications — all backed by a PostgreSQL database with row-level security.

### Key Capabilities

| Capability | Status |
|---|---|
| OAuth 2.0 + PKCE authentication flow | ✅ Implemented |
| MCP & REST tool execution engine | ✅ Implemented |
| Real-time pipeline job streaming | ✅ Implemented |
| Webhook system with HMAC + retry | ✅ Implemented |
| Connector health monitoring | ✅ Implemented |
| Token auto-refresh | ✅ Implemented |
| Rate limiting (per-user & per-connector) | ✅ Implemented |
| Scheduled jobs (cron) | ✅ Implemented |
| Notification preferences | ✅ Implemented |
| Email health alerts (Resend) | ✅ Implemented |
| Row-level security on all tables | ✅ Implemented |
| Lazy-loaded code-split pages | ✅ Implemented |

---

## ✨ Features

### 🔐 Authentication & OAuth

- Full OAuth 2.0 + PKCE flow via Edge Functions (`oauth-start`, `oauth-callback`)
- Provider configs for Google, GitHub, and Slack out of the box
- Application-layer AES-GCM token encryption for stored credentials
- Automatic token refresh with configurable expiration windows (`token-refresh`)
- API key and passwordless connection modes

### 🔌 Connector Ecosystem

Pre-configured connectors covering:

- **Communication** — Gmail, Slack
- **Development** — GitHub, Vercel
- **Productivity** — Notion
- **Storage** — Google Drive
- **Database** — Airtable
- **Custom** — Any MCP-compatible server

Each connector has typed tool definitions with JSON Schema validation.

### ⚡ Execution Pipeline

1. Client creates a `pipeline_job` (status `queued`)
2. Calls the `execute-tool` Edge Function
3. Function validates args against tool schema
4. Dispatches to MCP server or REST adapter
5. Streams `pipeline_events` in real-time via WebSocket
6. Records results + latency in `action_logs`

Rate limiting enforces 30 req/min per user and 100 req/min per connector.

### 🔔 Webhook System

- Full CRUD management with reusable form dialog
- Custom payload templates with `{{variable}}` substitution
- HMAC-SHA256 signature verification (`X-Webhook-Signature`)
- Exponential backoff retry (1s → 2s → 4s, max 3 attempts)
- Delivery history with filtering, stats chart, and manual/bulk retry
- Test endpoint for validating connectivity

### 🏥 Health Monitoring

- Parallel health checks against MCP servers and REST APIs
- Tri-state status model: `healthy | degraded | unhealthy`
- Email alerts via Resend with 15-minute cooldown deduplication
- Real-time health dashboard component

### 📅 Scheduler

- Cron-based job scheduling with `scheduler_jobs` table
- Active/inactive toggle, run count tracking, error history
- Next-run-at computation

### 🔒 Security

- Row-level security (RLS) on every table
- JWT-based session management
- AES-GCM encrypted token storage
- PKCE code challenge verification
- Comprehensive audit logging (`action_logs`)
- Input validation with Zod schemas

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                       │
│  React Router · Context API · TanStack Query · shadcn/ui  │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTPS / WebSocket
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   Supabase Backend                         │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Postgres │ │   Auth    │ │ Realtime │ │   Edge     │  │
│  │ + RLS    │ │ (JWT)     │ │ (WS)     │ │ Functions  │  │
│  └──────────┘ └───────────┘ └──────────┘ └────────────┘  │
└──────────────────────────┬─────────────────────────────────┘
                           │ REST / OAuth / MCP
                           ▼
┌────────────────────────────────────────────────────────────┐
│              External Services & MCP Servers               │
│   Google · GitHub · Slack · Notion · Custom MCP Servers    │
└────────────────────────────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design documentation.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Supabase** project (or Lovable Cloud)

### Installation

```bash
git clone https://github.com/Krosebrook/tool-connect-craft.git
cd tool-connect-craft
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Yes |

---

## 📁 Project Structure

```
tool-connect-craft/
├── src/
│   ├── components/
│   │   ├── connectors/      # ConnectorCard, ToolExecutor, OAuthConnectorCard
│   │   ├── dashboard/       # TokenExpiryBanner
│   │   ├── health/          # HealthCheckDashboard
│   │   ├── layout/          # Layout shell
│   │   ├── webhooks/        # WebhookFormDialog, DeliveryStatsChart, etc.
│   │   └── ui/              # shadcn/ui primitives
│   ├── context/             # ConnectorContext (provider + hook)
│   ├── hooks/               # useConnectorData, useOAuthFlow, useHealthAlerts, etc.
│   ├── integrations/supabase/  # Auto-generated client & types
│   ├── lib/                 # config, formatters, validation, utils
│   ├── pages/               # 10 lazy-loaded route pages
│   └── types/               # Domain types (connector.ts)
├── supabase/
│   ├── functions/           # 8 Edge Functions (Deno)
│   └── migrations/          # SQL migrations
├── docs/                    # Detailed documentation
└── public/                  # Static assets + PWA manifest
```

---

## ⚙️ Edge Functions

All backend logic runs as Deno-based Edge Functions, auto-deployed on push.

| Function | Purpose |
|---|---|
| `execute-tool` | Validates args, dispatches MCP/REST calls, records audit logs. Rate-limited. |
| `oauth-start` | Generates PKCE challenge, stores transaction, returns authorization URL. |
| `oauth-callback` | Verifies state + code verifier, exchanges code for tokens, encrypts & stores. |
| `token-refresh` | Refreshes expiring OAuth tokens with provider-specific handling. |
| `health-check` | Parallel connectivity checks against MCP servers and REST endpoints. |
| `send-health-alert` | Sends HTML email alerts via Resend with cooldown deduplication. |
| `send-webhook` | Delivers webhook payloads with HMAC signing, retries, and template substitution. |
| `test-webhook` | Sends a single test payload to validate endpoint connectivity. |
| `retry-webhook` | Re-delivers a specific failed webhook delivery with fresh retry logic. |

---

## 🗄️ Database Schema

**11 tables** with full RLS and realtime replication:

| Table | Purpose |
|---|---|
| `connectors` | Service registry (name, slug, auth type, OAuth config, MCP URL) |
| `connector_tools` | Tool definitions with JSON Schema (`mcp` or `rest` source) |
| `user_connections` | Per-user connection instances with encrypted token refs |
| `oauth_transactions` | PKCE flow state tracking (state, code_verifier_hash) |
| `pipeline_jobs` | Async job execution records (queued → running → succeeded/failed) |
| `pipeline_events` | Real-time job event log (info, warn, error) |
| `action_logs` | Audit trail with request/response and latency metrics |
| `webhooks` | User-defined webhook endpoints with event subscriptions |
| `webhook_deliveries` | Delivery history with status, response code, and retry count |
| `scheduler_jobs` | Cron-based scheduled function execution |
| `notification_preferences` | Per-user email/push notification settings with quiet hours |

**6 custom enums**: `auth_type`, `connection_status`, `event_level`, `job_status`, `oauth_transaction_status`, `tool_source`

---

## 🛠️ Development

### Scripts

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run test         # Vitest
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript 5.8, Vite |
| **UI** | shadcn/ui, Radix UI, Tailwind CSS, Recharts |
| **State** | React Context, TanStack Query v5 |
| **Forms** | React Hook Form, Zod |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| **Edge Runtime** | Deno (Supabase Edge Functions) |
| **Testing** | Vitest, React Testing Library |

---

## 📚 Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flows, and design decisions |
| [docs/API.md](docs/API.md) | Edge Function API reference and database schema |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, coding standards, and component development |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guides (Vercel, Netlify, Docker, self-hosted) |
| [docs/SECURITY.md](docs/SECURITY.md) | Security features, policies, and incident response |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Contribution guidelines and PR process |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Feature roadmap and release plan |
| [docs/CODE_ANALYSIS.md](docs/CODE_ANALYSIS.md) | Code quality analysis and refactoring recommendations |
| [docs/AUDIT_SUMMARY.md](docs/AUDIT_SUMMARY.md) | Technical audit and assessment |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## 🤝 Contributing

1. Fork → branch (`feature/my-feature`) → commit ([Conventional Commits](https://www.conventionalcommits.org/)) → PR
2. Follow [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for coding standards
3. Ensure `npm run lint && npm run build` pass

---

## 📄 License

[MIT](LICENSE) © Tool Connect Craft Contributors
