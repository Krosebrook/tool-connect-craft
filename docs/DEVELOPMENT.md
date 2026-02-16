# Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Component Development](#component-development)
5. [State Management](#state-management)
6. [Database Operations](#database-operations)
7. [Edge Functions](#edge-functions)
8. [Testing](#testing)
9. [Debugging](#debugging)
10. [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Git
- VS Code (recommended)
- Supabase account (free tier)

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/Krosebrook/tool-connect-craft.git
   cd tool-connect-craft
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Database Setup**
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173`

### Recommended VS Code Extensions

- ESLint
- Tailwind CSS IntelliSense
- Error Lens
- GitLens

---

## Project Structure

```
tool-connect-craft/
├── public/                     # Static assets, PWA icons, service worker
│   ├── icons/                  # PWA icon set (72–512px)
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── connectors/         # ConnectorCard, OAuthConnectorCard, JobCard, ToolExecutor
│   │   ├── dashboard/          # TokenExpiryBanner
│   │   ├── health/             # HealthCheckDashboard
│   │   ├── layout/             # Layout (sidebar + content shell)
│   │   ├── webhooks/           # WebhookFormDialog, DeliveryStatsChart,
│   │   │                         TestWebhookButton, WebhookDeliveryHistory
│   │   ├── ui/                 # 50+ shadcn/ui primitives
│   │   ├── ErrorBoundary.tsx
│   │   └── NavLink.tsx
│   │
│   ├── context/
│   │   └── ConnectorContext.tsx # Connector state + realtime subscriptions
│   │
│   ├── hooks/
│   │   ├── useConnectorData.ts # Core data fetching & mutations
│   │   ├── useOAuthFlow.ts     # OAuth PKCE initiation
│   │   ├── useHealthAlerts.ts  # Health monitoring alerts
│   │   ├── useHealthNotifications.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts           # Auto-generated Supabase client
│   │   └── types.ts            # Auto-generated database types
│   │
│   ├── lib/
│   │   ├── config.ts           # Centralized config & feature flags
│   │   ├── formatters.ts       # Date, number, byte formatting
│   │   ├── validation.ts       # Zod schemas & validators
│   │   ├── service-worker.ts   # SW registration
│   │   └── utils.ts            # cn() utility
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ConnectorsPage.tsx
│   │   ├── ConnectorDetailPage.tsx
│   │   ├── ConnectionsPage.tsx
│   │   ├── WebhooksPage.tsx
│   │   ├── SchedulerPage.tsx
│   │   ├── SecuritySettingsPage.tsx
│   │   ├── NotificationPreferencesPage.tsx
│   │   └── NotFound.tsx
│   │
│   ├── types/
│   │   ├── connector.ts        # Domain type definitions
│   │   ├── seed-data.ts        # Sample connector data
│   │   └── index.ts
│   │
│   ├── test/
│   │   └── setup.ts            # Vitest global setup
│   │
│   ├── App.tsx                 # Route definitions + lazy loading
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + design tokens
│
├── supabase/
│   ├── config.toml             # Supabase project config
│   └── functions/
│       ├── execute-tool/       # Tool execution engine
│       ├── health-check/       # Connector health monitoring
│       ├── oauth-start/        # OAuth PKCE initiation
│       ├── oauth-callback/     # OAuth token exchange
│       ├── token-refresh/      # Automatic token renewal
│       ├── send-webhook/       # Webhook delivery + retries
│       ├── test-webhook/       # Webhook endpoint testing
│       ├── retry-webhook/      # Manual delivery retry
│       └── send-health-alert/  # Email alerts via Resend
│
├── docs/                       # Project documentation
├── .github/                    # CI workflows, issue/PR templates
├── vitest.config.ts
├── tailwind.config.ts
├── vite.config.ts
└── lighthouserc.json           # Lighthouse CI config
```

---

## Coding Standards

### TypeScript

- **Always use TypeScript** — no `.js` or `.jsx` files
- **Strict mode** enabled in `tsconfig.json`
- **Avoid `any`** — use `unknown` if type is truly unknown
- **Use explicit return types** for exported functions

```typescript
// Good
interface UserProfile {
  id: string;
  email: string;
}

function fetchUser(id: string): Promise<UserProfile> {
  return supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => data!);
}
```

### React

- Functional components only — no class components
- Named exports preferred
- Destructure props in function signature
- Props interfaces named with `Props` suffix

```typescript
interface ConnectorCardProps {
  connector: Connector;
  onConnect: (id: string) => void;
}

export function ConnectorCard({ connector, onConnect }: ConnectorCardProps) {
  // ...
}
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ConnectorCard.tsx` |
| Hooks | camelCase + `use` prefix | `useConnectorData.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `Connector`, `UserConnection` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Files | Match export name | `ConnectorCard.tsx` → `ConnectorCard` |

### Styling

- **Tailwind CSS first** — use utility classes
- **shadcn/ui components** for consistent UI
- Use `cn()` from `@/lib/utils` for conditional classes
- Use semantic design tokens from `index.css` (e.g., `bg-primary`, `text-muted-foreground`)
- Avoid custom CSS unless absolutely necessary

---

## Component Development

### Creating a New Component

1. Create the file in the appropriate directory
2. Define a props interface
3. Implement using shadcn/ui primitives and Tailwind
4. Export as a named export

```typescript
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'active' | 'expired' | 'error';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={status === 'active' ? 'default' : 'destructive'}
      className={cn('capitalize', className)}
    >
      {status}
    </Badge>
  );
}
```

---

## State Management

### Context API

`ConnectorContext` provides global access to connectors, connections, jobs, and events with realtime subscriptions.

### TanStack React Query

Used for server state with these defaults:
- **Stale time**: 5 minutes
- **GC time**: 30 minutes

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useConnectors() {
  return useQuery({
    queryKey: ['connectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connectors')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });
}
```

---

## Database Operations

### 11 Core Tables

| Table | Purpose |
|-------|---------|
| `connectors` | Service registry (GitHub, Slack, etc.) |
| `connector_tools` | Operations available per connector |
| `user_connections` | Per-user connection state + encrypted tokens |
| `oauth_transactions` | PKCE state tracking |
| `pipeline_jobs` | Async job execution records |
| `pipeline_events` | Streaming execution logs |
| `action_logs` | Audit trail with latency metrics |
| `webhooks` | User-defined webhook endpoints |
| `webhook_deliveries` | Delivery attempts + response tracking |
| `scheduler_jobs` | Cron job configuration |
| `notification_preferences` | Per-user notification settings |

### Row-Level Security

All tables enforce RLS. Users can only access their own data:

```sql
CREATE POLICY "Users can view own connections"
ON user_connections FOR SELECT
USING (auth.uid() = user_id);
```

---

## Edge Functions

### Available Functions

| Function | Purpose | Trigger |
|----------|---------|---------|
| `execute-tool` | Run connector tools, manage job lifecycle | User action |
| `oauth-start` | Generate PKCE challenge + authorization URL | User action |
| `oauth-callback` | Exchange code for tokens, AES-GCM encrypt | OAuth redirect |
| `token-refresh` | Renew expired OAuth tokens | pg_cron (5 min) |
| `health-check` | Monitor connector availability | pg_cron / manual |
| `send-webhook` | Deliver webhooks with HMAC-SHA256 signatures | Event trigger |
| `test-webhook` | Send test payload to webhook endpoint | User action |
| `retry-webhook` | Retry failed webhook deliveries | User action |
| `send-health-alert` | Email critical health alerts via Resend | Health check |

### Writing Edge Functions

Edge Functions use Deno. Place them in `supabase/functions/<name>/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { tool_name, arguments: args } = await req.json();
  // ... implementation
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

---

## Testing

### Framework

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **jsdom** environment

### Running Tests

```bash
npm run test          # Run all tests
npx vitest run        # Single run
npx vitest --coverage # With coverage
```

### Test File Locations

- `src/hooks/__tests__/useConnectorData.test.ts`
- `src/lib/__tests__/formatters.test.ts`
- `src/lib/__tests__/validation.test.ts`

### CI Pipeline

GitHub Actions runs on every PR:
1. ESLint linting
2. TypeScript type checking
3. Security audit (`npm audit`)
4. Vitest test suite
5. Production build validation
6. Lighthouse performance audit

---

## Debugging

### Console Logging

Use structured log prefixes:
```typescript
console.error('[useConnectorData]', error);
console.warn('[TokenRefresh]', 'Token expires in 5 minutes');
```

### Common Issues

| Problem | Solution |
|---------|----------|
| Blank page after deploy | Check `.env` variables are set |
| RLS policy errors | Verify `auth.uid()` matches `user_id` column |
| Realtime not updating | Ensure table has `ALTER PUBLICATION supabase_realtime ADD TABLE` |
| Edge Function 500 | Check function logs in Supabase dashboard |
| OAuth callback fails | Verify redirect URI matches Supabase auth config |

---

## Common Tasks

### Add a New Connector

1. Insert a row into `connectors` table
2. Add tools to `connector_tools` with JSON schemas
3. Configure OAuth if needed (`oauth_config`, `oauth_scopes`)

### Add a New Page

1. Create `src/pages/MyPage.tsx`
2. Add lazy import in `App.tsx`:
   ```typescript
   const MyPage = lazy(() => import('./pages/MyPage'));
   ```
3. Add route in the router config
4. Add navigation link in `Layout.tsx`

### Add a New Edge Function

1. Create `supabase/functions/my-function/index.ts`
2. Add `deno.json` if needed for import maps
3. Deploy: functions deploy automatically on push

---

**Last Updated**: February 2026
