# API Documentation

## Overview

Tool Connect Craft uses Supabase as its backend, providing a PostgreSQL database with REST API, Realtime subscriptions, and authentication.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [REST API](#rest-api)
3. [Realtime Subscriptions](#realtime-subscriptions)
4. [Authentication](#authentication)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Database Schema

### Tables

#### connectors

Available service integrations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Display name (e.g., "GitHub") |
| `slug` | TEXT | URL-friendly identifier (e.g., "github") |
| `description` | TEXT | Service description |
| `category` | TEXT | Category (e.g., "Development") |
| `icon_url` | TEXT | Icon image URL |
| `auth_type` | ENUM | 'oauth', 'api_key', or 'none' |
| `oauth_provider` | TEXT | OAuth provider name |
| `oauth_scopes` | TEXT[] | Required OAuth scopes |
| `oauth_config` | JSONB | OAuth configuration (authUrl, tokenUrl, etc.) |
| `mcp_server_url` | TEXT | MCP server endpoint |
| `is_active` | BOOLEAN | Whether connector is available |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes**: `slug` (unique)

**RLS Policy**: Readable by all authenticated users where `is_active = true`

#### connector_tools

Operations available per connector.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `connector_id` | UUID | Foreign key to connectors |
| `name` | TEXT | Tool name (e.g., "create_issue") |
| `description` | TEXT | Tool description |
| `schema` | JSONB | JSON Schema for parameters |
| `source` | ENUM | 'mcp' or 'rest' |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes**: `connector_id`

**RLS Policy**: Readable by authenticated users for active connectors

#### user_connections

User-specific connector instances.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `connector_id` | UUID | Foreign key to connectors |
| `status` | ENUM | 'pending', 'active', 'expired', 'revoked', 'error' |
| `secret_ref_access` | TEXT | Reference to access token |
| `secret_ref_refresh` | TEXT | Reference to refresh token |
| `expires_at` | TIMESTAMPTZ | Token expiration |
| `scopes` | TEXT[] | Granted OAuth scopes |
| `last_used_at` | TIMESTAMPTZ | Last usage timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes**: `user_id`, `connector_id`, unique `(user_id, connector_id)`

**RLS Policy**: Users can only CRUD their own connections

#### oauth_transactions

OAuth PKCE flow state tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `connector_id` | UUID | Foreign key to connectors |
| `state` | TEXT | OAuth state parameter (unique) |
| `code_verifier_hash` | TEXT | PKCE code verifier hash |
| `redirect_uri` | TEXT | OAuth redirect URI |
| `status` | ENUM | 'started', 'completed', 'failed' |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `completed_at` | TIMESTAMPTZ | Completion timestamp |

**Indexes**: `state` (unique)

**RLS Policy**: Users can only access their own transactions

#### pipeline_jobs

Background task execution tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `connector_id` | UUID | Foreign key to connectors |
| `type` | TEXT | Job type (e.g., "tool_execution") |
| `status` | ENUM | 'queued', 'running', 'succeeded', 'failed', 'canceled' |
| `input` | JSONB | Job input parameters |
| `output` | JSONB | Job result |
| `error` | TEXT | Error message (if failed) |
| `started_at` | TIMESTAMPTZ | Start timestamp |
| `finished_at` | TIMESTAMPTZ | Finish timestamp |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes**: `user_id`, `status`

**RLS Policy**: Users can only view/create/update their own jobs

#### pipeline_events

Real-time job progress events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `job_id` | UUID | Foreign key to pipeline_jobs |
| `ts` | TIMESTAMPTZ | Event timestamp |
| `level` | ENUM | 'info', 'warn', 'error' |
| `message` | TEXT | Event message |
| `data` | JSONB | Additional event data |

**Indexes**: `job_id`

**RLS Policy**: Users can view events for their own jobs

#### action_logs

Audit trail for API interactions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `connector_id` | UUID | Foreign key to connectors |
| `tool_name` | TEXT | Executed tool name |
| `request` | JSONB | Request payload |
| `response` | JSONB | Response payload |
| `status` | TEXT | 'success' or 'error' |
| `error` | TEXT | Error message (if failed) |
| `latency_ms` | INTEGER | Request latency in milliseconds |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes**: `user_id`

**RLS Policy**: Users can only view/create their own logs

### Enums

```sql
CREATE TYPE auth_type AS ENUM ('oauth', 'api_key', 'none');
CREATE TYPE tool_source AS ENUM ('mcp', 'rest');
CREATE TYPE connection_status AS ENUM ('pending', 'active', 'expired', 'revoked', 'error');
CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
CREATE TYPE event_level AS ENUM ('info', 'warn', 'error');
CREATE TYPE oauth_transaction_status AS ENUM ('started', 'completed', 'failed');
```

---

## REST API

All REST operations use the Supabase JavaScript client.

### Base URL

```
https://your-project.supabase.co/rest/v1/
```

### Authentication

All requests require an Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Connectors

**List all active connectors**
```typescript
const { data, error } = await supabase
  .from('connectors')
  .select('*')
  .eq('is_active', true)
  .order('name');
```

**Get connector by slug**
```typescript
const { data, error } = await supabase
  .from('connectors')
  .select('*')
  .eq('slug', 'github')
  .single();
```

### Connector Tools

**List tools for a connector**
```typescript
const { data, error } = await supabase
  .from('connector_tools')
  .select('*')
  .eq('connector_id', connectorId);
```

### User Connections

**List user's connections**
```typescript
const { data, error } = await supabase
  .from('user_connections')
  .select(`
    *,
    connector:connectors(*)
  `)
  .eq('user_id', userId);
```

**Create connection**
```typescript
const { data, error } = await supabase
  .from('user_connections')
  .insert({
    user_id: userId,
    connector_id: connectorId,
    status: 'active',
  })
  .select()
  .single();
```

**Update connection**
```typescript
const { error } = await supabase
  .from('user_connections')
  .update({ status: 'revoked' })
  .eq('id', connectionId);
```

**Delete connection**
```typescript
const { error } = await supabase
  .from('user_connections')
  .delete()
  .eq('id', connectionId);
```

### Pipeline Jobs

**Create job**
```typescript
const { data, error } = await supabase
  .from('pipeline_jobs')
  .insert({
    user_id: userId,
    connector_id: connectorId,
    type: 'tool_execution',
    status: 'queued',
    input: { toolName: 'example', args: {} },
  })
  .select()
  .single();
```

**List user's jobs**
```typescript
const { data, error } = await supabase
  .from('pipeline_jobs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

**Get job by ID**
```typescript
const { data, error } = await supabase
  .from('pipeline_jobs')
  .select('*')
  .eq('id', jobId)
  .single();
```

### Pipeline Events

**Get events for job**
```typescript
const { data, error } = await supabase
  .from('pipeline_events')
  .select('*')
  .eq('job_id', jobId)
  .order('ts', { ascending: true });
```

**Create event**
```typescript
const { error } = await supabase
  .from('pipeline_events')
  .insert({
    job_id: jobId,
    level: 'info',
    message: 'Processing...',
  });
```

### Action Logs

**List user's logs**
```typescript
const { data, error } = await supabase
  .from('action_logs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(100);
```

---

## Realtime Subscriptions

Subscribe to database changes in real-time.

### Job Status Updates

```typescript
const channel = supabase
  .channel('job-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pipeline_jobs',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('Job updated:', payload.new);
    // Update UI with new job status
  })
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

### Connection Status Changes

```typescript
const channel = supabase
  .channel('connection-updates')
  .on('postgres_changes', {
    event: '*', // All events (INSERT, UPDATE, DELETE)
    schema: 'public',
    table: 'user_connections',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('Connection changed:', payload);
  })
  .subscribe();
```

### Pipeline Events

```typescript
const channel = supabase
  .channel('pipeline-events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'pipeline_events',
  }, (payload) => {
    const event = payload.new;
    console.log('New event:', event.message);
  })
  .subscribe();
```

---

## Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword',
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Session

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

### Auth State Changes

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('User signed in', session?.user);
    }
    if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  }
);

