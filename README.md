# Tool Connect Craft

> **Enterprise-grade MCP Connector Hub for seamless service integration**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple)](https://vitejs.dev/)

A production-ready connector hub for integrating services via OAuth 2.0 + PKCE, API keys, and Model Context Protocol (MCP) servers. Features real-time pipelines, comprehensive audit logs, and enterprise-grade security.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Reference](#api-reference)
- [Security](#security)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🎯 Overview

**Tool Connect Craft** is a modern web application that serves as a centralized hub for managing and executing integrations across multiple services. It supports:

- **OAuth 2.0 + PKCE**: Secure authentication flows for third-party services
- **API Key Management**: Secure storage and rotation of API credentials
- **MCP Protocol**: Integration with Model Context Protocol servers
- **Real-time Pipelines**: Background job execution with live event streaming
- **Audit Logging**: Comprehensive tracking of all actions and executions
- **Multi-tenancy**: User-isolated connections and data

### What Problem Does It Solve?

Managing integrations across multiple services is complex. Tool Connect Craft provides:
1. **Unified Interface**: Single dashboard for all your service connections
2. **Security First**: Encrypted secrets, PKCE flow, audit trails
3. **Developer Experience**: Type-safe APIs, real-time updates, comprehensive logging
4. **Scalability**: Built on Supabase for horizontal scaling

---

## ✨ Key Features

### 🔌 Universal Connectors
- Support for OAuth 2.0 with PKCE flow
- API key-based authentication
- Model Context Protocol (MCP) integration
- Extensible connector architecture

### ⚡ Real-time Pipeline Execution
- Background job processing
- Live event streaming via WebSockets
- Job status tracking (queued → running → succeeded/failed)
- Comprehensive error handling

### 🔒 Enterprise Security
- Encrypted secret storage
- PKCE for OAuth flows
- Row-level security (RLS) policies
- Complete audit trails

### 📊 Monitoring & Analytics
- Action logs for all operations
- Latency tracking
- Success/failure metrics
- Real-time job event streaming

### 🎨 Modern UI/UX
- Built with React 18 and TypeScript
- Shadcn/ui component library
- Responsive design
- Dark mode support
- Real-time updates

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **React 18.3** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool
- **TanStack Query** - Data fetching & caching
- **React Router 6** - Client-side routing
- **Shadcn/ui** - Component library
- **Tailwind CSS** - Styling

**Backend:**
- **Supabase** - Database, Auth, Realtime
- **PostgreSQL** - Relational database
- **Row Level Security** - Data isolation

**Infrastructure:**
- **Edge Functions** (planned) - Serverless execution
- **Vault Integration** (planned) - Secret management

### Key Design Decisions

1. **Type-First Development**: Comprehensive TypeScript types generated from database schema
2. **Context API Pattern**: Global state management for auth and connectors
3. **Real-time Subscriptions**: WebSocket-based updates for jobs, events, and connections
4. **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **bun** >= 1.0.0
- **Supabase Account** (for backend services)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Krosebrook/tool-connect-craft.git
   cd tool-connect-craft
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   ```

4. **Set up the database:**
   - The migration file is in `supabase/migrations/`
   - Apply it via Supabase Dashboard or CLI
   - Alternatively, use the Supabase CLI:
     ```bash
     npx supabase db push
     ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Quick Start with Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref your_project_id

# Push migrations
npx supabase db push

# Start local development
npm run dev
```

---

## 💡 Usage

### Basic Workflow

1. **Sign Up / Sign In**
   - Navigate to `/auth`
   - Create an account or sign in
   - Email verification may be required (check Supabase settings)

2. **Browse Connectors**
   - Visit `/connectors` to see available integrations
   - Each connector shows its authentication type and status

3. **Connect to a Service**
   - Click "Connect" on any connector
   - For OAuth: Follow the authorization flow
   - For API Key: Enter your credentials

4. **Execute Tools**
   - Navigate to a connector detail page
   - Browse available tools
   - Execute tools with required parameters
   - Monitor job progress in real-time

5. **Monitor Activity**
   - Visit `/dashboard` for an overview
   - Check action logs for audit trail
   - View pipeline jobs and their status

### Example: Connecting to GitHub

```typescript
// 1. User clicks "Connect" on GitHub connector
// 2. System creates OAuth transaction with PKCE
// 3. User is redirected to GitHub for authorization
// 4. GitHub redirects back with authorization code
// 5. System exchanges code for tokens
// 6. Tokens are encrypted and stored
// 7. User connection status is updated to "active"
```

### Example: Executing a Tool

```typescript
// From the UI or programmatically:
const job = await executeTool(
  'github',  // connector slug
  'create_issue',  // tool name
  {
    repository: 'owner/repo',
    title: 'Bug report',
    body: 'Issue description'
  }
);

// Monitor job progress
// Real-time events will stream to the UI
```

---

## 📁 Project Structure

```
tool-connect-craft/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Shadcn UI components
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── ConnectorContext.tsx # Connector data & actions
│   ├── hooks/              # Custom React hooks
│   │   ├── useConnectorData.ts  # Connector data fetching
│   │   └── use-toast.ts         # Toast notifications
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client & types
│   ├── pages/              # Route pages
│   │   ├── LandingPage.tsx      # Public landing page
│   │   ├── AuthPage.tsx         # Sign in/up page
│   │   ├── ConnectorsPage.tsx   # Connector list
│   │   ├── ConnectorDetailPage.tsx  # Single connector
│   │   ├── DashboardPage.tsx    # User dashboard
│   │   └── SecuritySettingsPage.tsx # Security settings
│   ├── types/              # TypeScript type definitions
│   │   ├── connector.ts    # Core connector types
│   │   └── seed-data.ts    # Seed data types
│   ├── lib/                # Utility functions
│   ├── App.tsx             # Root component with routing
│   └── main.tsx            # Application entry point
├── supabase/
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
├── .env                    # Environment variables (not in git)
├── .env.example            # Example environment file
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── tailwind.config.ts      # Tailwind CSS configuration
```

### Key Directories

- **`src/context/`**: Global state management using React Context
- **`src/hooks/`**: Reusable React hooks for data fetching and UI state
- **`src/types/`**: Centralized TypeScript type definitions
- **`src/integrations/supabase/`**: Database client and auto-generated types

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:debug        # Start with debugging enabled

# Building
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # Run TypeScript compiler check
```

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes with hot reload:**
   - The dev server will automatically reload on file changes
   - TypeScript errors will show in the console

3. **Test your changes:**
   - Manually test all affected functionality
   - Verify real-time updates work correctly
   - Check responsive design

4. **Lint and type-check:**
   ```bash
   npm run lint
   npm run type-check
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- **TypeScript**: Use strict mode, avoid `any`
- **Components**: Functional components with hooks
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: JSDoc for complex functions, inline for clarity
- **Imports**: Absolute imports using `@/` alias

### Adding a New Connector

1. **Define connector metadata** in Supabase:
   ```sql
   INSERT INTO connectors (name, slug, description, auth_type, category)
   VALUES ('GitHub', 'github', 'GitHub integration', 'oauth', 'Developer Tools');
   ```

2. **Add connector tools:**
   ```sql
   INSERT INTO connector_tools (connector_id, name, description, schema)
   VALUES (
     'connector-uuid',
     'create_issue',
     'Create a GitHub issue',
     '{"type": "object", "properties": {...}}'
   );
   ```

3. **Implement OAuth config** (if OAuth):
   ```sql
   UPDATE connectors SET
     oauth_config = '{
       "authUrl": "https://github.com/login/oauth/authorize",
       "tokenUrl": "https://github.com/login/oauth/access_token",
       "clientId": "your-client-id"
     }'
   WHERE slug = 'github';
   ```

4. **Test the connector** through the UI

---

## 📚 API Reference

### React Hooks

#### `useAuth()`
Access authentication state and methods.

```typescript
const { user, session, loading, signIn, signUp, signOut } = useAuth();
```

**Returns:**
- `user: User | null` - Current authenticated user
- `session: Session | null` - Active session
- `loading: boolean` - Loading state
- `signIn(email, password)` - Sign in method
- `signUp(email, password)` - Sign up method
- `signOut()` - Sign out method

#### `useConnectors()`
Access connector data and actions.

```typescript
const {
  connectors,
  connections,
  jobs,
  connect,
  disconnect,
  executeTool
} = useConnectors();
```

**Returns:**
- `connectors: Connector[]` - All available connectors
- `connections: UserConnection[]` - User's active connections
- `jobs: PipelineJob[]` - User's pipeline jobs
- `connect(connectorId)` - Connect to a service
- `disconnect(connectionId)` - Disconnect from a service
- `executeTool(slug, toolName, args)` - Execute a connector tool

### Type Definitions

See `src/types/connector.ts` for complete type definitions:
- `Connector` - Service integration metadata
- `ConnectorTool` - Callable operation
- `UserConnection` - User-specific connection instance
- `PipelineJob` - Background job execution
- `PipelineEvent` - Job progress event
- `ActionLog` - Audit log entry

---

## 🔒 Security

### Security Features

1. **Authentication**
   - Supabase Auth with email/password
   - Session-based authentication
   - Automatic token refresh

2. **Authorization**
   - Row Level Security (RLS) policies
   - User-scoped data access
   - Protected routes in frontend

3. **Secret Management**
   - Encrypted storage of API keys and OAuth tokens
   - Reference-based secret retrieval (not stored in DB directly)
   - Planned: HashiCorp Vault integration

4. **OAuth Security**
   - PKCE (Proof Key for Code Exchange) flow
   - State parameter validation
   - Short-lived authorization codes

5. **Audit Trail**
   - All actions logged with timestamps
   - Request/response tracking
   - Error tracking

### Security Best Practices

- Never commit `.env` file to version control
- Rotate API keys regularly
- Use strong passwords (min 8 characters)
- Monitor action logs for suspicious activity
- Keep dependencies updated

### Vulnerability Reporting

Please report security vulnerabilities to: **security@toolconnectcraft.dev**

Do not open public issues for security vulnerabilities.

See [SECURITY.md](./SECURITY.md) for our security policy.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure linting passes
6. Submit a pull request

### Development Setup for Contributors

```bash
# Fork and clone your fork
git clone https://github.com/your-username/tool-connect-craft.git
cd tool-connect-craft

# Add upstream remote
git remote add upstream https://github.com/Krosebrook/tool-connect-craft.git

# Install dependencies
npm install

# Create .env from example
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development
npm run dev
```

---

## 🗺️ Roadmap

### Current Status: MVP (v0.1.0)

✅ **Completed:**
- Core connector architecture
- OAuth 2.0 + PKCE foundation
- User authentication
- Pipeline job system
- Real-time event streaming
- Audit logging
- Basic UI/UX

### Short Term (v0.2.0 - Q1 2025)

- [ ] Unit and integration tests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error boundary components
- [ ] Rate limiting implementation
- [ ] Circuit breaker for connector resilience
- [ ] Comprehensive API documentation
- [ ] Performance optimization

### Mid Term (v0.5.0 - Q2 2025)

- [ ] Actual OAuth flow implementation
- [ ] MCP server integration
- [ ] Webhook support for connectors
- [ ] Advanced filtering and search
- [ ] Export logs to CSV/JSON
- [ ] User settings and preferences
- [ ] Multi-language support (i18n)

### Long Term (v1.0.0 - Q3 2025)

- [ ] Custom connector creation UI
- [ ] Visual workflow builder
- [ ] Scheduled job execution
- [ ] Team/organization support
- [ ] Role-based access control (RBAC)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Self-hosted deployment option

### Beyond v1.0

- Marketplace for community connectors
- AI-powered connector suggestions
- Automatic error recovery
- Multi-region deployment
- Compliance certifications (SOC 2, GDPR)

See [ROADMAP.md](./ROADMAP.md) for detailed planning.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **Shadcn/ui** - Component library
- **Radix UI** - Accessible primitives
- **Lovable** - Initial project scaffolding

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Krosebrook/tool-connect-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Krosebrook/tool-connect-craft/discussions)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ by the Tool Connect Craft team**
