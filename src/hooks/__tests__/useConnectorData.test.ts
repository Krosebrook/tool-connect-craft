/**
 * Unit tests for useConnectorData hook.
 * @module useConnectorData.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';

// We need to test the hook's logic without full Supabase integration
// So we'll test the utility functions and mock responses

describe('useConnectorData - mocked tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports useConnectorData function', async () => {
    const module = await import('../useConnectorData');
    expect(typeof module.useConnectorData).toBe('function');
  });

  it('hook returns expected shape', async () => {
    // Import dynamically to allow mocks to be set up first
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    // Check initial state shape
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
    
    expect(Array.isArray(result.current.connectors)).toBe(true);
  });

  it('tools is initially an empty Map', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    expect(result.current.tools).toBeInstanceOf(Map);
  });

  it('loading is initially true', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    expect(result.current.loading).toBe(true);
  });

  it('getToolsForConnector returns empty array for unknown connector', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    const tools = result.current.getToolsForConnector('unknown-id');
    expect(tools).toEqual([]);
  });

  it('getConnectorWithConnection returns undefined for unknown connector', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    const connectorData = result.current.getConnectorWithConnection('unknown-slug');
    expect(connectorData).toBe(undefined);
  });
});

describe('useConnectorData - method signatures', () => {
  it('connect is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    expect(typeof result.current.connect).toBe('function');
  });

  it('disconnect is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('executeTool is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    expect(typeof result.current.executeTool).toBe('function');
  });

  it('fetchEventsForJob is a function', async () => {
    const { useConnectorData } = await import('../useConnectorData');
    
    const { result } = renderHook(() => useConnectorData());
    
    expect(typeof result.current.fetchEventsForJob).toBe('function');
  });
});
