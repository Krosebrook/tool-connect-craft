# Architecture Documentation

## Overview

Tool Connect Craft is built on a modern, scalable architecture that separates concerns between the frontend presentation layer, backend data/auth layer, and external service integrations. This document provides a comprehensive view of the system architecture, data flows, and design decisions.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Model](#data-model)
- [Authentication Flow](#authentication-flow)
- [Tool Execution Pipeline](#tool-execution-pipeline)
- [Real-time Communication](#real-time-communication)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  React SPA (Vite + TypeScript)                              │
│  ├─ React Router (routing)                                   │
│  ├─ Context API (state management)                           │
│  ├─ TanStack Query (data fetching)                           │
│  └─ shadcn/ui + Tailwind (UI components)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                         │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                         │
│  ├─ Tables (connectors, jobs, connections, etc.)            │
│  ├─ Row Level Security (RLS)                                │
│  ├─ Realtime subscriptions                                  │
│  └─ Functions & Triggers                                     │
│                                                              │
│  Supabase Auth                                               │
│  ├─ User management                                          │
│  ├─ Session handling                                         │
│  └─ JWT tokens                                               │
│                                                              │
│  Edge Functions (Planned)                                    │
│  ├─ OAuth callback handlers                                 │
│  ├─ Tool execution orchestration                            │
│  └─ Secret management                                        │
└────────────────────┬────────────────────────────────────────┘
                     │ REST / OAuth / MCP
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
├─────────────────────────────────────────────────────────────┤
│  OAuth Providers: Google, GitHub, Slack, etc.               │
│  REST APIs: Gmail, Notion, Airtable, etc.                   │
│  MCP Servers: Custom tool servers                           │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Frontend handles presentation, backend handles business logic and data
2. **Type Safety**: TypeScript everywhere, generated types from database schema
3. **Real-time First**: WebSocket subscriptions for live updates
4. **Security by Default**: RLS policies, encrypted secrets, audit logging
5. **Developer Experience**: Hot reload, type checking, comprehensive error messages

---

## Frontend Architecture

### Component Hierarchy

```
App
├── BrowserRouter
│   ├── AuthProvider (Context)
│   │   └── ConnectorProvider (Context)
│   │       ├── Routes
│   │       │   ├── LandingPage
│   │       │   ├── AuthPage
│   │       │   ├── ConnectorsPage (Protected)
│   │       │   │   └── ConnectorCard[]
│   │       │   ├── ConnectorDetailPage (Protected)
│   │       │   │   ├── ConnectorIcon
│   │       │   │   └── ToolExecutor
│   │       │   ├── DashboardPage (Protected)
│   │       │   │   └── JobCard[]
│   │       │   └── SecuritySettingsPage (Protected)
│   │       ├── Toaster (UI feedback)
│   │       └── Sonner (Toast notifications)
│   └── QueryClientProvider (TanStack Query)
```

### State Management

**AuthContext**
- User session state
- Authentication methods (signIn, signUp, signOut)
- Loading state
- Auto-refresh session via Supabase listener

**ConnectorContext**
- Connector catalog
- User connections
- Pipeline jobs and events
- Action logs
- CRUD operations (connect, disconnect, executeTool)

### Data Fetching Strategy

1. **Initial Load**: Context providers fetch data on mount
2. **Real-time Updates**: Supabase subscriptions push changes
3. **Optimistic Updates**: UI updates immediately, sync with backend
4. **Error Handling**: Toast notifications for user feedback

### Routing

**Public Routes**
- `/` - Landing page
- `/auth` - Sign in / Sign up

**Protected Routes** (require authentication)
- `/connectors` - Browse all connectors
- `/connectors/:slug` - Connector detail and tool execution
- `/dashboard` - Job monitoring dashboard
- `/settings/security` - Security settings

---

## Backend Architecture

### Supabase Services

**PostgreSQL Database**
- Primary data store
- ACID compliance
- JSON/JSONB support for flexible schemas
- Full-text search capabilities

**Supabase Auth**
- JWT-based authentication
- Email/password sign up
- OAuth provider integration (planned)
- Session management
- MFA support (future)

**Realtime**
- WebSocket connections
- Change Data Capture (CDC)
- Row-level filtering
- Presence tracking (future)

**Edge Functions** (Planned)
- Deno runtime
- OAuth callback handling
- Tool execution orchestration
- Rate limiting
- Circuit breaker implementation

### Database Layer

**Tables**
- `connectors` - Service catalog
- `connector_tools` - Available operations
- `user_connections` - User auth tokens
- `oauth_transactions` - OAuth flow state
- `pipeline_jobs` - Execution records
- `pipeline_events` - Job event log
- `action_logs` - Audit trail

**Indexes**
- User-based queries (user_id columns)
- Status filtering (status columns)
- Time-series queries (created_at columns)
- Foreign key relationships

**Triggers**
- `update_updated_at_column()` - Auto-update timestamps

---

## Data Model

### Entity Relationship Diagram

```
┌──────────────┐         ┌────────────────┐
│  Connectors  │◄──────┐ │ User           │
│              │       │ │ Connections    │
│ • id         │       │ │                │
│ • name       │       │ │ • id           │
│ • slug       │       │ │ • user_id      │
│ • auth_type  │       └─│ • connector_id │
│ • oauth_cfg  │         │ • status       │
└──────┬───────┘         │ • secrets      │
       │                 └────────────────┘
       │ 1:N                      │
       ▼                          │ 1:N
┌──────────────┐                  │
│ Connector    │                  ▼
│ Tools        │         ┌────────────────┐
│              │         │ Pipeline       │
│ • id         │         │ Jobs           │
│ • name       │         │                │
│ • schema     │         │ • id           │
│ • source     │         │ • user_id      │
└──────────────┘         │ • status       │
                         │ • input/output │
                         └────────┬───────┘
                                  │ 1:N
                                  ▼
                         ┌────────────────┐
                         │ Pipeline       │
                         │ Events         │
                         │                │
                         │ • id           │
                         │ • job_id       │
                         │ • level        │
                         │ • message      │
                         └────────────────┘
```

### Key Relationships

1. **Connector → Connector Tools**: One-to-Many
   - Each connector has multiple tools

2. **User → User Connections**: One-to-Many
   - Each user can connect to multiple services

3. **Connector → User Connections**: One-to-Many
   - Each connector can be connected by multiple users

4. **User → Pipeline Jobs**: One-to-Many
   - Each user can have multiple jobs

5. **Pipeline Job → Pipeline Events**: One-to-Many
   - Each job generates multiple events

### Type Enums

```typescript
type AuthType = 'oauth' | 'api_key' | 'none';
type ToolSource = 'mcp' | 'rest';
type ConnectionStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'error';
type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
type EventLevel = 'info' | 'warn' | 'error';
```

---

## Authentication Flow

### User Sign Up

```
Client                  Supabase Auth           Database
  │                          │                      │
  ├──signUp(email, pwd)─────>│                      │
  │                          ├──create user──────────>│
  │                          │<─user record────────────┤
  │<─session + JWT───────────┤                      │
  │                          │                      │
  ├──auto redirect to /──────>                      │
```

### User Sign In

```
Client                  Supabase Auth           Database
  │                          │                      │
  ├──signInWithPassword─────>│                      │
  │                          ├──verify credentials─>│
  │                          │<─user record────────┤
  │<─session + JWT───────────┤                      │
  │                          │                      │
  ├──setUser(session.user)──>                      │
```

---

## Tool Execution Pipeline

### Execution Flow

```
1. User clicks "Execute Tool"
   └─> UI calls executeTool(slug, toolName, args)

2. Create Job Record
   └─> INSERT into pipeline_jobs (status: queued)
   
3. Create Initial Event
   └─> INSERT into pipeline_events ("Starting...")

4. Trigger Execution (simulated, will be Edge Function)
   ├─> Update job (status: running)
   ├─> Call external API / MCP server
   ├─> Stream events (processing, progress)
   └─> Update job (status: succeeded/failed)

5. Create Action Log
   └─> INSERT into action_logs (audit trail)

6. Real-time Updates
   └─> WebSocket pushes updates to client
```

### Job State Machine

```
    ┌─────────┐
    │ QUEUED  │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ RUNNING │
    └────┬────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────┐
│SUCCEEDED│ │ FAILED  │
└─────────┘ └─────────┘
         │
         ▼
    ┌─────────┐
    │CANCELED │
    └─────────┘
```

---

## Real-time Communication

### WebSocket Subscriptions

**Jobs Channel**
```typescript
supabase
  .channel('jobs-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pipeline_jobs',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Update local state
  })
  .subscribe()
```

**Events Channel**
```typescript
supabase
  .channel('events-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'pipeline_events'
  }, (payload) => {
    // Stream events to UI
  })
  .subscribe()
```

---

## Security Architecture

### Row Level Security (RLS)

**Principle**: Users can only access their own data

**Example Policy** (user_connections):
```sql
CREATE POLICY "Users can view their own connections"
ON user_connections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Secret Management

**Current**: Secret references stored in database
**Future**: Supabase Vault integration

```typescript
interface UserConnection {
  secret_ref_access: string;   // Reference to Vault secret
  secret_ref_refresh: string;  // Reference to refresh token
}
```

---

## Scalability Considerations

### Future Improvements

1. **Edge Functions for Tool Execution**
   - Distribute load across multiple regions
   - Isolate execution from main app

2. **Redis Cache Layer**
   - Cache connector catalog
   - Cache frequently accessed connections
   - Rate limiting state

3. **Job Queue (BullMQ / Temporal)**
   - Durable job execution
   - Retry with exponential backoff
   - Job prioritization

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page Load | < 2s | ~1.5s |
| Tool Execution | < 5s | 2-3s (simulated) |
| Real-time Latency | < 500ms | ~200ms |
| Database Queries | < 100ms | ~50ms avg |

---

## Technology Decisions

### Why React?
- **Ecosystem**: Large library of components and tools
- **Performance**: Virtual DOM and hooks for optimization
- **Developer Experience**: Hot reload, dev tools, community support

### Why Vite?
- **Speed**: 10-100x faster than webpack
- **Modern**: Native ESM support
- **Simple**: Minimal configuration

### Why Supabase?
- **All-in-one**: Database + Auth + Realtime + Storage
- **Open Source**: No vendor lock-in (self-hostable)
- **PostgreSQL**: Powerful SQL database with JSON support
- **Developer Experience**: Auto-generated types, client SDK

### Why TypeScript?
- **Type Safety**: Catch errors at compile time
- **IntelliSense**: Better IDE support
- **Refactoring**: Safer code changes
