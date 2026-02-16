import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHealthAlerts } from '../useHealthAlerts';

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock supabase
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
  },
}));

describe('useHealthAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns sendHealthAlerts and triggerManualAlert functions', () => {
    const { result } = renderHook(() => useHealthAlerts());
    expect(typeof result.current.sendHealthAlerts).toBe('function');
    expect(typeof result.current.triggerManualAlert).toBe('function');
  });

  it('returns early with success when given empty array', async () => {
    const { result } = renderHook(() => useHealthAlerts());

    let response: unknown;
    await act(async () => {
      response = await result.current.sendHealthAlerts([]);
    });

    expect(response).toEqual({ success: true, sent: 0 });
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('filters out healthy results and returns early if none alertable', async () => {
    const { result } = renderHook(() => useHealthAlerts());

    let response: unknown;
    await act(async () => {
      response = await result.current.sendHealthAlerts([
        { connector: 'Gmail', slug: 'gmail', status: 'healthy' },
      ]);
    });

    expect(response).toEqual({ success: true, sent: 0 });
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('invokes send-health-alert for unhealthy results', async () => {
    mockInvoke.mockResolvedValue({ data: { sent: 1, results: [] }, error: null });
    const { result } = renderHook(() => useHealthAlerts());

    await act(async () => {
      await result.current.sendHealthAlerts([
        { connector: 'Slack', slug: 'slack', status: 'unhealthy', error: 'timeout' },
      ]);
    });

    expect(mockInvoke).toHaveBeenCalledWith('send-health-alert', {
      body: [expect.objectContaining({
        connectorName: 'Slack',
        connectorSlug: 'slack',
        status: 'unhealthy',
        error: 'timeout',
      })],
    });
  });

  it('shows toast when alerts are sent', async () => {
    mockInvoke.mockResolvedValue({ data: { sent: 2 }, error: null });
    const { result } = renderHook(() => useHealthAlerts());

    await act(async () => {
      await result.current.sendHealthAlerts([
        { connector: 'Slack', slug: 'slack', status: 'degraded' },
        { connector: 'GitHub', slug: 'github', status: 'unhealthy' },
      ]);
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Alerts Sent',
    }));
  });

  it('shows error toast on invoke failure', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Network error' } });
    const { result } = renderHook(() => useHealthAlerts());

    let response: unknown;
    await act(async () => {
      response = await result.current.sendHealthAlerts([
        { connector: 'Slack', slug: 'slack', status: 'unhealthy' },
      ]);
    });

    expect(response).toEqual({ success: false, error: 'Network error' });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Alert Failed',
      variant: 'destructive',
    }));
  });

  it('handles thrown exceptions gracefully', async () => {
    mockInvoke.mockRejectedValue(new Error('Connection refused'));
    const { result } = renderHook(() => useHealthAlerts());

    let response: unknown;
    await act(async () => {
      response = await result.current.sendHealthAlerts([
        { connector: 'Notion', slug: 'notion', status: 'unhealthy' },
      ]);
    });

    expect(response).toEqual({ success: false, error: 'Connection refused' });
  });

  it('triggerManualAlert delegates to sendHealthAlerts', async () => {
    mockInvoke.mockResolvedValue({ data: { sent: 1 }, error: null });
    const { result } = renderHook(() => useHealthAlerts());

    await act(async () => {
      await result.current.triggerManualAlert('Gmail', 'gmail', 'degraded', 'slow');
    });

    expect(mockInvoke).toHaveBeenCalledWith('send-health-alert', {
      body: [expect.objectContaining({
        connectorName: 'Gmail',
        status: 'degraded',
        error: 'slow',
      })],
    });
  });
});
