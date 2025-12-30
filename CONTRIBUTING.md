# Contributing to Tool Connect Craft

First off, thank you for considering contributing to Tool Connect Craft! It's people like you that make Tool Connect Craft such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@toolconnectcraft.dev.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **bun** >= 1.0.0
- **Git** for version control
- **Supabase Account** for backend services
- A **GitHub Account** for pull requests

### First Contribution?

Unsure where to begin? Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Improvements or additions to documentation

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When filing a bug report, include:**
- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, Node version)
- Any error messages or logs

**Use this template:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 120]
- Node: [e.g. 18.17.0]
- Version: [e.g. 0.1.0]

**Additional context**
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**When suggesting an enhancement, include:**
- A clear and descriptive title
- A detailed description of the proposed functionality
- Why this enhancement would be useful
- Possible implementation approach (optional)

### Contributing Code

1. Find an issue to work on or create one
2. Comment on the issue that you'd like to work on it
3. Wait for approval from a maintainer
4. Fork and create your branch
5. Make your changes
6. Submit a pull request

---

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/tool-connect-craft.git
cd tool-connect-craft

# Add upstream remote
git remote add upstream https://github.com/Krosebrook/tool-connect-craft.git
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4. Set Up Database

Option A - Using Supabase CLI:
```bash
npx supabase link --project-ref your_project_id
npx supabase db push
```

Option B - Manual via Supabase Dashboard:
- Copy SQL from `supabase/migrations/`
- Run in SQL Editor

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/add-webhook-support`)
- `fix/` - Bug fixes (e.g., `fix/connection-timeout`)
- `docs/` - Documentation (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-hook`)
- `test/` - Adding tests (e.g., `test/add-auth-tests`)
- `chore/` - Maintenance (e.g., `chore/update-dependencies`)

### Workflow Steps

```bash
# 1. Sync with upstream
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: add your feature"

# 4. Keep branch updated
git fetch upstream
git rebase upstream/main

# 5. Push to your fork
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
```

---

## Coding Standards

### TypeScript

```typescript
// ✅ Good
interface UserConnection {
  id: string;
  userId: string;
  status: ConnectionStatus;
}

function connect(connectorId: string): Promise<void> {
  // implementation
}

// ❌ Bad
interface UserConnection {
  id: any;  // Don't use 'any'
  userId;   // Always specify types
}

function connect(connectorId) {  // Missing types
  // implementation
}
```

### React Components

```typescript
// ✅ Good
interface ConnectorCardProps {
  connector: Connector;
  onConnect: (id: string) => void;
}

export function ConnectorCard({ connector, onConnect }: ConnectorCardProps) {
  return (
    <Card>
      <h3>{connector.name}</h3>
      <Button onClick={() => onConnect(connector.id)}>
        Connect
      </Button>
    </Card>
  );
}

// ❌ Bad
export function ConnectorCard(props: any) {  // Missing type definition
  return (
    <div>  {/* Use semantic components */}
      <h3>{props.connector.name}</h3>
    </div>
  );
}
```

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`
- **Files**: Match export name (`ConnectorCard.tsx`, `useAuth.ts`)

### Code Organization

```typescript
// File structure
// 1. Imports
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Connector } from '@/types/connector';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Main component/function
export function Component() {
  // 4a. Hooks
  const [state, setState] = useState();
  
  // 4b. Derived values
  const computed = useMemo(() => {}, []);
  
  // 4c. Effects
  useEffect(() => {}, []);
  
  // 4d. Event handlers
  const handleClick = () => {};
  
  // 4e. Render
  return <div />;
}

// 5. Helper functions
function helper() {}
```

### Comments

```typescript
// ✅ Good - JSDoc for complex functions
/**
 * Executes a connector tool with the given arguments.
 * 
 * @param slug - Connector slug identifier
 * @param toolName - Name of the tool to execute
 * @param args - Tool input arguments
 * @returns Pipeline job representing the execution
 * @throws {Error} If connector not found or user not authenticated
 */
