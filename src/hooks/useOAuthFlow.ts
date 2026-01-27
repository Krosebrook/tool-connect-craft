import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OAuthStartResponse {
  success: boolean;
  authorizationUrl?: string;
  state?: string;
  codeVerifier?: string;
  error?: string;
}

interface OAuthCallbackResponse {
  success: boolean;
  connectorId?: string;
  connectorName?: string;
  scopes?: string[];
  error?: string;
}

interface OAuthState {
  isConnecting: boolean;
  connectorId: string | null;
  error: string | null;
}

// Internal user ID for this internal app
const INTERNAL_USER_ID = '00000000-0000-0000-0000-000000000001';

// Storage keys for OAuth state
const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_VERIFIER_KEY = 'oauth_verifier';
const OAUTH_CONNECTOR_KEY = 'oauth_connector';

/**
 * Hook to manage OAuth 2.0 + PKCE connection flows.
 * Handles initiating OAuth, storing state, and processing callbacks.
 */
export function useOAuthFlow(onConnectionComplete?: () => void) {
  const { toast } = useToast();
  const [oauthState, setOAuthState] = useState<OAuthState>({
    isConnecting: false,
    connectorId: null,
    error: null,
  });

  // Check for OAuth callback on mount
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      // Not an OAuth callback
      if (!state) return;

      // Check if this matches our stored state
      const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      if (state !== storedState) return;

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);

      if (error) {
        const errorDescription = urlParams.get('error_description') || 'OAuth authorization failed';
        toast({
          title: 'Connection Failed',
          description: errorDescription,
          variant: 'destructive',
        });
        clearOAuthStorage();
        return;
      }

      if (code) {
        await processOAuthCallback(code, state);
      }
    };

    handleOAuthCallback();
  }, []);

  // Process OAuth callback
  const processOAuthCallback = async (code: string, state: string) => {
    const codeVerifier = sessionStorage.getItem(OAUTH_VERIFIER_KEY);
    const connectorId = sessionStorage.getItem(OAUTH_CONNECTOR_KEY);

    if (!codeVerifier) {
      toast({
        title: 'Connection Failed',
        description: 'OAuth session expired. Please try again.',
        variant: 'destructive',
      });
      clearOAuthStorage();
      return;
    }

    setOAuthState({
      isConnecting: true,
      connectorId,
      error: null,
    });

    try {
      const { data, error } = await supabase.functions.invoke<OAuthCallbackResponse>(
        'oauth-callback',
        {
          body: { code, state, codeVerifier },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast({
          title: 'Connected Successfully',
          description: `${data.connectorName} is now connected.`,
        });
        onConnectionComplete?.();
      } else {
        throw new Error(data?.error || 'Failed to complete OAuth');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OAuth callback failed';
      toast({
        title: 'Connection Failed',
        description: message,
        variant: 'destructive',
      });
      setOAuthState(prev => ({ ...prev, error: message }));
    } finally {
      clearOAuthStorage();
      setOAuthState(prev => ({ ...prev, isConnecting: false, connectorId: null }));
    }
  };

  // Clear OAuth storage
  const clearOAuthStorage = () => {
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_CONNECTOR_KEY);
  };

  // Start OAuth flow
  const startOAuthFlow = useCallback(async (connectorId: string) => {
    setOAuthState({
      isConnecting: true,
      connectorId,
      error: null,
    });

    try {
      const redirectUri = `${window.location.origin}/connectors`;

      const { data, error } = await supabase.functions.invoke<OAuthStartResponse>(
        'oauth-start',
        {
          body: {
            connectorId,
            userId: INTERNAL_USER_ID,
            redirectUri,
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success || !data.authorizationUrl) {
        throw new Error(data?.error || 'Failed to start OAuth flow');
      }

      // Store state and verifier for callback
      sessionStorage.setItem(OAUTH_STATE_KEY, data.state!);
      sessionStorage.setItem(OAUTH_VERIFIER_KEY, data.codeVerifier!);
      sessionStorage.setItem(OAUTH_CONNECTOR_KEY, connectorId);

      // Redirect to OAuth provider
      window.location.href = data.authorizationUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start OAuth';
      toast({
        title: 'Connection Failed',
        description: message,
        variant: 'destructive',
      });
      setOAuthState({
        isConnecting: false,
        connectorId: null,
        error: message,
      });
    }
  }, [toast]);

  // Disconnect a connection
  const disconnectConnection = useCallback(async (connectionId: string, connectorName: string) => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({
          status: 'revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Disconnected',
        description: `${connectorName} has been disconnected.`,
      });
      onConnectionComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      toast({
        title: 'Disconnect Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [toast, onConnectionComplete]);

  // Refresh token for a connection
  const refreshToken = useCallback(async (connectionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('token-refresh', {
        body: { connectionId, force: true },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Token Refreshed',
          description: 'Connection tokens have been updated.',
        });
        onConnectionComplete?.();
      } else {
        throw new Error(data?.error || 'Failed to refresh token');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh token';
      toast({
        title: 'Refresh Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [toast, onConnectionComplete]);

  return {
    ...oauthState,
    startOAuthFlow,
    disconnectConnection,
    refreshToken,
  };
}
