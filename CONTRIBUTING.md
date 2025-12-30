# Contributing to Tool Connect Craft

First off, thank you for considering contributing to Tool Connect Craft! It's people like you that make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- A Supabase account (for backend development)
- Basic knowledge of React, TypeScript, and SQL

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tool-connect-craft.git
   cd tool-connect-craft
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Krosebrook/tool-connect-craft.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser** to http://localhost:8080

---

## Development Process

### Branching Strategy

We use a simplified Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Creating a Branch

```bash
# Fetch latest changes
git fetch upstream
git checkout develop
git merge upstream/develop

# Create your feature branch
git checkout -b feature/my-amazing-feature
```

### Making Changes

1. **Make your changes** in your feature branch
2. **Follow coding standards** (see below)
3. **Write or update tests** for your changes
4. **Test locally** to ensure nothing breaks
5. **Commit your changes** with descriptive messages

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
```
feat(connectors): add Stripe payment connector

Add support for Stripe payment processing including:
- OAuth 2.0 integration
- Payment intent creation
- Refund processing
- Webhook handling

Closes #123
```

```
fix(auth): prevent token refresh loop

Fixed infinite loop when refresh token expires by adding
proper error handling and redirect to login page.

Fixes #456
```

---

## Coding Standards

### TypeScript

- **Use TypeScript strictly** - no `any` types unless absolutely necessary
- **Define interfaces** for all data structures
- **Use type inference** where possible
- **Prefer `interface` over `type`** for object shapes
- **Use enums** for fixed sets of values

```typescript
// Good
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Avoid
const user: any = { ... };
```

### React

- **Use functional components** with hooks
- **Avoid class components** unless necessary
- **Keep components small** and focused (< 200 lines)
- **Extract custom hooks** for reusable logic
- **Use proper prop types** with TypeScript
- **Memoize expensive operations** with `useMemo` and `useCallback`

```typescript
// Good
interface Props {
  userId: string;
  onUpdate: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: Props) {
  // Component logic
}
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useConnectorData.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`UserConnection`)
- **Files**: Match the export name

### File Organization

```
src/
├── components/
│   ├── [feature]/          # Group by feature
│   │   ├── Component.tsx
│   │   └── types.ts
│   └── ui/                 # Shared UI components
├── context/                # React Context providers
├── hooks/                  # Custom hooks
├── lib/                    # Utilities
├── pages/                  # Route pages
└── types/                  # Shared types
```

### Code Style

- **Use ESLint** - run `npm run lint`
- **2 spaces** for indentation
- **Single quotes** for strings
- **Semicolons** at end of statements
- **Trailing commas** in multi-line structures
- **Max line length**: 100 characters

### Comments

- **Write self-documenting code** - prefer clear naming over comments
- **Add comments for complex logic**
- **Document public APIs** with JSDoc
- **TODO comments** should include issue number

```typescript
/**
 * Executes a tool on a connector with the given arguments.
 * 
 * @param connectorSlug - The unique slug of the connector
 * @param toolName - The name of the tool to execute
 * @param args - Tool-specific arguments
 * @returns A promise that resolves to the created job
 * @throws {Error} If user is not authenticated or connector not found
 */
export async function executeTool(
  connectorSlug: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<PipelineJob> {
  // TODO(#123): Add retry logic
  // ...
}
```

---

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest changes from upstream
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Push your changes** to your fork
   ```bash
   git push origin feature/my-amazing-feature
   ```

3. **Create a Pull Request** on GitHub
   - Use a descriptive title
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

4. **Address review feedback**
   - Make requested changes
   - Push updates to the same branch
   - Reply to comments

5. **Squash commits** (if requested)
   ```bash
   git rebase -i upstream/develop
   git push --force-with-lease
   ```

### PR Checklist

Before submitting, ensure:

- [ ] Code follows the style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors or warnings
- [ ] Documentation is updated
- [ ] Commits follow convention
- [ ] PR description is complete

---

## Reporting Bugs

### Before Submitting a Bug Report

- **Check the documentation** - ensure you're using the feature correctly
- **Search existing issues** - your bug might already be reported
- **Try the latest version** - the bug might be fixed
- **Reproduce the issue** - ensure it's consistent

### How to Submit a Bug Report

Create an issue with:

**Title**: Short, descriptive summary

**Description**:
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment**:
  - OS and version
  - Browser and version
  - Node.js version
  - Package version

**Example:**
```markdown
## Bug: OAuth callback fails with 500 error

### Steps to Reproduce
1. Go to `/connectors`
2. Click "Connect" on GitHub connector
3. Authorize the app on GitHub
4. Gets redirected back with error

### Expected Behavior
Should complete OAuth flow and show connected status

### Actual Behavior
500 Internal Server Error in console, connection status remains "pending"

### Environment
- OS: macOS 14.0
- Browser: Chrome 120.0
- Node: 18.19.0
- Version: 0.1.0

### Screenshots
[Attach screenshot of error]
```

---

## Suggesting Features

We love new ideas! Here's how to suggest features:

### Before Submitting

- **Check the roadmap** - feature might be planned
- **Search existing issues** - someone might have suggested it
- **Consider the scope** - does it fit the project vision?

### How to Submit a Feature Request

Create an issue with:

**Title**: `[Feature Request] Brief description`

**Description**:
- **Problem/motivation** - what problem does it solve?
- **Proposed solution** - how should it work?
- **Alternatives considered** - other approaches?
- **Use cases** - who benefits and how?
- **Implementation ideas** (optional)

**Example:**
```markdown
## [Feature Request] Webhook support for connector events

### Problem
Currently, users must poll the API to check job status. This is inefficient
for real-time integrations.

### Proposed Solution
Add webhook configuration where users can register a URL to receive events:
- Job status changes
- Connection status changes
- Tool execution results

### Alternatives Considered
- WebSocket-only (doesn't work for server-to-server)
- Server-Sent Events (limited browser support)

### Use Cases
- CI/CD pipelines waiting for deployment status
- Notification systems reacting to events
- Third-party integrations requiring real-time updates

### Implementation Ideas
- Add `webhooks` table to database
- Create Edge Function to dispatch events
- Include HMAC signature for security
- Retry logic with exponential backoff
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- ConnectorCard.test.tsx
```

### Writing Tests

- **Test files** should be colocated: `Component.test.tsx`
- **Test user behavior**, not implementation details
- **Use Testing Library** best practices
- **Mock external dependencies** (Supabase, APIs)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectorCard } from './ConnectorCard';

describe('ConnectorCard', () => {
  it('displays connector name and description', () => {
    const connector = {
      id: '1',
      name: 'GitHub',
      description: 'Manage repositories',
      // ...
    };
    
    render(<ConnectorCard connector={connector} />);
    
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Manage repositories')).toBeInTheDocument();
  });
  
  it('calls onConnect when connect button is clicked', () => {
    const onConnect = jest.fn();
    const connector = { /* ... */ };
    
    render(<ConnectorCard connector={connector} onConnect={onConnect} />);
    
    fireEvent.click(screen.getByRole('button', { name: /connect/i }));
    
    expect(onConnect).toHaveBeenCalledWith(connector.id);
  });
});
```

---

## Community

### Getting Help

- **Documentation**: Check [/docs](./docs)
- **Issues**: Search [existing issues](https://github.com/Krosebrook/tool-connect-craft/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/Krosebrook/tool-connect-craft/discussions)

### Stay Updated

- **Watch the repository** for notifications
- **Star the project** to show support
- **Follow the changelog** for updates

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights

Thank you for contributing to Tool Connect Craft! 🎉
