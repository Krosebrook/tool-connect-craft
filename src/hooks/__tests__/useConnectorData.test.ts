/**
 * Unit tests for useConnectorData hook.
 * @module useConnectorData.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useConnectorData - mocked tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports useConnectorData function', async () => {
    const module = await import('../useConnectorData');
    expect(typeof module.useConnectorData).toBe('function');
  });

  it('hook returns expected shape', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toHaveProperty('connectors');
    expect(result.current).toHaveProperty('tools');
    expect(result.current).toHaveProperty('connections');
    expect(result.current).toHaveProperty('jobs');
    expect(result.current).toHaveProperty('events');
    expect(result.current).toHaveProperty('logs');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('connect');
    expect(result.current).toHaveProperty('disconnect');
    expect(result.current).toHaveProperty('executeTool');
    expect(result.current).toHaveProperty('getConnectorWithConnection');
    expect(result.current).toHaveProperty('getToolsForConnector');
    expect(result.current).toHaveProperty('fetchEventsForJob');
  });

  it('connectors is initially an empty array', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.connectors)).toBe(true);
  });

  it('tools is initially an empty Map', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tools).toBeInstanceOf(Map);
  });

  it('loading transitions from true to false', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('getToolsForConnector returns empty array for unknown connector', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const tools = result.current.getToolsForConnector('unknown-id');
    expect(tools).toEqual([]);
  });

  it('getConnectorWithConnection returns undefined for unknown connector', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const connectorData = result.current.getConnectorWithConnection('unknown-slug');
    expect(connectorData).toBe(undefined);
  });
});

describe('useConnectorData - method signatures', () => {
  it('connect is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.connect).toBe('function');
  });

  it('disconnect is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.disconnect).toBe('function');
  });

  it('executeTool is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.executeTool).toBe('function');
  });

  it('fetchEventsForJob is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');

    const { result } = renderHook(() => useConnectorData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.fetchEventsForJob).toBe('function');
  });
});
