# Contributing to MCP Connector Hub

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Code of Conduct

We are committed to a welcoming, inclusive environment. See [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) for full details.

**In short**: Be respectful, accept constructive criticism, and focus on what's best for the community.

---

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Search existing issues to avoid duplicates
2. Verify the bug in the latest version
3. Collect: steps to reproduce, expected vs actual behavior, screenshots, environment info

Use the **bug report template** when creating an issue.

### Suggesting Features

1. Check the [ROADMAP.md](ROADMAP.md) to see if it's already planned
2. Search existing feature requests
3. Provide a clear problem statement, proposed solution, and use cases

Use the **feature request template** when creating an issue.

### Improving Documentation

Documentation fixes (typos, clarity, examples) can be submitted directly as PRs.

### Writing Code

- Bug fixes welcome anytime
- New features: discuss in an issue first
- Always follow [coding standards](#coding-standards)
- Add tests when applicable

---

## Development Setup

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Git
- VS Code (recommended)
- Supabase account (free tier)

### Quick Start

```bash
# Fork via GitHub UI, then:
git clone https://github.com/YOUR_USERNAME/tool-connect-craft.git
cd tool-connect-craft
git remote add upstream https://github.com/Krosebrook/tool-connect-craft.git
npm install
cp .env.example .env
# Edit .env with your Supabase credentials

# Database setup
supabase link --project-ref your-project-ref
supabase db push

# Start dev server
npm run dev
```

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## Coding Standards

### TypeScript

- All new code must be TypeScript (no `.js` files)
- Strict mode is enabled
- Avoid `any` — use `unknown` if type is truly unknown
- Use explicit return types for exported functions

### React

- Functional components only
- Use hooks for state and side effects
- Named exports preferred
- Destructure props in function signature

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ConnectorCard` |
| Hooks | camelCase + `use` | `useConnectorData` |
| Functions/Variables | camelCase | `fetchUser`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Types/Interfaces | PascalCase | `UserConnection` |
| Files | Match export name | `ConnectorCard.tsx` |

### Styling

- Tailwind CSS utility classes first
- shadcn/ui components for consistency
- Use `cn()` for conditional classes
- Use semantic design tokens (`bg-primary`, `text-muted-foreground`)

### Error Handling

- Always handle errors gracefully with try-catch
- Show user-friendly toast notifications
- Log errors with context prefixes: `console.error('[context]', error)`
- Never swallow errors silently

---

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Scope** (optional): `auth`, `connectors`, `webhooks`, `health`, `ui`, `scheduler`

**Examples**:
```
feat(webhooks): add edit functionality for existing webhooks
fix(oauth): prevent token refresh race condition
docs: update architecture documentation
test(hooks): add useConnectorData unit tests
```

**Rules**:
- Present tense, imperative mood ("add feature" not "added feature")
- Subject ≤ 50 characters, lowercase, no period
- Reference issues in footer: `Closes #42`

---

## Pull Request Process

### Before Submitting

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. Make changes following coding standards

3. Validate your changes:
   ```bash
   npm run lint
   npm run build
   npx vitest run
   ```

4. Commit and push:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   git push origin feature/your-feature-name
   ```

### PR Guidelines

- **One feature per PR** — keep PRs focused
- **Small PRs** — <300 lines ideal, easier to review
- **Clear description** — explain what and why
- **Screenshots** — required for UI changes
- **Tests** — add when applicable
- **Documentation** — update if behavior changes

### Review Process

1. Automated checks run (lint, type-check, build, tests)
2. Code review by maintainers
3. Address requested changes
4. Approval and merge

---

## Project Architecture

Understanding the codebase helps you contribute effectively:

| Directory | Purpose |
|-----------|---------|
| `src/components/connectors/` | Connector UI (cards, OAuth flow, tool execution) |
| `src/components/webhooks/` | Webhook management (form, delivery history, stats) |
| `src/components/health/` | Health monitoring dashboard |
| `src/components/dashboard/` | Dashboard widgets (token expiry banner) |
| `src/hooks/` | Custom hooks (data fetching, OAuth, health alerts) |
| `src/pages/` | Route-level page components (10 pages) |
| `src/context/` | React context providers |
| `supabase/functions/` | 8 Edge Functions (tool execution, OAuth, webhooks, health) |
| `docs/` | Technical documentation |

### Key Files

- `src/hooks/useConnectorData.ts` — Core data operations and realtime subscriptions
- `src/context/ConnectorContext.tsx` — Global connector state provider
- `src/App.tsx` — Route definitions with lazy loading
- `src/lib/config.ts` — Centralized configuration and feature flags

---

## Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |

---

## Community

- **Documentation**: Check the `docs/` folder first
- **GitHub Issues**: Report bugs, request features
- **GitHub Discussions**: Ask questions, share ideas

### Recognition

Contributors are recognized in release notes and CONTRIBUTORS.md.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to MCP Connector Hub!** 🚀
