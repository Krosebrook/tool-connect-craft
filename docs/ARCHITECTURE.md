# Architecture Documentation

## Overview

Tool Connect Craft is a modern, cloud-native connector hub built with a React frontend and Supabase backend. The architecture prioritizes security, scalability, and developer experience.

## System Architecture

### High-Level Design

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │  Browser   │  │  Mobile    │  │   CLI      │  (Future)       │
│  └────────────┘  └────────────┘  └────────────┘                 │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTPS / WebSocket
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Frontend (React SPA)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Presentation Layer                                       │   │
│  │    ├── Pages (Landing, Auth, Connectors, Dashboard)      │   │
│  │    ├── Components (UI, Layout, Connectors)               │   │
│  │    └── Routing (React Router)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  State Management Layer                                   │   │
│  │    ├── Context (Auth, Connector)                          │   │
│  │    ├── Hooks (useConnectorData, useAuth)                 │   │
│  │    └── React Query (Caching, Invalidation)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────────┘
                          │ Supabase Client SDK
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Supabase Platform                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth       │  │  PostgreSQL  │  │  Realtime    │          │
│  │   Service    │  │   Database   │  │   Server     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Storage     │  │  Edge Fns    │  │    Vault     │  (Future)│
│  │  (Future)    │  │  (Future)    │  │  (Secrets)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────┬────────────────────────────────────────┘
                          │ API Calls / OAuth
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                   External Services Layer                         │
│    [GitHub] [Slack] [Linear] [Notion] [MCP Servers] [...]       │
└──────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Architecture

#### Component Hierarchy

```
App
├── Router (BrowserRouter)
├── AuthProvider
│   └── ConnectorProvider
│       └── QueryClientProvider
│           ├── LandingPage
│           ├── AuthPage
│           ├── ProtectedRoute
│           │   ├── ConnectorsPage
│           │   ├── ConnectorDetailPage
│           │   ├── DashboardPage
│           │   └── SecuritySettingsPage
│           └── NotFoundPage
```

#### State Management

**Context API**:
- `AuthContext`: User authentication state, sign in/up/out methods
- `ConnectorContext`: Connectors, connections, jobs, events, logs

**React Query**: Cache management and server state synchronization

**Supabase Realtime**: WebSocket subscriptions for live updates

#### Key Hooks

- `useAuth()`: Access authentication state and methods
- `useConnectors()`: Access connector data and actions
- `useConnectorData()`: Main data fetching logic with realtime subscriptions
- `useToast()`: Toast notifications

### 2. Backend Architecture (Supabase)

#### Database Schema

**Core Tables**:

1. **connectors**
   - Metadata for available service integrations
   - OAuth configuration (clientId, authUrl, tokenUrl, scopes)
   - MCP server URLs
   - Active/inactive status

2. **connector_tools**
   - Tool definitions per connector
   - JSON schema for parameters
   - Source type (MCP vs REST)

3. **user_connections**
   - User-specific instances of connectors
   - Connection status (pending, active, expired, revoked)
   - Secret references (stored in Vault, not in DB)
   - OAuth scopes and expiration

4. **oauth_transactions**
   - PKCE flow state management
   - State parameter and code verifier hash
   - Transaction status and timestamps

5. **pipeline_jobs**
   - Background job execution
   - Status tracking (queued → running → succeeded/failed)
   - Input parameters and output results
   - Error messages and timestamps

6. **pipeline_events**
   - Real-time progress events for jobs
   - Severity levels (info, warn, error)
   - Structured event data

7. **action_logs**
   - Audit trail for all API interactions
   - Request/response payloads
   - Latency metrics
   - Success/error status

**Enums**:
- `auth_type`: oauth, api_key, none
- `tool_source`: mcp, rest
- `connection_status`: pending, active, expired, revoked, error
- `job_status`: queued, running, succeeded, failed, canceled
- `event_level`: info, warn, error
- `oauth_transaction_status`: started, completed, failed

#### Row-Level Security (RLS)

All tables have RLS enabled with policies:

