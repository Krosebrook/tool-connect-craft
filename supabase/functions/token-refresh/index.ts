import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

interface RefreshResult {
  connectionId: string;
  connectorName: string;
  success: boolean;
  error?: string;
  expiresAt?: string;
}

const TOKEN_URLS: Record<string, string> = {
  google: "https://oauth2.googleapis.com/token",
  github: "https://github.com/login/oauth/access_token",
  slack: "https://slack.com/api/oauth.v2.access",
};

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

// Decrypt token from storage
async function decryptToken(encryptedToken: string, key: CryptoKey): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedToken), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt token");
  }
}

// Encrypt token for storage
async function encryptToken(token: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(token)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Get encryption key
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyMaterial = Deno.env.get("TOKEN_ENCRYPTION_KEY") || "default-key-change-in-production";
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.digest("SHA-256", encoder.encode(keyMaterial));

  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function refreshTokenForProvider(
  provider: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> {
  const tokenUrl = TOKEN_URLS[provider.toLowerCase()];

  if (!tokenUrl) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  // GitHub doesn't support refresh tokens in the same way
  if (provider.toLowerCase() === "github") {
    throw new Error("GitHub does not support token refresh - re-authentication required");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token refresh failed: ${response.status} - ${errorText}`);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();

  // Handle Slack's different response format
  if (provider.toLowerCase() === "slack") {
    if (!data.ok) {
      throw new Error(`Slack token refresh failed: ${data.error}`);
    }
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: "Bearer",
      expires_in: data.expires_in,
      scope: data.scope,
    };
  }

  // Handle error responses
  if (data.error) {
    throw new Error(`Token refresh error: ${data.error_description || data.error}`);
  }

  return data as TokenResponse;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();
  const results: RefreshResult[] = [];

  try {
    // Parse optional request body for specific connection
    let targetConnectionId: string | null = null;
    let forceRefresh = false;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        targetConnectionId = body.connectionId || null;
        forceRefresh = body.force || false;
      } catch {
        // No body provided, that's fine
      }
    }

    // Build query for connections to refresh
    let query = supabase
      .from("user_connections")
      .select("*, connectors(*)")
      .eq("status", "active")
      .not("secret_ref_refresh", "is", null);

    if (targetConnectionId) {
      query = query.eq("id", targetConnectionId);
    } else if (!forceRefresh) {
      // Only refresh tokens expiring within the next 5 minutes
      const expirationThreshold = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      query = query.lt("expires_at", expirationThreshold);
    }

    const { data: connections, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching connections:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch connections" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No tokens need refreshing",
          refreshed: 0,
          results: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${connections.length} connection(s) to refresh`);

    const encryptionKey = await getEncryptionKey();

    for (const connection of connections) {
      const connector = connection.connectors;
      const providerSlug = connector.oauth_provider || connector.slug;

      console.log(`Refreshing token for connection ${connection.id} (${providerSlug})`);

      try {
        // Decrypt the refresh token
        const refreshToken = await decryptToken(connection.secret_ref_refresh!, encryptionKey);

        // Get client credentials
        const oauthConfig = connector.oauth_config as { client_id?: string; client_secret?: string } | null;
        const clientId = oauthConfig?.client_id ||
          Deno.env.get(`${providerSlug.toUpperCase()}_CLIENT_ID`);
        const clientSecret = oauthConfig?.client_secret ||
          Deno.env.get(`${providerSlug.toUpperCase()}_CLIENT_SECRET`);

        if (!clientId || !clientSecret) {
          throw new Error(`OAuth credentials not configured for ${providerSlug}`);
        }

        // Refresh the token
        const tokens = await refreshTokenForProvider(
          providerSlug,
          refreshToken,
          clientId,
          clientSecret
        );

        // Encrypt new tokens
        const encryptedAccessToken = await encryptToken(tokens.access_token, encryptionKey);
        const encryptedRefreshToken = tokens.refresh_token
          ? await encryptToken(tokens.refresh_token, encryptionKey)
          : connection.secret_ref_refresh; // Keep old refresh token if new one not provided

        // Calculate new expiration
        const expiresAt = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null;

        // Update the connection
        const { error: updateError } = await supabase
          .from("user_connections")
          .update({
            secret_ref_access: encryptedAccessToken,
            secret_ref_refresh: encryptedRefreshToken,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        if (updateError) {
          throw new Error(`Failed to update connection: ${updateError.message}`);
        }

        console.log(`Successfully refreshed token for ${connector.name}`);

        results.push({
          connectionId: connection.id,
          connectorName: connector.name,
          success: true,
          expiresAt: expiresAt || undefined,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to refresh ${connector.name}:`, errorMessage);

        // Mark connection as expired if refresh fails
        await supabase
          .from("user_connections")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        results.push({
          connectionId: connection.id,
          connectorName: connector.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(`Token refresh complete: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        refreshed: successCount,
        failed: failureCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Token refresh error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
