# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Rate limiting per user and connector
- Circuit breaker for connector resilience
- Webhook support for event notifications
- Connector marketplace
- MCP server discovery
- Advanced analytics dashboard

## [0.1.0] - 2024-12-29

### Added
- Initial MVP release
- Multi-authentication support (OAuth 2.0 with PKCE, API keys)
- Supabase backend integration with PostgreSQL
- Connector management system
- User connection lifecycle (connect, disconnect, status tracking)
- Real-time pipeline job execution
- WebSocket-based status updates via Supabase Realtime
- Pipeline events for job progress streaming
- Comprehensive audit logging (action_logs table)
- Row-Level Security (RLS) policies for all tables
- React-based frontend with TypeScript
- Modern UI with Radix UI components and Tailwind CSS
- Authentication system with Supabase Auth
- Protected routes with ProtectedRoute component
- Context-based state management (AuthContext, ConnectorContext)
- Custom hooks for data fetching (useConnectorData)
- Landing page with feature showcase
- Connectors browsing page with filtering
- Connector detail pages with tool execution
- Dashboard for job monitoring
- Security settings page

### Database Schema
- `connectors` table with OAuth configuration
- `connector_tools` table for tool definitions
- `user_connections` table with RLS
- `oauth_transactions` table for PKCE flow
- `pipeline_jobs` table with status tracking
- `pipeline_events` table for real-time updates
- `action_logs` table for audit trail
- Database enums for type safety (auth_type, connection_status, job_status, etc.)
- Automatic timestamp management with triggers
- Comprehensive indexing for performance

### Security
- Row-Level Security (RLS) on all tables
- Secure secret storage (tokens not exposed to client)
- PKCE flow for OAuth 2.0
- Email verification for new users
- User-scoped data access

### Developer Experience
- TypeScript with strict mode enabled
- ESLint configuration for code quality
- Vite for fast development and builds
- Hot Module Replacement (HMR)
- Type-safe database schema with generated types
- Modular component architecture

### Documentation
- Initial README with setup instructions
- Database migration scripts
- TypeScript type definitions
- Component library (shadcn/ui)

## [0.0.1] - 2024-12-28

### Added
- Project initialization
- Basic repository structure
- Initial commit with Vite + React + TypeScript template
- Dependency setup (React, Supabase, Radix UI, Tailwind CSS)
- ESLint configuration
- Git repository setup

---

## Version History Summary

- **0.1.0** - MVP Release (Current)
- **0.0.1** - Initial Setup

## Migration Notes

### 0.1.0
No breaking changes from 0.0.1. This is the first functional release.

---

## Contributing

When adding entries to the changelog:
1. Add unreleased changes under `[Unreleased]`
2. Follow categories: Added, Changed, Deprecated, Removed, Fixed, Security
3. Use present tense for descriptions
4. Link to relevant issues/PRs when applicable
5. Update version number and date when releasing

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements or patches