- **connectors**: Readable by all authenticated users (where is_active=true)
- **connector_tools**: Readable by authenticated users for active connectors
- **user_connections**: Full CRUD only for own connections (auth.uid() = user_id)
- **oauth_transactions**: Full access only to own transactions
- **pipeline_jobs**: View/create/update only own jobs
- **pipeline_events**: View/create events for own jobs
- **action_logs**: View/create only own logs

#### Realtime Subscriptions

Enabled on:
- `pipeline_jobs`: Job status updates
- `pipeline_events`: Progress streaming
- `user_connections`: Connection status changes

## Design Decisions

### 1. Why Supabase?

**Pros**:
- PostgreSQL with full SQL capabilities
- Built-in authentication (OAuth, email/password)
- Row-Level Security for data isolation
- Realtime subscriptions via WebSocket
- Edge functions for serverless compute (roadmap)
- Generous free tier for MVP

**Cons**:
- Vendor lock-in (mitigated by using standard PostgreSQL)
- Limited customization of auth flow
- No built-in secret management (using Vault separately)

### 2. React + TypeScript

**Benefits**:
- Type safety reduces runtime errors
- Excellent developer experience with IntelliSense
- Large ecosystem and community
- Easy to test and refactor

**Trade-offs**:
- Build step required (handled by Vite)
- Learning curve for TypeScript

### 3. Context API vs Redux

Chose Context API because:
- Simpler for current scale
- Sufficient for global state needs
- React Query handles server state
- Less boilerplate than Redux

Will migrate to Redux Toolkit if:
- State becomes too complex
- Need for middleware (saga, thunk)
- Performance issues with Context re-renders

### 4. Monorepo vs Separate Repos

Current: Monorepo with frontend only

**Future considerations**:
- Extract backend as separate service
- Use Nx or Turborepo for multi-package management
- Shared types package
- CLI package

## Security Architecture

### Authentication Flow

1. User enters email/password
2. Supabase Auth validates credentials
3. JWT token issued with user ID
4. Token stored in localStorage (httpOnly cookies in future)
5. All API requests include Authorization header
6. RLS policies validate user_id from JWT

### OAuth 2.0 Flow (PKCE)

```
1. User clicks "Connect" on OAuth service
2. Generate code_verifier and state
3. Store transaction in oauth_transactions table
4. Redirect to service's authorization URL
5. User authorizes app
6. Service redirects back with code + state
7. Verify state matches transaction
8. Exchange code for tokens using code_verifier
9. Store access_token and refresh_token in Vault
10. Create user_connection with secret references
11. Mark transaction as completed
```

### Secret Management

**Current** (MVP):
- Secrets stored as references in `secret_ref_access` fields
- Actual tokens stored separately (manual process)

**Roadmap**:
- Integrate Supabase Vault for encrypted storage
- Automatic token refresh
- Secret rotation policies

### Rate Limiting

**Current**: Not implemented (trust-based)

**Roadmap**:
- Per-user rate limits (PostgreSQL function)
- Per-connector rate limits
- Token bucket algorithm
- Exponential backoff on failures

## Data Flow

### Tool Execution Flow

```
1. User selects tool and provides parameters
2. Frontend calls executeTool(connectorSlug, toolName, args)
3. Create pipeline_job record (status: queued)
4. Insert initial pipeline_event
5. (Simulated) Job processor picks up job
6. Update job status to 'running'
7. Insert progress events
8. Call external service API
9. Update job with result (status: succeeded/failed)
10. Insert final event
11. Create action_log entry
12. Realtime subscription notifies frontend
13. UI updates job status in dashboard
```

### Realtime Data Synchronization

```
Component Mount
    ↓
  useConnectorData() hook
    ↓
  Initial data fetch (REST)
    ├── fetchConnectors()
    ├── fetchTools()
    ├── fetchConnections()
    ├── fetchJobs()
    └── fetchLogs()
    ↓
  Set up Supabase subscriptions
    ├── jobs-changes channel
    ├── connections-changes channel
    └── events-changes channel
    ↓
  Update local state on events
    ├── INSERT → add to array
    ├── UPDATE → merge changes
    └── DELETE → remove from array
    ↓
  Re-render components with new data
```