// Cleanup
subscription.unsubscribe();
```

---

## Type Definitions

### TypeScript Types

Generated from database schema:

```typescript
// Generated types (src/integrations/supabase/types.ts)
export type Database = {
  public: {
    Tables: {
      connectors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: string | null;
          icon_url: string | null;
          auth_type: 'oauth' | 'api_key' | 'none';
          oauth_provider: string | null;
          oauth_scopes: string[] | null;
          oauth_config: Record<string, unknown> | null;
          mcp_server_url: string | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      // ... other tables
    };
  };
};
```

### Domain Types

Application-specific types (src/types/connector.ts):

```typescript
export interface Connector {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  iconUrl: string;
  authType: AuthType;
  oauthProvider?: string;
  oauthScopes?: string[];
  oauthConfig?: OAuthConfig;
  mcpServerUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ConnectorWithConnection extends Connector {
  connection?: UserConnection;
  tools?: ConnectorTool[];
}
```

---

## Error Handling

### Supabase Errors

```typescript
const { data, error } = await supabase
  .from('connectors')
  .select('*');

if (error) {
  console.error('Database error:', error.message);
  // Handle error (show toast, log, etc.)
}
```

### Common Error Codes

- `PGRST116`: No rows returned (404)
- `23505`: Unique constraint violation
- `23503`: Foreign key violation
- `42501`: Permission denied (RLS policy)

### Error Response Format

```typescript
{
  message: string;
  details: string | null;
  hint: string | null;
  code: string;
}
```

---

## Examples

### Complete Flow: Execute a Tool

```typescript
import { supabase } from '@/integrations/supabase/client';

async function executeTool(
  userId: string,
  connectorSlug: string,
  toolName: string,
  args: Record<string, unknown>
) {
  // 1. Get connector
  const { data: connector, error: connectorError } = await supabase
    .from('connectors')
    .select('*')
    .eq('slug', connectorSlug)
    .single();

  if (connectorError) throw connectorError;

  // 2. Create job
  const { data: job, error: jobError } = await supabase
    .from('pipeline_jobs')
    .insert({
      user_id: userId,
      connector_id: connector.id,
      type: 'tool_execution',
      status: 'queued',
      input: { toolName, args },
    })
    .select()
    .single();

  if (jobError) throw jobError;

  // 3. Add initial event
  await supabase
    .from('pipeline_events')
    .insert({
      job_id: job.id,
      level: 'info',
      message: `Starting ${toolName}`,
    });

  // 4. Subscribe to job updates
  const channel = supabase
    .channel(`job-${job.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'pipeline_jobs',
      filter: `id=eq.${job.id}`,
    }, (payload) => {
      const updatedJob = payload.new;
      console.log('Job status:', updatedJob.status);
    })
    .subscribe();

  return { job, channel };
}
```

### Cleanup Subscription

```typescript
function cleanup(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
```

---

## Rate Limits

**Current**: No rate limiting implemented (trust-based)

**Planned (v0.4)**:
- 100 requests/minute per user
- 10 requests/second per connector
- Burst allowance: 20 requests

---

## API Versioning

Currently using Supabase's default versioning (`/rest/v1/`).

Future API changes will follow semantic versioning with deprecation notices.

---

## Support

For API questions:
- GitHub Issues
- GitHub Discussions
- Email: api@toolconnectcraft.dev

---

**Last Updated**: December 29, 2024
