import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OAuthCallbackRequest {
  code: string;
  state: string;
  codeVerifier: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
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

// Hash the code verifier for comparison
async function hashCodeVerifier(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Generate a secure reference ID for vault storage
function generateSecretRef(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `vault_${Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

// Encrypt token for storage (application-layer encryption)
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

// Get or generate encryption key
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

async function exchangeCodeForTokens(
  provider: string,
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> {
  const tokenUrl = TOKEN_URLS[provider.toLowerCase()];
  
  if (!tokenUrl) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: codeVerifier,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // GitHub requires Accept header for JSON response
  if (provider.toLowerCase() === "github") {
    headers["Accept"] = "application/json";
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token exchange failed: ${response.status} - ${errorText}`);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  // Handle Slack's different response format
  if (provider.toLowerCase() === "slack") {
    if (!data.ok) {
      throw new Error(`Slack token exchange failed: ${data.error}`);
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
    throw new Error(`Token exchange error: ${data.error_description || data.error}`);
  }

  return data as TokenResponse;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    const body: OAuthCallbackRequest = await req.json();
    const { code, state, codeVerifier } = body;

    console.log(`OAuth callback: state=${state}`);

    // Validate required fields
    if (!code || !state || !codeVerifier) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: code, state, codeVerifier",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the OAuth transaction
    const { data: transaction, error: txError } = await supabase
      .from("oauth_transactions")
      .select("*, connectors(*)")
      .eq("state", state)
      .eq("status", "started")
      .single();

    if (txError || !transaction) {
      console.error("OAuth transaction not found:", txError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired OAuth state",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify code verifier hash
    const verifierHash = await hashCodeVerifier(codeVerifier);
    if (verifierHash !== transaction.code_verifier_hash) {
      console.error("Code verifier mismatch");
      
      await supabase
        .from("oauth_transactions")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({ success: false, error: "Invalid code verifier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connector details
    const connector = transaction.connectors;
    const providerSlug = connector.oauth_provider || connector.slug;

    // Get client credentials
    const oauthConfig = connector.oauth_config as { client_id?: string; client_secret?: string } | null;
    const clientId = oauthConfig?.client_id || 
      Deno.env.get(`${providerSlug.toUpperCase()}_CLIENT_ID`);
    const clientSecret = oauthConfig?.client_secret || 
      Deno.env.get(`${providerSlug.toUpperCase()}_CLIENT_SECRET`);

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `OAuth credentials not configured for ${providerSlug}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for tokens
    console.log(`Exchanging code for tokens with ${providerSlug}`);
    
    const tokens = await exchangeCodeForTokens(
      providerSlug,
      code,
      codeVerifier,
      transaction.redirect_uri,
      clientId,
      clientSecret
    );

    console.log(`Token exchange successful for ${providerSlug}`);

    // Encrypt tokens for storage
    const encryptionKey = await getEncryptionKey();
    const encryptedAccessToken = await encryptToken(tokens.access_token, encryptionKey);
    const encryptedRefreshToken = tokens.refresh_token 
      ? await encryptToken(tokens.refresh_token, encryptionKey)
      : null;

    // Generate secret references
    const accessSecretRef = generateSecretRef();
    const refreshSecretRef = tokens.refresh_token ? generateSecretRef() : null;

    // Calculate expiration
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Check if user connection exists
    const { data: existingConnection } = await supabase
      .from("user_connections")
      .select("id")
      .eq("user_id", transaction.user_id)
      .eq("connector_id", transaction.connector_id)
      .single();

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from("user_connections")
        .update({
          secret_ref_access: encryptedAccessToken,
          secret_ref_refresh: encryptedRefreshToken,
          status: "active",
          expires_at: expiresAt,
          scopes: tokens.scope?.split(/[,\s]+/) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConnection.id);

      if (updateError) {
        console.error("Failed to update connection:", updateError);
        throw new Error("Failed to update connection");
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from("user_connections")
        .insert({
          user_id: transaction.user_id,
          connector_id: transaction.connector_id,
          secret_ref_access: encryptedAccessToken,
          secret_ref_refresh: encryptedRefreshToken,
          status: "active",
          expires_at: expiresAt,
          scopes: tokens.scope?.split(/[,\s]+/) || null,
        });

      if (insertError) {
        console.error("Failed to create connection:", insertError);
        throw new Error("Failed to create connection");
      }
    }

    // Mark transaction as completed
    await supabase
      .from("oauth_transactions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", transaction.id);

    console.log(`OAuth flow completed for user ${transaction.user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "OAuth connection established",
        connectorId: transaction.connector_id,
        connectorName: connector.name,
        scopes: tokens.scope?.split(/[,\s]+/) || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
