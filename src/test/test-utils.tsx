/**
 * Shared test utilities providing wrapper components with required providers.
 */
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';

/**
 * Wrapper that provides AuthProvider context for tests.
 * Use this when testing hooks/components that depend on useAuth.
 */
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/**
 * Creates a wrapper function suitable for renderHook's `wrapper` option.
 */
export function createAuthWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
}
