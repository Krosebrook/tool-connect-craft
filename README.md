# Tool Connect Craft 🔌

A production-grade **Model Context Protocol (MCP) Connector Hub** for integrating and automating services via OAuth 2.0, API keys, and MCP servers. Built for developers, AI agents, and automation workflows.

[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Usage](#usage)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Tool Connect Craft** is a unified integration platform that enables seamless connectivity between your applications and external services. Whether you're building an AI agent that needs to access Gmail, a workflow automation that syncs GitHub with Notion, or a custom dashboard pulling data from multiple sources, this platform provides the infrastructure you need.

### What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard for enabling AI models and applications to securely interact with external tools and data sources. Tool Connect Craft acts as a central hub for managing these connections.

### Key Capabilities

- **Universal Authentication**: OAuth 2.0 + PKCE, API keys, and custom authentication flows
- **Real-time Execution**: Stream pipeline job progress with live event updates
- **Enterprise Security**: Row-level security, encrypted secrets, and audit logging
- **Extensible**: Add custom connectors and MCP servers
- **Developer-Friendly**: Type-safe APIs, comprehensive docs, and modern tooling

---

## ✨ Features

### 🔐 Authentication & Security
- OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- API key management with secure storage
- Row-level security (RLS) policies
- Encrypted secret references (Supabase Vault integration-ready)
- Comprehensive audit logging

### 🔌 Connector Ecosystem
Pre-built connectors for popular services:
- **Communication**: Gmail, Slack
- **Development**: GitHub, Vercel
- **Productivity**: Notion
- **Storage**: Google Drive
- **Database**: Airtable
- **Custom**: MCP server protocol support

### ⚡ Real-time Pipeline Engine
- Asynchronous job execution
- Live event streaming via WebSocket
- Job status tracking (queued, running, succeeded, failed)
- Retry and circuit breaker patterns (planned)

### 📊 Monitoring & Observability
- Action logs with latency metrics
- Connection health status
- Job execution history
- Real-time dashboard

### 🎨 Modern UI/UX
- Built with shadcn/ui components
- Responsive design
- Dark mode support
- Accessible (WCAG compliant)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or yarn/pnpm)
- **Supabase Account** (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Krosebrook/tool-connect-craft.git
   cd tool-connect-craft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

4. **Set up the database**
   
   The database schema is in `supabase/migrations/`. If using Supabase CLI:
   ```bash
   npx supabase db push
   ```
   
   Or apply the migration manually via the Supabase dashboard.

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8080](http://localhost:8080)

### First Steps

1. **Sign up** for an account at `/auth`
2. **Browse connectors** at `/connectors`
3. **Connect a service** (OAuth flow simulation included)
4. **Execute a tool** from the connector detail page
5. **Monitor jobs** in real-time on the `/dashboard`

---

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────┐
│  React Frontend │  (Vite + TypeScript)
└────────┬────────┘
         │
         ├─ Context API (Auth, Connectors)
         ├─ TanStack Query (data fetching)
         └─ shadcn/ui components
         │
         ▼
┌─────────────────────────────────┐
│      Supabase Backend           │
├─────────────────────────────────┤
│  • PostgreSQL (data storage)    │
│  • Auth (user management)       │
│  • Realtime (WebSocket)         │
│  • Row Level Security (RLS)     │
│  • Edge Functions (planned)     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   External Services & MCP       │
├─────────────────────────────────┤
│  Gmail • GitHub • Slack • etc.  │
└─────────────────────────────────┘
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth UI    │  │  Connectors  │  │  Dashboard   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth Layer  │  │  PostgreSQL  │  │   Realtime   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│     [GitHub] [Slack] [Linear] [MCP Servers] [...]          │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

- **connectors**: Service definitions and OAuth configurations
- **connector_tools**: Available operations per connector
- **user_connections**: User-specific connection instances with auth tokens
- **oauth_transactions**: PKCE flow state management
- **pipeline_jobs**: Background task execution tracking
- **pipeline_events**: Real-time job progress streaming
- **action_logs**: Audit trail for all API interactions

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design documentation.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm ([install with nvm](https://github.com/nvm-sh/nvm))
- **Supabase Account** (free tier available at [supabase.com](https://supabase.com))
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Krosebrook/tool-connect-craft.git
   cd tool-connect-craft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up database**
   
   Run migrations in your Supabase project:
   ```bash
   # Using Supabase CLI (recommended)
   npx supabase db push
   
   # Or manually via Supabase Dashboard → SQL Editor
   # Execute: supabase/migrations/20251229015635_*.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   Access the app at `http://localhost:5173`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | Yes |

---

## 💻 Usage

### For End Users

1. **Sign Up / Sign In**
   - Navigate to `/auth` to create an account or log in
   - Email verification is required for new accounts

2. **Browse Connectors**
   - Visit `/connectors` to see available integrations
   - Filter by category (Development, Communication, Productivity, etc.)

3. **Connect a Service**
   - Click "Connect" on any connector
   - For OAuth services, authorize access in the popup
   - For API key services, provide your credentials

4. **Execute Tools**
   - Navigate to a connector detail page
   - Select a tool/operation to execute
   - Provide required parameters
   - Monitor execution in real-time on the dashboard

5. **View Activity**
   - Dashboard shows recent job executions
   - Action logs provide detailed audit history

### For Developers

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for:
- Code structure and conventions
- Adding new connectors
- Creating custom tools
- Testing strategies
- Deployment guides

---

## 🛠️ Development

### Project Structure

```
tool-connect-craft/
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── connectors/  # Connector-related UI
│   │   ├── layout/      # Layout components
│   │   └── ui/          # Reusable UI primitives (shadcn)
│   ├── context/         # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ConnectorContext.tsx
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # External service integrations
│   │   └── supabase/    # Supabase client and types
│   ├── pages/           # Route pages
│   ├── types/           # TypeScript type definitions
│   └── lib/             # Utility functions
├── supabase/
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── docs/                # Additional documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking

# Database
npx supabase db push     # Apply migrations
npx supabase db reset    # Reset database (dev only)
npx supabase gen types   # Generate TypeScript types from schema
```

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, shadcn/ui, Tailwind CSS
- **State Management**: React Query, Context API
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Routing**: React Router v6
- **Form Handling**: React Hook Form, Zod
- **Icons**: Lucide React

---

## 🔒 Security

### Built-in Security Features

- **Row-Level Security (RLS)**: Database-level access control
- **Secret Management**: OAuth tokens stored securely (never in client)
- **PKCE Flow**: OAuth 2.0 with Proof Key for Code Exchange
- **Rate Limiting**: Per-user and per-connector limits (roadmap)
- **Audit Logging**: Complete trail of all actions

### Best Practices

- Never commit secrets to version control
- Use environment variables for sensitive configuration
- Enable 2FA on Supabase account
- Regularly rotate API keys and OAuth secrets
- Review action logs for suspicious activity

See [SECURITY.md](docs/SECURITY.md) for vulnerability reporting and security policies.

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our coding standards
4. **Write tests** for new functionality
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style (ESLint + Prettier)
- Write clear commit messages
- Add documentation for new features
- Ensure all tests pass
- Update CHANGELOG.md

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

---

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)**: System design and decisions
- **[Development Guide](docs/DEVELOPMENT.md)**: Setup and coding standards
- **[API Documentation](docs/API.md)**: Database schema and types
- **[Security Policy](docs/SECURITY.md)**: Security features and reporting
- **[Roadmap](docs/ROADMAP.md)**: Future plans and feature requests
- **[Changelog](CHANGELOG.md)**: Version history and release notes

---

## 🗺️ Roadmap

### Database Schema

**Core Tables:**
- `connectors` - Service metadata (OAuth config, MCP endpoints)
- `connector_tools` - Available operations per connector
- `user_connections` - User-specific auth tokens and status
- `pipeline_jobs` - Async execution tracking
- `pipeline_events` - Real-time job progress logs
- `action_logs` - Audit trail for all operations
- `oauth_transactions` - OAuth flow state management

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed documentation.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI Framework** | shadcn/ui, Tailwind CSS, Radix UI |
| **State Management** | React Context, TanStack Query |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Authentication** | Supabase Auth, OAuth 2.0 + PKCE |
| **Build Tool** | Vite with SWC |
| **Linting** | ESLint with TypeScript support |

---

## 📘 Usage

### Connecting to a Service

```typescript
import { useConnectors } from '@/context/ConnectorContext';

function MyComponent() {
  const { connectors, connect } = useConnectors();
  
  const handleConnect = async (connectorId: string) => {
    await connect(connectorId);
    // For OAuth connectors, this initiates the OAuth flow
    // For API key connectors, a modal prompts for the key
  };
  
  return (
    <button onClick={() => handleConnect('conn-github')}>
      Connect GitHub
    </button>
  );
}
```

### Executing a Tool

```typescript
import { useConnectors } from '@/context/ConnectorContext';

function ToolExecutor() {
  const { executeTool } = useConnectors();
  
  const sendEmail = async () => {
    const job = await executeTool('google-gmail', 'send_email', {
      to: 'user@example.com',
      subject: 'Hello',
      body: 'Email from Tool Connect Craft!'
    });
    
    console.log('Job created:', job.id);
    // Real-time updates via WebSocket subscription
  };
  
  return <button onClick={sendEmail}>Send Email</button>;
}
```

### Monitoring Jobs

```typescript
import { useConnectors } from '@/context/ConnectorContext';

function JobMonitor() {
  const { jobs, events } = useConnectors();
  
  return (
    <div>
      {jobs.map(job => (
        <div key={job.id}>
          <h3>Job {job.id}</h3>
          <p>Status: {job.status}</p>
          
          {/* Real-time events */}
          {events.get(job.id)?.map(event => (
            <div key={event.id}>
              [{event.level}] {event.message}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Yes |

### Adding a Custom Connector

1. Add connector metadata to the database:
   ```sql
   INSERT INTO connectors (name, slug, description, category, auth_type, oauth_config)
   VALUES (
     'My Service',
     'my-service',
     'Description of the service',
     'Productivity',
     'oauth',
     '{"authUrl": "https://...", "tokenUrl": "https://..."}'
   );
   ```

2. Define available tools:
   ```sql
   INSERT INTO connector_tools (connector_id, name, description, schema, source)
   VALUES (
     'connector-id-here',
     'my_tool',
     'Tool description',
     '{"type": "object", "properties": {...}}',
     'rest'
   );
   ```

3. Implement the tool execution logic in Edge Functions (planned) or backend service.

See [docs/CONNECTORS.md](./docs/CONNECTORS.md) for detailed connector development guide.

---

## 🛠️ Development

### Project Structure

```
tool-connect-craft/
├── src/
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   ├── connectors/   # Connector-specific UI
│   │   ├── layout/       # Layout components
│   │   └── ui/           # shadcn/ui components
│   ├── context/          # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ConnectorContext.tsx
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service clients
│   │   └── supabase/
│   ├── pages/            # Route pages
│   ├── types/            # TypeScript type definitions
│   ├── lib/              # Utilities
│   └── main.tsx          # Application entry point
├── supabase/
│   ├── config.toml       # Supabase project config
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── docs/                 # Documentation
└── package.json
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:8080)
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally

3. **Lint your code**
   ```bash
   npm run lint
   ```

4. **Build to verify**
   ```bash
   npm run build
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   git push origin feature/my-feature
   ```

6. **Open a Pull Request**

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Import your repository** in Vercel dashboard
2. **Add environment variables** (Supabase credentials)
3. **Deploy** - automatic on every push to main

### Netlify

```bash
npm run build
# Upload the dist/ folder to Netlify
```

### Docker (Self-hosted)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for comprehensive deployment guides.

---

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](./docs/API.md) - Frontend API and hooks
- [Connector Development](./docs/CONNECTORS.md) - Build custom connectors
- [MCP Integration](./docs/MCP_INTEGRATION.md) - MCP server setup
- [Security Guide](./docs/SECURITY.md) - Security best practices
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Roadmap](./ROADMAP.md) - Future features and milestones
- [Changelog](./CHANGELOG.md) - Version history

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code of Conduct
- Development setup
- Coding standards
- Pull request process
- Issue reporting

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - Open standard for AI tool integration
- [Supabase](https://supabase.com/) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Vite](https://vitejs.dev/) - Build tool
- [React](https://react.dev/) - UI framework

---

## 📞 Support

- **Documentation**: [./docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/Krosebrook/tool-connect-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Krosebrook/tool-connect-craft/discussions)

---

**Built with ❤️ by the Tool Connect Craft team**
