# Testing Guide

> Test strategy, tooling, and guidelines for MCP Connector Hub.

---

## Overview

The project uses a two-tier testing approach:

| Layer | Tool | Location | Purpose |
|-------|------|----------|---------|
| Unit / Component | Vitest + React Testing Library | `src/**/*.test.ts(x)` | Pure logic, hooks, components |
| Edge Function | Deno built-in test runner | `supabase/functions/*/*.test.ts` | Backend function behavior |

---

## Running Tests

### Unit & Component Tests

```bash
# Run all tests once
npm test -- --run

# Watch mode (re-runs on file changes)
npm test

# Run a specific file
npx vitest run src/lib/__tests__/validation.test.ts

# With coverage report
npx vitest run --coverage
```

### Edge Function Tests

```bash
# All edge functions
deno test supabase/functions/ --allow-net --allow-env

# Specific function
deno test supabase/functions/test-webhook/ --allow-net --allow-env
```

---

## Project Configuration

### Vitest (`vitest.config.ts`)

- **Environment**: `jsdom` (browser simulation)
- **Globals**: Enabled (`describe`, `it`, `expect` available without imports)
- **Setup file**: `src/test/setup.ts` — mocks Supabase client, `matchMedia`, `ResizeObserver`
- **Path alias**: `@/` → `src/`

### Coverage

Coverage is collected for core logic directories:

```
src/lib/**      — utilities, formatters, validation
src/hooks/**    — custom React hooks
src/context/**  — context providers
```

Excluded: test files, UI components (tested via integration/E2E).

---

## Test Structure

### File Placement

| Pattern | Example |
|---------|---------|
| Co-located `__tests__/` dir | `src/lib/__tests__/validation.test.ts` |
| Adjacent `.test.tsx` file | `src/hooks/__tests__/useConnectorData.test.ts` |

### Naming Convention

```
<module-name>.test.ts    — pure logic
<Component>.test.tsx     — React components
```

---

## Writing Tests

### Unit Test (Pure Function)

```typescript
import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '@/lib/formatters';

describe('formatRelativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('handles null input gracefully', () => {
    expect(formatRelativeTime(null)).toBe('Never');
  });
});
```

### Hook Test

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  it('returns the initial value', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default')
    );
    expect(result.current[0]).toBe('default');
  });

  it('updates stored value', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default')
    );
    act(() => result.current[1]('updated'));
    expect(result.current[0]).toBe('updated');
  });
});
```

### Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobStatusBadge } from '@/components/ui/job-status-badge';

describe('JobStatusBadge', () => {
  it('renders the correct status text', () => {
    render(<JobStatusBadge status="succeeded" />);
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
  });
});
```

### Edge Function Test (Deno)

```typescript
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("health-check returns 200", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const body = await res.text(); // always consume body
  assertEquals(res.status, 200);
});
```

> ⚠️ Always consume the response body (`await res.text()`) in Deno tests to prevent resource leaks.

---

## Mocking

### Supabase Client

The global mock in `src/test/setup.ts` stubs all Supabase methods. Override per-test:

```typescript
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { id: '1', name: 'Test Connector' },
    error: null,
  }),
} as any);
```

### Browser APIs

`matchMedia` and `ResizeObserver` are mocked globally in `setup.ts`. Add additional mocks as needed:

```typescript
// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

---

## Guidelines

1. **Test behavior, not implementation** — assert on outputs and DOM content, not internal state.
2. **One assertion focus per test** — each `it()` block should verify one logical behavior.
3. **Descriptive names** — use `it('returns empty array when no connectors match filter')` not `it('works')`.
4. **Avoid snapshot tests** — they create brittle tests; prefer explicit assertions.
5. **Mock at boundaries** — mock Supabase, `fetch`, and browser APIs; don't mock internal modules.
6. **Handle async properly** — always `await` async operations; use `waitFor` for React state updates.
7. **Clean up** — use `afterEach` / `afterAll` to reset mocks and DOM state.

---

## CI Integration

Tests run automatically in the GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. **Lint** → ESLint
2. **Type Check** → `tsc --noEmit`
3. **Unit Tests** → `vitest run --reporter=verbose`
4. **Build** → `vite build`
5. **Security Scan** → `npm audit`
6. **Lighthouse** → performance audit (main branch only)

Coverage reports are uploaded to Codecov on every run.

---

## Existing Tests

| File | Covers |
|------|--------|
| `src/lib/__tests__/formatters.test.ts` | Date/number formatting utilities |
| `src/lib/__tests__/validation.test.ts` | Input validation (URL, cron, JSON Schema) |
| `src/hooks/__tests__/useConnectorData.test.ts` | Core data fetching hook |

---

## Adding a New Test Checklist

- [ ] File follows `*.test.ts(x)` naming convention
- [ ] Placed in `__tests__/` directory or adjacent to source file
- [ ] Uses `describe` / `it` / `expect` from Vitest globals
- [ ] Mocks external dependencies (Supabase, fetch, browser APIs)
- [ ] All async operations are properly awaited
- [ ] No hardcoded secrets or environment values
- [ ] Passes locally with `npx vitest run`
