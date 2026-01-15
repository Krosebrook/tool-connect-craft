/**
 * Unit tests for AuthContext and useAuth hook.
 * @module AuthContext.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('provides initial loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('provides signIn method', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password');
      expect(response.error).toBe(null);
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles signIn errors', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'wrong');
      expect(response.error).toBeInstanceOf(Error);
      expect(response.error?.message).toBe('Invalid credentials');
    });
  });

  it('provides signUp method', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.signUp('new@example.com', 'password');
      expect(response.error).toBe(null);
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password',
      options: expect.objectContaining({
        emailRedirectTo: expect.stringContaining('/'),
      }),
    });
  });

  it('provides signOut method', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('sets up auth state listener on mount', () => {
    renderHook(() => useAuth(), { wrapper });
    
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    expect(supabase.auth.getSession).toHaveBeenCalled();
  });
});

describe('AuthProvider', () => {
  it('renders children', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current).toBeDefined();
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});