## Scalability Considerations

### Current Limitations

- Single PostgreSQL instance (Supabase managed)
- No caching layer (relies on React Query)
- Simulated job processing (not async workers)
- No load balancing

### Scaling Strategy

**Horizontal Scaling**:
1. Add read replicas for database
2. CDN for static assets
3. Edge functions for API layer
4. Message queue for job processing (BullMQ, AWS SQS)

**Vertical Scaling**:
1. Upgrade Supabase plan (more connections)
2. Optimize database queries (indexes, materialized views)
3. Implement caching (Redis)

**Sharding** (if needed):
- Shard by user_id for user_connections, jobs, logs
- Keep connectors global

## Performance Optimization

### Current Optimizations

- Database indexes on foreign keys and filters
- React Query caching (5 minutes default)
- Lazy loading of components (React.lazy)
- Optimistic updates for mutations
- Debouncing search inputs

### Roadmap Optimizations

- Code splitting per route
- Image optimization (WebP, lazy loading)
- Service Worker for offline support
- GraphQL layer (reduce overfetching)
- Virtual scrolling for large lists

## Monitoring & Observability

### Current State

- Browser console logs
- Supabase dashboard for database metrics
- Basic error boundaries in React

### Planned Additions

- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- User analytics (PostHog, Mixpanel)
- Structured logging (Winston, Pino)
- APM (Application Performance Monitoring)
- Distributed tracing for job execution

## Testing Strategy

### Current Coverage

- No automated tests (MVP)
- Manual testing via UI

### Planned Testing

**Unit Tests**:
- Utility functions (lib/utils.ts)
- Custom hooks (with React Testing Library)
- Context providers

**Integration Tests**:
- API interactions with Supabase
- OAuth flow (mock external services)
- Job execution pipeline

**E2E Tests**:
- User authentication flow
- Connector connection flow
- Tool execution flow

**Test Infrastructure**:
- Vitest for unit tests
- Playwright for E2E tests
- Mock Service Worker (MSW) for API mocking

## Deployment Architecture

### Current Deployment

- Frontend: Static hosting (Lovable, Vercel, Netlify)
- Backend: Supabase Cloud (managed)

### Production Deployment (Roadmap)

```
┌─────────────────────────────────────────┐
│             CloudFlare CDN              │
│         (Static Assets + Cache)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Vercel / Netlify               │
│       (React SPA Hosting)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Supabase Cloud                 │
│    (Auth, Database, Realtime)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       External Job Processor            │
│   (AWS Lambda / Cloud Run)              │
│   - Long-running tasks                  │
│   - Rate limiting enforcement           │
│   - Circuit breaker                     │
└─────────────────────────────────────────┘
```

## API Documentation

### Client SDK Usage

```typescript
import { supabase } from '@/integrations/supabase/client';

// Fetch connectors
const { data: connectors } = await supabase
  .from('connectors')
  .select('*')
  .eq('is_active', true);

// Create job
const { data: job } = await supabase
  .from('pipeline_jobs')
  .insert({
    user_id: user.id,
    connector_id: connector.id,
    type: 'tool_execution',
    status: 'queued',
    input: { toolName: 'example', args: {} },
  })
  .select()
  .single();

// Subscribe to job updates
const channel = supabase
  .channel('job-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pipeline_jobs',
    filter: `id=eq.${job.id}`,
  }, (payload) => {
    console.log('Job updated:', payload.new);
  })
  .subscribe();
```

## Future Architecture Considerations

### MCP Server Integration

- Direct WebSocket connection to MCP servers
- Server discovery mechanism
- Protocol version negotiation
- Streaming responses

### Multi-Tenant Architecture

- Organization/team accounts
- Shared connectors per org
- Usage quotas per organization
- Billing integration

### AI Agent Integration

- Claude, GPT-4 as first-class actors
- Tool calling via MCP protocol
- Conversation history storage
- Context window management

## References

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
