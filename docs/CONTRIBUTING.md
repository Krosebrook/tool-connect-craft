# Contributing to Tool Connect Craft

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Issue Guidelines](#issue-guidelines)
8. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race, ethnicity, or nationality
- Age
- Religion

### Expected Behavior

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling, insulting, or derogatory comments
- Public or private harassment
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report issues to: conduct@toolconnectcraft.dev

---

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:
1. **Search existing issues** to avoid duplicates
2. **Verify the bug** in the latest version
3. **Collect information**:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Environment (browser, OS, Node version)

**Use the bug report template** when creating an issue.

### Suggesting Features

Feature suggestions are welcome! Before submitting:
1. **Check the roadmap** to see if it's already planned
2. **Search existing feature requests**
3. **Provide context**:
   - Use case and problem statement
   - Proposed solution
   - Alternatives considered
   - Additional context

**Use the feature request template** when creating an issue.

### Improving Documentation

Documentation improvements are always appreciated:
- Fix typos or grammatical errors
- Clarify confusing sections
- Add examples or tutorials
- Update outdated information
- Translate documentation (future)

Small fixes can be submitted directly as PRs.

### Writing Code

Code contributions can include:
- Bug fixes
- New features (discuss in issue first)
- Performance improvements
- Code refactoring
- Test coverage improvements

**Always discuss major changes in an issue before starting work.**

---

## Development Setup

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Git
- A code editor (VS Code recommended)
- Supabase account (free tier)

### Setup Steps

1. **Fork the repository**
   ```bash
   # Via GitHub UI: click "Fork" button
   ```

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

5. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

6. **Run database migrations**
   ```bash
   # Option 1: Supabase CLI (recommended)
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   
   # Option 2: Manual via Supabase Dashboard
   # Copy/paste supabase/migrations/*.sql in SQL Editor
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

### Keeping Your Fork Updated

```bash
# Fetch latest changes
git fetch upstream

# Merge into your local main
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

---

## Coding Standards

### General Principles

- **KISS**: Keep It Simple, Stupid
- **DRY**: Don't Repeat Yourself
- **YAGNI**: You Aren't Gonna Need It
- **Write self-documenting code** with clear names
- **Comment when necessary** but prefer clarity over comments

### TypeScript

- Use TypeScript for all new code (no `.js` files)
- Enable strict mode (already configured)
- Define interfaces for all props and major data structures
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

Example:
```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

function fetchUser(id: string): Promise<UserProfile> {
  // ...
}

// Avoid
function fetchUser(id: any): any {
  // ...
}
```

### React

- Use functional components (no class components)
- Use hooks for state and side effects
- Prefer named exports over default exports
- Destructure props in function signature
- Use React.memo() for performance when needed

Example:
```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}

// Avoid
export default function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `ConnectorCard`)
- **Functions/Variables**: camelCase (`fetchUser`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`User`, `ConnectionStatus`)
- **Files**: Match export name

### Styling

- Use Tailwind CSS utility classes
- Use shadcn/ui components for consistency
- Avoid custom CSS unless absolutely necessary
- Use `cn()` utility for conditional classes

Example:
```typescript
import { cn } from '@/lib/utils';

export function Badge({ status, className }: BadgeProps) {
  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-sm',
      status === 'active' && 'bg-green-100 text-green-800',
      status === 'error' && 'bg-red-100 text-red-800',
      className
    )}>
      {status}
    </span>
  );
}
```

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages to users
- Log errors for debugging
- Use try-catch for async operations
- Don't swallow errors silently

Example:
```typescript
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Failed to fetch data:', error);
  toast({
    title: 'Error',
    description: 'Failed to load data. Please try again.',
    variant: 'destructive',
  });
  throw error; // Re-throw if caller needs to handle
}
```

---

## Commit Guidelines

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

**Scope** (optional): Component or area affected (e.g., `auth`, `connectors`, `ui`)

**Subject**: Short description (50 chars max, lowercase, no period)

**Body** (optional): Detailed description

**Footer** (optional): Breaking changes, issue references

### Examples

```
feat(connectors): add GitHub OAuth integration

Implement complete OAuth flow for GitHub connector including:
- Authorization URL generation
- Callback handling
- Token exchange

Closes #42
```

```
fix(auth): prevent session expiration on page reload

Previously, sessions would expire immediately on refresh.
Now properly restoring session from localStorage.

Fixes #38
```

```
docs: update installation instructions

Add troubleshooting section for common setup issues
```

### Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep subject line concise
- Reference issues in footer
- Separate subject from body with blank line

---

## Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   # npm run test (when tests are added)
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:
   - Description of changes
   - Related issue(s)
   - Screenshots (if UI changes)
   - Checklist items

### PR Review Process

1. **Automated checks** run (linting, build)
2. **Code review** by maintainers
3. **Requested changes** addressed by contributor
4. **Approval** and merge by maintainer

### PR Guidelines

- **One feature per PR** - keep PRs focused
- **Small PRs** - easier to review (<300 lines ideal)
- **Clear description** - explain what and why
- **Screenshots** - for UI changes
- **Tests** - when applicable
- **Documentation** - update if needed

### After Merge

1. Delete your feature branch
2. Update your fork
3. Celebrate! 🎉

---

## Issue Guidelines

### Creating Issues

**Bug Reports** should include:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs

**Feature Requests** should include:
- Clear title
- Problem statement
- Proposed solution
- Use cases
- Mockups (if UI-related)

### Labels

- `bug`: Something isn't working
- `feature`: New feature request
- `documentation`: Documentation improvements
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `question`: Further information requested
- `wontfix`: Will not be worked on

### Issue Lifecycle

1. **Triage**: Maintainer reviews and labels
2. **Discussion**: Community discusses approach
3. **Assignment**: Developer picks up work
4. **Development**: Work in progress
5. **Review**: PR submitted and reviewed
6. **Closed**: Issue resolved or declined

---

## Community

### Getting Help

- **Documentation**: Check docs folder first
- **GitHub Discussions**: Ask questions, share ideas
- **GitHub Issues**: Report bugs, request features
- **Discord** (coming soon): Real-time chat

### Recognition

Contributors are recognized:
- CONTRIBUTORS.md file
- Release notes
- Social media shoutouts (with permission)

### Becoming a Maintainer

Active contributors may be invited to join as maintainers based on:
- Quality of contributions
- Consistency and reliability
- Community engagement
- Alignment with project values

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Don't hesitate to ask! We're here to help:
- Open a GitHub Discussion
- Comment on an issue
- Email: contribute@toolconnectcraft.dev

**Thank you for contributing to Tool Connect Craft!** 🚀