export async function executeTool(
  slug: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<PipelineJob> {
  // Implementation
}

// ✅ Good - Inline for clarity
// Check if token has expired
if (expiresAt && new Date(expiresAt) < new Date()) {
  // Refresh token logic
}

// ❌ Bad - Obvious comments
const user = getUser();  // Get the user
```

### Error Handling

```typescript
// ✅ Good
try {
  const result = await executeTool(slug, toolName, args);
  toast({
    title: 'Success',
    description: 'Tool executed successfully'
  });
  return result;
} catch (error) {
  console.error('Tool execution failed:', error);
  toast({
    title: 'Error',
    description: error instanceof Error ? error.message : 'Unknown error',
    variant: 'destructive'
  });
  throw error;
}

// ❌ Bad
try {
  await executeTool(slug, toolName, args);
} catch (error) {
  // Silent failure
}
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `revert`: Revert previous commit

### Examples

```bash
# Simple feature
git commit -m "feat: add GitHub connector integration"

# Bug fix with scope
git commit -m "fix(auth): resolve token refresh race condition"

# Breaking change
git commit -m "feat(api)!: change executeTool signature

BREAKING CHANGE: executeTool now requires connectorId instead of slug"

# Multiple changes
git commit -m "feat: add real-time job updates

- Subscribe to job status changes
- Update UI on job completion
- Add loading indicators

Closes #123"
```

### Commit Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Capitalize first letter
- No period at the end
- Reference issues and PRs when relevant
- Keep subject line under 72 characters
- Separate subject from body with blank line

---

## Pull Request Process

### Before Submitting

1. **Ensure your code follows standards**
   ```bash
   npm run lint
   npm run type-check
   ```

2. **Test your changes**
   - Manually test affected features
   - Ensure no regressions
   - Test on different browsers (if UI changes)

3. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update CHANGELOG.md

4. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
How was this tested?
- [ ] Manual testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Dependent changes merged

## Related Issues
Closes #(issue number)
```

### Review Process

1. **Automated Checks**
   - Linting passes
   - Type checking passes
   - Build succeeds

2. **Code Review**
   - At least one approval required
   - Address all comments
   - Make requested changes

3. **Merge**
   - Squash and merge (preferred)
   - Maintainer will merge once approved

### After Merge

- Delete your branch
- Update your local repository
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

---

## Testing Guidelines

### Test Structure

```typescript
// ✅ Example test structure (when tests are added)
describe('useAuth hook', () => {
  it('should initialize with loading state', () => {
    // Test implementation
  });
  
  it('should sign in successfully', async () => {
    // Test implementation
  });
  
  it('should handle sign in errors', async () => {
    // Test implementation
  });
});
```

### What to Test

1. **Critical User Flows**
   - Authentication
   - Connector connection/disconnection
   - Tool execution

2. **Edge Cases**
   - Empty states
   - Error conditions
   - Network failures

3. **Business Logic**
   - Data transformations
   - Validation logic
   - State management

### Testing Best Practices

- Test behavior, not implementation
- Use meaningful test descriptions
- Keep tests isolated and independent
- Mock external dependencies
- Test error cases

---

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Fixing bugs that affect documented behavior
- Adding configuration options
- Changing environment variables

### Documentation Files

- **README.md** - Overview, setup, usage
- **ARCHITECTURE.md** - Technical architecture
- **CHANGELOG.md** - Version history
- **API.md** - API documentation (when added)
- Code comments - Inline documentation

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams for complex concepts
- Keep formatting consistent
- Update table of contents

---

## Community

### Getting Help

- **GitHub Discussions** - Ask questions, share ideas
- **GitHub Issues** - Report bugs, request features
- **Discord** (coming soon) - Real-time chat

### Stay Updated

- Watch the repository for updates
- Follow release notes
- Join our mailing list (coming soon)

### Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- CONTRIBUTORS.md file (coming soon)

---

## Questions?

If you have questions about contributing, feel free to:
- Open a GitHub Discussion
- Comment on relevant issues
- Contact maintainers

Thank you for contributing to Tool Connect Craft! 🎉
