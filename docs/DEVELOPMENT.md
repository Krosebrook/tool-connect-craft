# Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Component Development](#component-development)
5. [State Management](#state-management)
6. [Database Operations](#database-operations)
7. [Adding New Connectors](#adding-new-connectors)
8. [Testing](#testing)
9. [Debugging](#debugging)
10. [Common Tasks](#common-tasks)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Ensure you have:
- Node.js 18+ (LTS recommended)
- npm 9+
- Git
- A code editor (VS Code recommended)
- Supabase account

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
   
   Option A: Using Supabase CLI (recommended)
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   
   # Generate TypeScript types
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```
   
   Option B: Manual via Dashboard
   - Go to Supabase Dashboard → SQL Editor
   - Copy/paste `supabase/migrations/*.sql`
   - Execute the migration

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Visit `http://localhost:5173`

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Error Lens
- GitLens

---

## Project Structure

```
tool-connect-craft/
├── public/                  # Static assets
│   └── favicon.ico
│
├── src/
│   ├── components/          # React components
│   │   ├── auth/            # Authentication related
│   │   │   └── ProtectedRoute.tsx
│   │   ├── connectors/      # Connector UI components
│   │   │   ├── ConnectorCard.tsx
│   │   │   ├── ConnectorList.tsx
│   │   │   └── ToolExecutor.tsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/              # Reusable UI primitives (shadcn)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ...
│   │
│   ├── context/             # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── ConnectorContext.tsx  # Connector data
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useConnectorData.ts
│   │   └── use-toast.ts
│   │
│   ├── integrations/        # External services
│   │   └── supabase/
│   │       ├── client.ts    # Supabase client instance
│   │       └── types.ts     # Generated DB types
│   │
│   ├── lib/                 # Utility functions
│   │   └── utils.ts
│   │
│   ├── pages/               # Route components
│   │   ├── LandingPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── ConnectorsPage.tsx
│   │   ├── ConnectorDetailPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SecuritySettingsPage.tsx
│   │   └── NotFound.tsx
│   │
│   ├── types/               # TypeScript definitions
│   │   ├── connector.ts     # Domain types
│   │   ├── seed-data.ts     # Sample data types
│   │   └── index.ts         # Type exports
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── supabase/
│   ├── config.toml          # Supabase config
│   └── migrations/          # Database migrations
│
├── docs/                    # Documentation
├── .env                     # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── tailwind.config.ts       # Tailwind config
```

---

## Coding Standards

### TypeScript

- **Always use TypeScript** - no `.js` or `.jsx` files
- **Enable strict mode** - already configured in `tsconfig.json`
- **Prefer interfaces over types** for object shapes
  ```typescript
  // Good
  interface User {
    id: string;
    email: string;
  }
  
  // Acceptable for unions/intersections
  type Status = 'active' | 'inactive';
  ```

- **Use explicit return types** for functions
  ```typescript
  // Good
  function getUser(id: string): Promise<User> {
    return fetchUser(id);
  }
  ```

- **Avoid `any`** - use `unknown` if type is truly unknown
  ```typescript
  // Bad
  const data: any = JSON.parse(response);
  
  // Good
  const data: unknown = JSON.parse(response);
  if (isUser(data)) {
    // Type guard
    console.log(data.email);
  }
  ```

### React

- **Functional components only** - no class components
- **Use hooks** for state and side effects
- **Named exports** for components
  ```typescript
  // Good
  export function ConnectorCard({ connector }: Props) {
    // ...
  }
  
  // Also acceptable
  export const ConnectorCard = ({ connector }: Props) => {
    // ...
  };
  ```

- **Props interface** named with `Props` suffix
  ```typescript
  interface ConnectorCardProps {
    connector: Connector;
    onConnect: (id: string) => void;
  }
  ```

- **Destructure props** in function signature
  ```typescript
  export function ConnectorCard({ connector, onConnect }: ConnectorCardProps) {
    // ...
  }
  ```

### Naming Conventions

- **Components**: PascalCase (`ConnectorCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useConnectorData.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types/Interfaces**: PascalCase (`Connector`, `UserConnection`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Files**: Match export name (`ConnectorCard.tsx` exports `ConnectorCard`)

### File Organization

- One component per file
- Co-locate related files (component + styles + tests)
- Group by feature, not by type
  ```
  components/
  ├── auth/
  │   ├── LoginForm.tsx
  │   ├── SignupForm.tsx
  │   └── ProtectedRoute.tsx
  └── connectors/
      ├── ConnectorCard.tsx
      └── ConnectorList.tsx
  ```

### Import Order

1. External dependencies (React, libraries)
2. Internal absolute imports (`@/components`)
3. Relative imports
4. Type imports
5. Styles

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

import { formatDate } from './utils';

import type { Connector } from '@/types/connector';

import './styles.css';
```

### CSS/Styling

- **Tailwind CSS first** - use utility classes
- **shadcn/ui components** - for consistent UI
- **CSS modules** - only if Tailwind insufficient
- **Avoid inline styles** - except for dynamic values

```tsx
// Good - Tailwind utilities
<div className="flex items-center gap-4 p-6 rounded-lg border">
  <Button variant="primary" size="lg">
    Connect
  </Button>
</div>

// Acceptable - dynamic styles
<div style={{ width: `${progress}%` }}>
  {/* ... */}
</div>
```

---

## Component Development

### Creating a New Component

1. **Create file** in appropriate directory
   ```bash
   touch src/components/connectors/ConnectorBadge.tsx
   ```

2. **Define interface** for props
   ```typescript
   interface ConnectorBadgeProps {
     status: ConnectionStatus;
     className?: string;
   }
   ```

3. **Implement component**
   ```typescript
   import { cn } from '@/lib/utils';
   import { Badge } from '@/components/ui/badge';
   
   interface ConnectorBadgeProps {
     status: ConnectionStatus;
     className?: string;
   }
   
   export function ConnectorBadge({ status, className }: ConnectorBadgeProps) {
     const variant = status === 'active' ? 'success' : 'secondary';
     
     return (
       <Badge variant={variant} className={cn('capitalize', className)}>
         {status}
       </Badge>
     );
   }
   ```

4. **Export** from barrel file (if applicable)
   ```typescript
   // components/connectors/index.ts
   export { ConnectorCard } from './ConnectorCard';
   export { ConnectorBadge } from './ConnectorBadge';
   ```

### Using shadcn/ui Components

Install new components:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

This adds the component to `src/components/ui/`.

Usage:
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function MyComponent() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Dialog</DialogTitle>
        </DialogHeader>
        {/* ... */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## State Management

### Context API

Use Context for global state that doesn't change frequently.

**Creating a Context**:
```typescript
// context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### React Query

Use React Query for server state.

**Fetching data**:
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

**Mutations**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useConnectConnector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectorId: string) => {
      const { error } = await supabase
        .from('user_connections')
        .insert({ connector_id: connectorId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}
```

---

## Database Operations

### Querying Data

```typescript
// Simple select
const { data, error } = await supabase
  .from('connectors')
  .select('*');

// With filter
const { data } = await supabase
  .from('connectors')
  .select('*')
  .eq('category', 'Development')
  .order('name');

// With joins
const { data } = await supabase
  .from('user_connections')
  .select(`
    *,
    connector:connectors(*)
  `)
  .eq('user_id', userId);
```

### Inserting Data

```typescript
const { data, error } = await supabase
  .from('user_connections')
  .insert({
    user_id: user.id,
    connector_id: connectorId,
    status: 'active',
  })
  .select()
  .single();
```

### Updating Data

```typescript
const { error } = await supabase
  .from('user_connections')
  .update({ status: 'revoked' })
  .eq('id', connectionId);
```

### Realtime Subscriptions

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
  })
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

## Adding New Connectors

### Step 1: Add to Database

```sql
INSERT INTO connectors (name, slug, description, category, icon_url, auth_type, oauth_config)
VALUES (
  'GitHub',
  'github',
  'Version control and collaboration platform',
  'Development',
  'https://github.com/favicon.ico',
  'oauth',
  '{
    "authUrl": "https://github.com/login/oauth/authorize",
    "tokenUrl": "https://github.com/login/oauth/access_token",
    "clientId": "your_client_id"
  }'::jsonb
);
```

### Step 2: Add Tools

```sql
INSERT INTO connector_tools (connector_id, name, description, schema, source)
VALUES (
  (SELECT id FROM connectors WHERE slug = 'github'),
  'create_issue',
  'Create a new GitHub issue',
  '{
    "type": "object",
    "properties": {
      "repo": {"type": "string", "description": "Repository name"},
      "title": {"type": "string"},
      "body": {"type": "string"}
    },
    "required": ["repo", "title"]
  }'::jsonb,
  'rest'
);
```

### Step 3: Implement Tool Execution (Future)

In `src/integrations/connectors/github.ts`:
```typescript
export async function executeGitHubTool(
  toolName: string,
  args: Record<string, unknown>,
  accessToken: string
) {
  switch (toolName) {
    case 'create_issue':
      return createIssue(args, accessToken);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function createIssue(
  args: Record<string, unknown>,
  accessToken: string
) {
  const response = await fetch(
    `https://api.github.com/repos/${args.repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: args.title,
        body: args.body,
      }),
    }
  );
  
  return response.json();
}
```

---

## Testing

### Running Tests

```bash
# Unit tests (future)
npm run test

# E2E tests (future)
npm run test:e2e

# Coverage (future)
npm run test:coverage
```

### Writing Tests

**Component Test**:
```typescript
import { render, screen } from '@testing-library/react';
import { ConnectorCard } from './ConnectorCard';

describe('ConnectorCard', () => {
  it('renders connector name', () => {
    const connector = {
      id: '1',
      name: 'GitHub',
      slug: 'github',
      // ...
    };
    
    render(<ConnectorCard connector={connector} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });
});
```

---

## Debugging

### Browser DevTools

- **React DevTools**: Inspect component tree and props
- **Network Tab**: Monitor API requests to Supabase
- **Console**: Check for errors and warnings

### Supabase Logs

- Go to Supabase Dashboard → Logs
- Filter by severity and table
- Check RLS policy violations

### Common Issues

**RLS Policy Blocking Query**:
```
Error: new row violates row-level security policy
```
Solution: Check RLS policies in `supabase/migrations/*.sql`

**Missing Environment Variables**:
```
Error: supabaseUrl is required
```
Solution: Ensure `.env` file exists with correct values

---

## Common Tasks

### Regenerating TypeScript Types

After schema changes:
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Adding a New Route

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`:
   ```typescript
   <Route path="/new-page" element={<NewPage />} />
   ```

### Updating Database Schema

1. Create new migration file:
   ```bash
   supabase migration new add_feature_x
   ```

2. Write SQL in generated file

3. Apply migration:
   ```bash
   supabase db push
   ```

---

## Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf node_modules .vite
npm install
npm run dev
```

### Type Errors

```bash
# Regenerate types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Authentication Issues

- Check Supabase Auth settings
- Verify email templates are enabled
- Check redirect URLs match

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
