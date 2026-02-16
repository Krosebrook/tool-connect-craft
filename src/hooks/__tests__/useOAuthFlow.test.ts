import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOAuthFlow } from '../useOAuthFlow';

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock supabase
const mockInvoke = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
    from: () => ({ update: mockUpdate }),
  },
}));

// Prevent actual navigation
const originalLocation = window.location;

describe('useOAuthFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Mock window.location for tests
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: 'http://localhost:3000', origin: 'http://localhost:3000', pathname: '/', search: '' },
    });
    window.history.replaceState = vi.fn();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useOAuthFlow());
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.connectorId).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.startOAuthFlow).toBe('function');
    expect(typeof result.current.disconnectConnection).toBe('function');
    expect(typeof result.current.refreshToken).toBe('function');
  });

  describe('startOAuthFlow', () => {
    it('invokes oauth-start and stores state in sessionStorage', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
          state: 'test-state',
          codeVerifier: 'test-verifier',
        },
        error: null,
      });

      const { result } = renderHook(() => useOAuthFlow());

      await act(async () => {
        await result.current.startOAuthFlow('google-connector-id');
      });

      expect(mockInvoke).toHaveBeenCalledWith('oauth-start', {
        body: {
          connectorId: 'google-connector-id',
          userId: '00000000-0000-0000-0000-000000000001',
          redirectUri: 'http://localhost:3000/connectors',
        },
      });

      expect(sessionStorage.getItem('oauth_state')).toBe('test-state');
      expect(sessionStorage.getItem('oauth_verifier')).toBe('test-verifier');
      expect(sessionStorage.getItem('oauth_connector')).toBe('google-connector-id');
    });

    it('shows error toast when oauth-start fails', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Provider not configured' },
      });

      const { result } = renderHook(() => useOAuthFlow());

      await act(async () => {
        await result.current.startOAuthFlow('bad-connector');
      });

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Connection Failed',
        variant: 'destructive',
      }));
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.error).toBe('Provider not configured');
    });

    it('shows error when response has no authorizationUrl', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: 'Missing config' },
        error: null,
      });

      const { result } = renderHook(() => useOAuthFlow());

      await act(async () => {
        await result.current.startOAuthFlow('connector-id');
      });

      expect(result.current.error).toBe('Missing config');
    });
  });

  describe('disconnectConnection', () => {
    it('updates connection status and shows toast', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useOAuthFlow(onComplete));

      await act(async () => {
        await result.current.disconnectConnection('conn-123', 'Gmail');
      });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: 'revoked',
      }));
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Disconnected',
        description: 'Gmail has been disconnected.',
      }));
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('invokes token-refresh and shows success toast', async () => {
      mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
      const onComplete = vi.fn();
      const { result } = renderHook(() => useOAuthFlow(onComplete));

      await act(async () => {
        await result.current.refreshToken('conn-456');
      });

      expect(mockInvoke).toHaveBeenCalledWith('token-refresh', {
        body: { connectionId: 'conn-456', force: true },
      });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Token Refreshed',
      }));
      expect(onComplete).toHaveBeenCalled();
    });

    it('shows error toast on failure', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: 'No refresh token' },
        error: null,
      });

      const { result } = renderHook(() => useOAuthFlow());

      await act(async () => {
        await result.current.refreshToken('conn-789');
      });

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Refresh Failed',
        variant: 'destructive',
      }));
    });
  });
});
