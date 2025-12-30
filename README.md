# Tool Connect Craft 🔌

**A production-grade Model Context Protocol (MCP) Connector Hub for seamless service integrations**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Development](#development)
- [Security](#security)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🎯 Overview

**Tool Connect Craft** is a modern, enterprise-ready connector hub that enables seamless integration with external services through OAuth 2.0, API keys, and Model Context Protocol (MCP) servers. Built with TypeScript, React, and Supabase, it provides real-time pipeline execution, comprehensive audit logging, and robust security features.

### What is MCP?

The Model Context Protocol (MCP) is an open standard for connecting AI models to external tools and data sources. Tool Connect Craft implements MCP to enable AI assistants to interact with your connected services securely and efficiently.

### Key Use Cases

- **AI-Powered Automation**: Connect AI models to external services (GitHub, Slack, Linear, etc.)
- **Integration Platform**: Central hub for managing OAuth connections and API credentials
- **Pipeline Orchestration**: Execute long-running background jobs with real-time status updates
- **Audit & Compliance**: Track all API interactions with detailed logging

---

## ✨ Features

### Core Capabilities

- 🔐 **Multi-Auth Support**: OAuth 2.0 (PKCE), API keys, and passwordless authentication
- 🔌 **Connector Ecosystem**: Pre-built integrations for popular services
- ⚡ **Real-time Pipelines**: Background job execution with WebSocket status updates
- 📊 **Audit Logging**: Comprehensive tracking of all tool executions and API calls
- 🛡️ **Enterprise Security**: Row-Level Security (RLS), secret management, and rate limiting
- 🎨 **Modern UI**: Beautiful, accessible interface built with Radix UI and Tailwind CSS
- 🔄 **State Management**: Optimistic updates with React Query and Supabase Realtime

### Technical Highlights

- **Type Safety**: Full TypeScript coverage with strict mode
- **Database**: PostgreSQL via Supabase with automatic migrations
- **Authentication**: Supabase Auth with email/password and social providers
- **Real-time**: Live updates via Supabase Realtime subscriptions
- **Scalability**: Designed for horizontal scaling with stateless architecture

---

## 🏗️ Architecture

### System Components

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

### Current Status: MVP / Early Access

See [ROADMAP.md](docs/ROADMAP.md) for the complete roadmap including:
- **v0.1** - MVP with core features (current)
- **v0.5** - Enhanced connector ecosystem
- **v1.0** - Production-ready release
- **v2.0+** - Advanced features (AI agents, marketplace, enterprise)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Inspired by the [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Krosebrook/tool-connect-craft/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Krosebrook/tool-connect-craft/discussions)
- **Email**: support@toolconnectcraft.dev (coming soon)

---

**Built with ❤️ by developers, for developers**
