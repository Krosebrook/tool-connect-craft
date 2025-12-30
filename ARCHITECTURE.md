# Architecture Documentation

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Authentication & Authorization](#authentication--authorization)
- [Real-time Data Flow](#real-time-data-flow)
- [Pipeline Execution](#pipeline-execution)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Future Architecture Plans](#future-architecture-plans)

---

## System Overview

Tool Connect Craft is a full-stack web application designed as a centralized hub for managing service integrations. The architecture follows a **modern JAMstack approach** with a decoupled frontend and serverless backend.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  React   │  │TypeScript│  │  Vite    │  │Tailwind  │   │
│  │   SPA    │  │   Types  │  │  Build   │  │   CSS    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Platform                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │   Auth   │  │ Realtime │  │  Storage │   │
│  │    DB    │  │  Server  │  │   WSS    │  │   API    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Row Level Security (RLS)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  GitHub  │  │  Slack   │  │  Google  │  │   MCP    │   │
│  │   OAuth  │  │   OAuth  │  │   OAuth  │  │ Servers  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Principles

### 1. **Type Safety First**
- End-to-end TypeScript for compile-time safety
- Database schema generates TypeScript types
- Strict null checks and no implicit any

### 2. **Security by Default**
- Row Level Security (RLS) for all database access
- OAuth PKCE flow for third-party authentication
- Encrypted secret storage
- Comprehensive audit logging

### 3. **Real-time by Design**
- WebSocket-based subscriptions for live updates
- Optimistic UI updates with rollback capability
- Event-driven pipeline execution

### 4. **Separation of Concerns**
- Clear boundaries between UI, business logic, and data
- Context API for global state
- Custom hooks for reusable logic
- Modular component architecture

### 5. **Developer Experience**
- Hot module replacement (HMR) for instant feedback
- Absolute imports with `@/` alias
- Comprehensive error messages
- Self-documenting code with TypeScript

### 6. **Scalability**
- Stateless frontend (can scale horizontally)
- Database-backed state (not in-memory)
- Prepared for edge function deployment
- Connection pooling via Supabase

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework with concurrent features |
| TypeScript | 5.8 | Type safety and developer experience |
| Vite | 5.4 | Build tool with fast HMR |
| React Router | 6.30 | Client-side routing |
| TanStack Query | 5.83 | Server state management & caching |
| Shadcn/ui | - | Accessible component library |
| Radix UI | - | Unstyled accessible primitives |
| Tailwind CSS | 3.4 | Utility-first styling |
| Lucide React | 0.462 | Icon library |

### Backend Stack

| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service |
| PostgreSQL 15 | Relational database |
| PostgREST | Auto-generated REST API |
| Realtime | WebSocket server for subscriptions |
| GoTrue | Authentication server |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| TypeScript Compiler | Type checking |
| Vite Dev Server | Development server |
| npm/bun | Package management |

---

## System Architecture

### Frontend Architecture

```
src/
├── App.tsx                    # Root component, routing setup
├── main.tsx                   # Application entry point
│
├── components/                # React components
│   ├── auth/                  # Authentication components
│   │   └── ProtectedRoute.tsx # Route guard component
│   ├── layout/                # Layout components
│   │   ├── Layout.tsx
│   │   └── Navigation.tsx
│   └── ui/                    # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── context/                   # React Context providers
│   ├── AuthContext.tsx        # Auth state & methods
│   └── ConnectorContext.tsx   # Connector data & actions
│
├── hooks/                     # Custom React hooks
│   ├── useConnectorData.ts    # Data fetching & real-time
│   └── use-toast.ts           # Toast notifications
│
├── pages/                     # Route components
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   ├── ConnectorsPage.tsx
│   ├── ConnectorDetailPage.tsx
│   ├── DashboardPage.tsx
│   └── SecuritySettingsPage.tsx
│
├── types/                     # TypeScript definitions
│   ├── connector.ts           # Business types
│   └── index.ts
│
├── integrations/              # External integrations
│   └── supabase/
│       ├── client.ts          # Supabase client instance
│       └── types.ts           # Generated DB types
│
└── lib/                       # Utility functions
    └── utils.ts
```

### Component Hierarchy

```
App
├── AuthProvider
│   └── ConnectorProvider
│       └── BrowserRouter
│           └── Routes
│               ├── LandingPage
│               ├── AuthPage
│               └── ProtectedRoute
│                   ├── ConnectorsPage
│                   │   └── ConnectorGrid
│                   │       └── ConnectorCard
│                   ├── ConnectorDetailPage
│                   │   ├── ConnectorHeader
│                   │   ├── ConnectionStatus
│                   │   └── ToolsList
│                   │       └── ToolCard
│                   ├── DashboardPage
│                   │   ├── StatsCards
│                   │   ├── RecentJobs
│                   │   └── ActionLogs
│                   └── SecuritySettingsPage
```

---

## Data Model

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  auth.users  │         │  connectors  │         │connector_    │
│              │         │              │         │tools         │
│ - id         │         │ - id         │◄────────│              │
│ - email      │         │ - name       │         │ - id         │
│ - ...        │         │ - slug       │         │ - connector_ │
└──────┬───────┘         │ - auth_type  │         │   id         │
       │                 │ - oauth_cfg  │         │ - name       │
       │                 │ - ...        │         │ - schema     │
       │                 └──────┬───────┘         └──────────────┘
       │                        │
       │                        │
       ├────────────┬───────────┼───────────┬─────────────┐
       │            │           │           │             │
       ▼            ▼           ▼           ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│user_     │  │oauth_    │  │pipeline_ │  │pipeline_ │  │action_   │
│connectns │  │transactns│  │jobs      │  │events    │  │logs      │
│          │  │          │  │          │  │          │  │          │
│- id      │  │- id      │  │- id      │  │- id      │  │- id      │
│- user_id │  │- user_id │  │- user_id │  │- job_id  │  │- user_id │
│- conn_id │  │- conn_id │  │- conn_id │  │- level   │  │- conn_id │
│- status  │  │- state   │  │- status  │  │- message │  │- tool    │
│- secrets │  │- pkce    │  │- input   │  │- ts      │  │- request │
│- scopes  │  │- status  │  │- output  │  │- data    │  │- response│
│- ...     │  │- ...     │  │- error   │  └──────────┘  │- status  │
└──────────┘  └──────────┘  │- ...     │                │- latency │
                            └──────────┘                └──────────┘
```

### Core Entities

#### **Connectors**
Metadata describing available service integrations.

**Columns:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Display name (e.g., "GitHub")
- `slug` (TEXT) - URL-safe identifier (e.g., "github")
- `description` (TEXT) - User-facing description
- `category` (TEXT) - Grouping (e.g., "Developer Tools")
- `icon_url` (TEXT) - Icon image URL
- `auth_type` (ENUM) - Authentication method: `oauth`, `api_key`, `none`
- `oauth_provider` (TEXT) - OAuth provider name
- `oauth_scopes` (TEXT[]) - Required OAuth scopes
- `oauth_config` (JSONB) - OAuth URLs and configuration
- `mcp_server_url` (TEXT) - MCP server endpoint
- `is_active` (BOOLEAN) - Visibility flag
- `created_at` (TIMESTAMPTZ) - Creation timestamp

#### **Connector Tools**
Callable operations available on each connector.

**Columns:**
- `id` (UUID) - Primary key
- `connector_id` (UUID) - Foreign key to connectors
- `name` (TEXT) - Tool identifier (e.g., "create_issue")
- `description` (TEXT) - What the tool does
- `schema` (JSONB) - JSON Schema for input validation
- `source` (ENUM) - Tool source: `mcp`, `rest`
- `created_at` (TIMESTAMPTZ) - Creation timestamp

#### **User Connections**
User-specific instances of connectors with authentication.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `connector_id` (UUID) - Foreign key to connectors
- `status` (ENUM) - Connection status: `pending`, `active`, `expired`, `revoked`, `error`
- `secret_ref_access` (TEXT) - Reference to access token in vault
- `secret_ref_refresh` (TEXT) - Reference to refresh token in vault
- `expires_at` (TIMESTAMPTZ) - Token expiration
- `scopes` (TEXT[]) - Granted OAuth scopes
- `last_used_at` (TIMESTAMPTZ) - Last tool execution
- `created_at` (TIMESTAMPTZ) - Connection creation
- `updated_at` (TIMESTAMPTZ) - Last modification
- **UNIQUE CONSTRAINT**: `(user_id, connector_id)` - One connection per user per connector

#### **OAuth Transactions**
Tracking OAuth PKCE flows to prevent CSRF and replay attacks.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `connector_id` (UUID) - Foreign key to connectors
- `state` (TEXT) - OAuth state parameter (UNIQUE)
- `code_verifier_hash` (TEXT) - PKCE code verifier hash
- `redirect_uri` (TEXT) - OAuth callback URL
- `status` (ENUM) - Transaction status: `started`, `completed`, `failed`
- `created_at` (TIMESTAMPTZ) - Transaction start
- `completed_at` (TIMESTAMPTZ) - Transaction completion

#### **Pipeline Jobs**
Background job execution for long-running operations.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `connector_id` (UUID) - Foreign key to connectors
- `type` (TEXT) - Job type (e.g., "tool_execution")
- `status` (ENUM) - Job status: `queued`, `running`, `succeeded`, `failed`, `canceled`
- `input` (JSONB) - Job input parameters
- `output` (JSONB) - Job result data
- `error` (TEXT) - Error message if failed
- `started_at` (TIMESTAMPTZ) - Job start time
- `finished_at` (TIMESTAMPTZ) - Job completion time
- `created_at` (TIMESTAMPTZ) - Job creation time

#### **Pipeline Events**
Streaming events emitted during job execution.

**Columns:**
- `id` (UUID) - Primary key
- `job_id` (UUID) - Foreign key to pipeline_jobs
- `ts` (TIMESTAMPTZ) - Event timestamp
- `level` (ENUM) - Event level: `info`, `warn`, `error`
- `message` (TEXT) - Human-readable message
- `data` (JSONB) - Structured event data

#### **Action Logs**
Comprehensive audit trail of all operations.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `connector_id` (UUID) - Foreign key to connectors
- `tool_name` (TEXT) - Tool that was executed
- `request` (JSONB) - Request parameters
- `response` (JSONB) - Response data
- `status` (TEXT) - Outcome: `success`, `error`
- `error` (TEXT) - Error message if failed
- `latency_ms` (INTEGER) - Execution time in milliseconds
- `created_at` (TIMESTAMPTZ) - Log timestamp

---

## Component Architecture

### Context Providers

#### **AuthContext**
Manages authentication state and provides auth methods.

**State:**
- `user: User | null` - Current authenticated user
- `session: Session | null` - Active session
- `loading: boolean` - Initial auth check loading

**Methods:**
- `signIn(email, password)` - Sign in with credentials
- `signUp(email, password)` - Create new account
- `signOut()` - Sign out current user

**Implementation:**
```typescript
useEffect(() => {
  // Listen to auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );
  
  // Check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });
  
  return () => subscription.unsubscribe();
}, []);
```

#### **ConnectorContext**
Provides connector data and actions.

**State:**
- `connectors: Connector[]` - Available connectors
- `connections: UserConnection[]` - User connections
- `jobs: PipelineJob[]` - Recent jobs
- `events: Map<jobId, PipelineEvent[]>` - Job events
- `logs: ActionLog[]` - Recent action logs
- `loading: boolean` - Data loading state

**Methods:**
- `connect(connectorId)` - Create new connection
- `disconnect(connectionId)` - Revoke connection
- `executeTool(slug, toolName, args)` - Execute connector tool
- `fetchEventsForJob(jobId)` - Load job events
- `getConnectorWithConnection(slug)` - Get connector + connection
- `getToolsForConnector(connectorId)` - Get available tools

**Real-time Subscriptions:**
```typescript
useEffect(() => {
  if (!user) return;
  
  // Subscribe to job updates
  const jobsChannel = supabase
    .channel('jobs-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'pipeline_jobs',
      filter: `user_id=eq.${user.id}` 
    }, handleJobChange)
    .subscribe();
    
  // Subscribe to connections
  const connectionsChannel = supabase
    .channel('connections-changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'user_connections',
      filter: `user_id=eq.${user.id}` 
    }, handleConnectionChange)
    .subscribe();
    
  return () => {
    supabase.removeChannel(jobsChannel);
    supabase.removeChannel(connectionsChannel);
  };
}, [user]);
```

### Custom Hooks

#### **useConnectorData**
Centralized data fetching and real-time sync for connectors.

**Features:**
- Fetches all connector data on mount
- Sets up real-time subscriptions
- Provides CRUD operations
- Handles optimistic updates
- Error handling with toast notifications

**Data Flow:**
```
Mount → fetchConnectors() → setConnectors()
     → fetchTools() → setTools()
     → fetchConnections() → setConnections()
     → setupSubscriptions() → real-time updates
```

---

## State Management

### State Architecture

```
┌─────────────────────────────────────────┐
│           Component Tree                │
│  ┌───────────────────────────────────┐  │
│  │      useAuth() Hook               │  │
│  │   ┌─────────────────────────────┐ │  │
│  │   │    AuthContext.Provider     │ │  │
│  │   │  - user                     │ │  │
│  │   │  - session                  │ │  │
│  │   │  - signIn/signUp/signOut   │ │  │
│  │   └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│                    │                     │
│  ┌───────────────────────────────────┐  │
│  │   useConnectors() Hook            │  │
│  │   ┌─────────────────────────────┐ │  │
│  │   │ ConnectorContext.Provider   │ │  │
│  │   │  - connectors               │ │  │
│  │   │  - connections              │ │  │
│  │   │  - jobs                     │ │  │
│  │   │  - events                   │ │  │
│  │   │  - connect/disconnect       │ │  │
│  │   │  - executeTool              │ │  │
│  │   └─────────────────────────────┘ │  │
│  └───────────────────────────────────┘  │
│                    │                     │
│           Page Components                │
│    (consume contexts via hooks)          │
└─────────────────────────────────────────┘
```

### State Categories

1. **Server State** (TanStack Query - not currently used extensively)
   - Could be used for additional API calls
   - Caching and invalidation
   - Background refetching

2. **Global State** (React Context)
   - Authentication state
   - Connector data
   - User connections
   - Pipeline jobs

3. **Local State** (useState)
   - Form inputs
   - UI toggles
   - Temporary selections

4. **URL State** (React Router)
   - Current page
   - Route parameters
   - Query parameters

---

## Authentication & Authorization

### Authentication Flow

```
┌──────────┐    1. signUp()    ┌──────────┐
│  User    │──────────────────▶│ Supabase │
│          │                   │   Auth   │
│          │◀──────────────────│          │
└──────────┘  2. Confirm Email └──────────┘
      │
      │ 3. signIn()
      ▼
┌──────────┐                   ┌──────────┐
│ AuthPage │──────────────────▶│ Supabase │
│          │                   │   Auth   │
│          │◀──────────────────│          │
└──────────┘  4. Session Token └──────────┘
      │
      │ 5. Redirect
      ▼
┌──────────┐
│Protected │ 6. Check session
│  Route   │────────────────▶ Authenticated ✓
└──────────┘
```

### Authorization Model

**Row Level Security (RLS) Policies:**

```sql
-- Users can only see their own connections
CREATE POLICY "Users can view own connections"
  ON user_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
  ON pipeline_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only see their own logs
CREATE POLICY "Users can view own logs"
  ON action_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Public read access to connectors
CREATE POLICY "Anyone can view active connectors"
  ON connectors FOR SELECT
  USING (is_active = true);
```

### OAuth PKCE Flow

```
1. User clicks "Connect to GitHub"
   ↓
2. Generate code_verifier (random string)
   ↓
3. Create code_challenge = SHA256(code_verifier)
   ↓
4. Generate state (CSRF token)
   ↓
5. Store transaction in DB:
   - state
   - code_verifier_hash
   - redirect_uri
   ↓
6. Redirect to OAuth provider:
   /authorize?
     client_id=...
     &redirect_uri=...
     &state=...
     &code_challenge=...
     &code_challenge_method=S256
   ↓
7. User authorizes on provider
   ↓
8. Provider redirects back:
   /callback?code=...&state=...
   ↓
9. Verify state matches
   ↓
10. Exchange code + code_verifier for tokens:
    POST /token
    code=...
    code_verifier=...
    ↓
11. Store tokens in vault
    ↓
12. Update user_connection status = 'active'
    ↓
13. Delete oauth_transaction
```

---

## Real-time Data Flow

### Subscription Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Component     │         │   Supabase      │
│   (Frontend)    │         │   Realtime      │
├─────────────────┤         ├─────────────────┤
│                 │         │                 │
│ useEffect(() => │         │                 │
│   channel =     │─────1───▶ Create Channel │
│     subscribe() │         │                 │
│ }, [])          │         │                 │
│                 │◀────2────│ Confirm Sub    │
│                 │         │                 │
│                 │         │ Database Change │
│                 │         │      Occurs     │
│                 │         │        │        │
│                 │◀────3────│ Push Event     │
│ handleUpdate()  │         │                 │
│   setState()    │         │                 │
│                 │         │                 │
│ return () =>    │         │                 │
│   unsubscribe() │─────4───▶ Close Channel  │
└─────────────────┘         └─────────────────┘
```

### Subscription Setup Example

```typescript
// Subscribe to job status changes
const jobsChannel = supabase
  .channel('jobs-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'pipeline_jobs',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        setJobs(prev => [payload.new as Job, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setJobs(prev => prev.map(j => 
          j.id === payload.new.id ? payload.new as Job : j
        ));
      }
    }
  )
  .subscribe();
```

---

## Pipeline Execution

### Job Lifecycle

```
┌──────────┐
│  QUEUED  │ ◀── Job created
└────┬─────┘
     │
     │ Worker picks up job
     ▼
┌──────────┐
│ RUNNING  │ ◀── Events emitted
└────┬─────┘
     │
     ├──────────┬──────────┐
     │          │          │
     ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│SUCCEEDED │ │  FAILED  │ │CANCELED  │
└──────────┘ └──────────┘ └──────────┘
```

### Job Execution Flow

```typescript
// 1. Create job
const { data: job } = await supabase
  .from('pipeline_jobs')
  .insert({
    user_id: user.id,
    connector_id: connector.id,
    type: 'tool_execution',
    status: 'queued',
    input: { toolName, args }
  })
  .select()
  .single();

// 2. Emit start event
await supabase
  .from('pipeline_events')
  .insert({
    job_id: job.id,
    level: 'info',
    message: 'Starting execution...'
  });

// 3. Execute tool (in edge function or worker)
// ... actual execution logic ...

// 4. Update job status
await supabase
  .from('pipeline_jobs')
  .update({
    status: 'succeeded',
    output: result,
    finished_at: new Date()
  })
  .eq('id', job.id);

// 5. Emit completion event
await supabase
  .from('pipeline_events')
  .insert({
    job_id: job.id,
    level: 'info',
    message: 'Execution completed'
  });

// 6. Create audit log
await supabase
  .from('action_logs')
  .insert({
    user_id: user.id,
    connector_id: connector.id,
    tool_name: toolName,
    request: args,
    response: result,
    status: 'success',
    latency_ms: duration
  });
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────┐
│        Layer 1: Network Security        │
│  - HTTPS only                           │
│  - CORS policies                        │
│  - Rate limiting (planned)              │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    Layer 2: Authentication              │
│  - Supabase Auth                        │
│  - JWT tokens                           │
│  - Session management                   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    Layer 3: Authorization               │
│  - Row Level Security (RLS)             │
│  - User-scoped queries                  │
│  - Role-based access (planned)          │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    Layer 4: Data Security               │
│  - Encrypted secrets (vault)            │
│  - PKCE for OAuth                       │
│  - No plaintext credentials             │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    Layer 5: Audit & Monitoring          │
│  - Action logs                          │
│  - Error tracking                       │
│  - Anomaly detection (planned)          │
└─────────────────────────────────────────┘
```

### Secret Management

**Current Implementation:**
```
User Connection
     │
     ├─── secret_ref_access: "vault://secrets/abc123"
     └─── secret_ref_refresh: "vault://secrets/def456"
                                    │
                                    ▼
                            ┌───────────────┐
                            │ Secret Vault  │
                            │ (Supabase)    │
                            └───────────────┘
```

**Future Implementation:**
```
User Connection
     │
     ├─── secret_ref_access: "vault://secrets/abc123"
     └─── secret_ref_refresh: "vault://secrets/def456"
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ HashiCorp Vault │
                          │  - Encrypted    │
                          │  - Audited      │
                          │  - Rotated      │
                          └─────────────────┘
```

---

## Scalability Considerations

### Current Limitations (MVP)

1. **Simulated job execution** - Jobs don't actually call external APIs
2. **No worker pool** - Job execution is simulated with setTimeout
3. **No rate limiting** - Users can execute unlimited tools
4. **No caching** - Every page load fetches fresh data
5. **Single region** - Deployed in one geographic region

### Scaling Plan

#### **Phase 1: Optimize Frontend**
- Implement TanStack Query for intelligent caching
- Add virtual scrolling for large lists
- Code splitting and lazy loading
- Service worker for offline support

#### **Phase 2: Edge Functions**
- Move job execution to Supabase Edge Functions
- Implement retry logic with exponential backoff
- Add circuit breaker for external services
- Queue-based job processing

#### **Phase 3: Infrastructure**
- Add Redis for caching and rate limiting
- Implement worker pool with Bull/BullMQ
- CDN for static assets
- Multi-region deployment

#### **Phase 4: Monitoring**
- Application Performance Monitoring (APM)
- Real-time alerting
- Log aggregation (ELK stack)
- Distributed tracing

---

## Future Architecture Plans

### Microservices Evolution (Long-term)

```
┌──────────────────────────────────────────────────┐
│               API Gateway                        │
│          (Kong / AWS API Gateway)                │
└──────────────┬───────────────────────────────────┘
               │
    ┌──────────┼──────────┬──────────┬──────────┐
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Auth   │ │Connector│ │Pipeline│ │Webhook │ │Analytics│
│Service │ │Service  │ │Service │ │Service │ │Service  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┘
                         │
                    ┌────┴────┐
                    │ Message │
                    │  Queue  │
                    │ (Kafka) │
                    └─────────┘
```

### Planned Features

1. **Custom Connector Builder**
   - Visual interface for creating connectors
   - No-code tool definition
   - Schema validation UI

2. **Workflow Engine**
   - Visual workflow builder
   - Conditional logic
   - Error handling flows
   - Scheduled execution

3. **Team Features**
   - Organizations
   - Shared connectors
   - Role-based access control
   - Team analytics

4. **Advanced Security**
   - Secret rotation
   - Compliance reporting
   - Security scanning
   - Penetration testing

---

## Conclusion

This architecture provides a solid foundation for an enterprise-grade connector hub. The design prioritizes:

- **Security**: Multiple layers of defense
- **Scalability**: Prepared for horizontal scaling
- **Developer Experience**: Type-safe, well-documented
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new connectors and features

For questions or suggestions about the architecture, please open a GitHub Discussion or contact the maintainers.
