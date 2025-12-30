# API Reference

This document provides a comprehensive reference for the Tool Connect Craft frontend API, including React hooks, context providers, and utility functions.

---

## Table of Contents

- [Context APIs](#context-apis)
  - [AuthContext](#authcontext)
  - [ConnectorContext](#connectorcontext)
- [Custom Hooks](#custom-hooks)
  - [useAuth](#useauth)
  - [useConnectors](#useconnectors)
  - [useConnectorData](#useconnectordata)
  - [useToast](#usetoast)
- [Configuration](#configuration)
- [Types](#types)

---

## Context APIs

### AuthContext

Authentication context that manages user session state and provides authentication methods.

**Provider**: `<AuthProvider>`

**Location**: `src/context/AuthContext.tsx`

#### Properties

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current authenticated user or null |
| `session` | `Session \| null` | Current session object or null |
| `loading` | `boolean` | True while checking authentication status |
| `signIn` | Function | Sign in with email and password |
| `signUp` | Function | Create new account |
| `signOut` | Function | Sign out current user |

#### Example Usage

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <button onClick={() => signIn('email@example.com', 'password')}>
      Sign In
    </button>;
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

---

### ConnectorContext

Manages connector catalog, user connections, jobs, and provides methods for connector operations.

**Provider**: `<ConnectorProvider>`

**Location**: `src/context/ConnectorContext.tsx`

#### Properties

```typescript
interface ConnectorContextType {
  connectors: DbConnector[];
  tools: Map<string, DbConnectorTool[]>;
  connections: DbUserConnection[];
  jobs: DbPipelineJob[];
  events: Map<string, DbPipelineEvent[]>;
  logs: DbActionLog[];
  loading: boolean;
  
  getConnectorWithConnection: (slug: string) => ConnectorWithConnection | undefined;
  getToolsForConnector: (connectorId: string) => DbConnectorTool[];
  connect: (connectorId: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  executeTool: (connectorSlug: string, toolName: string, args: Record<string, unknown>) => Promise<DbPipelineJob>;
  fetchEventsForJob: (jobId: string) => Promise<void>;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `connectors` | `DbConnector[]` | List of all available connectors |
| `tools` | `Map<string, DbConnectorTool[]>` | Tools mapped by connector ID |
| `connections` | `DbUserConnection[]` | User's active connections |
| `jobs` | `DbPipelineJob[]` | User's pipeline jobs |
| `events` | `Map<string, DbPipelineEvent[]>` | Events mapped by job ID |
| `logs` | `DbActionLog[]` | User's action logs |
| `loading` | `boolean` | True while loading initial data |

#### Methods

**`getConnectorWithConnection(slug: string)`**

Get a connector with its connection status and tools.

```typescript
const connector = getConnectorWithConnection('github');
// Returns: { ...connector, connection?, tools[] }
```

**`connect(connectorId: string)`**

Initiate connection to a service.

```typescript
await connect('conn-github');
// Triggers OAuth flow or connection creation
```

**`disconnect(connectionId: string)`**

Revoke a connection.

```typescript
await disconnect(connection.id);
// Sets connection status to 'revoked'
```

**`executeTool(connectorSlug, toolName, args)`**

Execute a tool on a connector.

```typescript
const job = await executeTool('github', 'list_repositories', {
  visibility: 'public',
  per_page: 10
});
// Returns created job, updates stream via WebSocket
```

#### Example Usage

```typescript
import { useConnectors } from '@/context/ConnectorContext';

function ConnectorList() {
  const { connectors, connections, connect, loading } = useConnectors();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {connectors.map(connector => {
        const connection = connections.find(c => c.connector_id === connector.id);
        const isConnected = connection?.status === 'active';

        return (
          <div key={connector.id}>
            <h3>{connector.name}</h3>
            <p>{connector.description}</p>
            {isConnected ? (
              <span>Connected</span>
            ) : (
              <button onClick={() => connect(connector.id)}>Connect</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Custom Hooks

### useAuth

Hook to access authentication context. Wrapper around `useContext(AuthContext)`.

**Location**: `src/context/AuthContext.tsx`

**Usage**: See [AuthContext](#authcontext)

**Throws**: Error if used outside `<AuthProvider>`

---

### useConnectors

Hook to access connector context. Wrapper around `useContext(ConnectorContext)`.

**Location**: `src/context/ConnectorContext.tsx`

**Usage**: See [ConnectorContext](#connectorcontext)

**Throws**: Error if used outside `<ConnectorProvider>`

---

### useConnectorData

Internal hook that manages connector data fetching and real-time subscriptions.

**Location**: `src/hooks/useConnectorData.ts`

**Note**: This hook is used internally by `ConnectorProvider`. Use `useConnectors()` instead.

---

### useToast

Hook to show toast notifications.

**Location**: `src/hooks/use-toast.ts`

**Usage**:

```typescript
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const showSuccess = () => {
    toast({
      title: 'Success',
      description: 'Operation completed successfully',
    });
  };

  const showError = () => {
    toast({
      title: 'Error',
      description: 'Something went wrong',
      variant: 'destructive',
    });
  };

  return (
    <div>
      <button onClick={showSuccess}>Show Success</button>
      <button onClick={showError}>Show Error</button>
    </div>
  );
}
```

---

## Configuration

Centralized configuration module for environment variables and app settings.

**Location**: `src/lib/config.ts`

### Exports

```typescript
// Supabase configuration
export const supabaseConfig: {
  url: string;
  publishableKey: string;
  projectId: string;
};

// Application configuration
export const appConfig: {
  name: string;
  version: string;
  isDevelopment: boolean;
  isProduction: boolean;
  features: { ... };
  ui: { ... };
  api: { ... };
  jobs: { ... };
};

// Constants
export const CONNECTOR_CATEGORIES;
export const CONNECTION_STATUS_LABELS;
export const JOB_STATUS_LABELS;
export const EVENT_LEVEL_LABELS;
export const ROUTES;
```

### Example Usage

```typescript
import { appConfig, ROUTES } from '@/lib/config';

// Check feature flags
if (appConfig.features.enableOAuth) {
  // OAuth is enabled
}

// Use route constants
navigate(ROUTES.dashboard);
navigate(ROUTES.connectorDetail('github'));

// Access environment
if (appConfig.isDevelopment) {
  console.log('Dev mode');
}
```

---

## Types

Core TypeScript types used throughout the application.

**Location**: `src/types/connector.ts`

### Connector Types

```typescript
// Authentication types
type AuthType = 'oauth' | 'api_key' | 'none';
type ToolSource = 'mcp' | 'rest';

// Status types
type ConnectionStatus = 'pending' | 'active' | 'expired' | 'revoked' | 'error';
type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
type EventLevel = 'info' | 'warn' | 'error';
type OAuthTransactionStatus = 'started' | 'completed' | 'failed';
```

### Data Models

```typescript
interface Connector {
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

interface ConnectorTool {
  id: string;
  connectorId: string;
  name: string;
  description: string;
  schema: ToolSchema;
  source: ToolSource;
  createdAt: string;
}

interface UserConnection {
  id: string;
  userId: string;
  connectorId: string;
  status: ConnectionStatus;
  secretRefAccess?: string;
  secretRefRefresh?: string;
  expiresAt?: string;
  scopes?: string[];
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PipelineJob {
  id: string;
  userId: string;
  connectorId: string;
  toolName: string;
  type: string;
  status: JobStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

interface PipelineEvent {
  id: string;
  jobId: string;
  ts: string;
  level: EventLevel;
  message: string;
  data?: Record<string, unknown>;
}

interface ActionLog {
  id: string;
  userId: string;
  connectorId: string;
  toolName: string;
  request: Record<string, unknown>;
  response?: Record<string, unknown>;
  status: 'success' | 'error';
  error?: string;
  latencyMs: number;
  createdAt: string;
}
```

---

## Supabase Client

Access to the Supabase client instance.

**Location**: `src/integrations/supabase/client.ts`

### Usage

```typescript
import { supabase } from '@/integrations/supabase/client';

// Query data
const { data, error } = await supabase
  .from('connectors')
  .select('*')
  .eq('is_active', true);

// Subscribe to changes
const channel = supabase
  .channel('jobs-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'pipeline_jobs',
  }, (payload) => {
    console.log('New job:', payload.new);
  })
  .subscribe();

// Cleanup
channel.unsubscribe();
```

---

## Error Handling

### ErrorBoundary Component

React Error Boundary for catching and displaying errors.

**Location**: `src/components/ErrorBoundary.tsx`

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// With custom fallback
<ErrorBoundary fallback={<div>Custom error UI</div>}>
  <MyComponent />
</ErrorBoundary>
```

---

## Utilities

### cn (Class Name Utility)

Utility for merging class names with Tailwind CSS.

**Location**: `src/lib/utils.ts`

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  'another-class'
)} />
```

---

## Best Practices

1. **Always use hooks inside functional components**
   ```typescript
   // ✅ Good
   function MyComponent() {
     const { user } = useAuth();
   }

   // ❌ Bad
   const user = useAuth().user; // Outside component
   ```

2. **Check loading states before rendering**
   ```typescript
   const { user, loading } = useAuth();
   if (loading) return <Spinner />;
   ```

3. **Handle errors gracefully**
   ```typescript
   try {
     await connect(connectorId);
   } catch (error) {
     toast({
       title: 'Connection Failed',
       description: error.message,
       variant: 'destructive',
     });
   }
   ```

4. **Use TypeScript types**
   ```typescript
   import type { Connector } from '@/types/connector';
   
   function ConnectorCard({ connector }: { connector: Connector }) {
     // ...
   }
   ```

5. **Unsubscribe from real-time channels**
   ```typescript
   useEffect(() => {
     const channel = supabase.channel('my-channel').subscribe();
     
     return () => {
       channel.unsubscribe();
     };
   }, []);
   ```

---

## Testing

Example tests for components using the API:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/context/AuthContext';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders user data when authenticated', async () => {
    render(
      <AuthProvider>
        <MyComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });
});
```

---

For more examples, see the source code and [CONTRIBUTING.md](../CONTRIBUTING.md).
