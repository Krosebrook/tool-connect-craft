/**
 * Unit tests for ConnectorContext provider.
 * @module ConnectorContext.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { ConnectorProvider, useConnectors } from '../ConnectorContext';

describe('ConnectorProvider', () => {
  it('renders children', async () => {
    function Child() {
      const ctx = useConnectors();
      return <div data-testid="child">Hello</div>;
    }

    render(
      <ConnectorProvider>
        <Child />
      </ConnectorProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();

    // Wait for async loading to settle
    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('provides context value to children', async () => {
    function Consumer() {
      const ctx = useConnectors();
      return <div data-testid="loading">{String(ctx.loading)}</div>;
    }

    render(
      <ConnectorProvider>
        <Consumer />
      </ConnectorProvider>
    );

    // Initially loading is true, then transitions to false
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('exposes connectors as an array', async () => {
    function Consumer() {
      const ctx = useConnectors();
      return <div data-testid="count">{ctx.connectors.length}</div>;
    }

    render(
      <ConnectorProvider>
        <Consumer />
      </ConnectorProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('count')).toBeInTheDocument();
    });
  });

  it('exposes tools as a Map', async () => {
    function Consumer() {
      const ctx = useConnectors();
      return <div data-testid="is-map">{String(ctx.tools instanceof Map)}</div>;
    }

    render(
      <ConnectorProvider>
        <Consumer />
      </ConnectorProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-map').textContent).toBe('true');
    });
  });

  it('exposes action methods', async () => {
    function Consumer() {
      const ctx = useConnectors();
      const hasActions =
        typeof ctx.connect === 'function' &&
        typeof ctx.disconnect === 'function' &&
        typeof ctx.executeTool === 'function' &&
        typeof ctx.getConnectorWithConnection === 'function' &&
        typeof ctx.getToolsForConnector === 'function' &&
        typeof ctx.fetchEventsForJob === 'function';
      return <div data-testid="has-actions">{String(hasActions)}</div>;
    }

    render(
      <ConnectorProvider>
        <Consumer />
      </ConnectorProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-actions').textContent).toBe('true');
    });
  });
});

describe('useConnectors', () => {
  it('throws when used outside ConnectorProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useConnectors());
    }).toThrow('useConnectors must be used within a ConnectorProvider');

    spy.mockRestore();
  });

  it('does not throw when used inside ConnectorProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConnectorProvider>{children}</ConnectorProvider>
    );

    expect(() => {
      renderHook(() => useConnectors(), { wrapper });
    }).not.toThrow();
  });
});
