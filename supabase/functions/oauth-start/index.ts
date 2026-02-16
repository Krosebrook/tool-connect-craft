import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper to extract and validate user from JWT
async function getAuthenticatedUserId(req: Request): Promise<{ userId: string | null; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null, error: "Missing or invalid Authorization header" };
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { userId: null, error: "Invalid or expired token" };
  }
  return { userId: data.claims.sub as string };
}

interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  scopes: string[];
}

interface StartOAuthRequest {
  connectorId: string;
  userId: string;
  redirectUri: string;
}

// OAuth provider configurations
const OAUTH_CONFIGS: Record<string, Omit<OAuthConfig, "clientId">> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["read:user", "user:email", "repo", "read:org"],
  },
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: [
      "channels:read",
      "chat:write",
      "users:read",
      "team:read",
    ],
  },
};

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

// Generate cryptographically secure random string
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Generate PKCE code verifier (43-128 chars)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64Encode(array)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Generate PKCE code challenge from verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64Encode(new Uint8Array(digest))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Hash the code verifier for secure storage
async function hashCodeVerifier(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    // Authenticate user from JWT
    const { userId, error: authError } = await getAuthenticatedUserId(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: authError || "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { connectorId, redirectUri } = body;

    console.log(`OAuth start request: connector=${connectorId}, user=${userId}`);

    // Validate required fields
    if (!connectorId || !redirectUri) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: connectorId, redirectUri",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch connector
    const { data: connector, error: connectorError } = await supabase
      .from("connectors")
      .select("*")
      .eq("id", connectorId)
      .single();

    if (connectorError || !connector) {
      return new Response(
        JSON.stringify({ success: false, error: "Connector not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (connector.auth_type !== "oauth") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Connector uses ${connector.auth_type} authentication, not OAuth`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth config for this provider
    const providerSlug = connector.oauth_provider || connector.slug;
    const providerConfig = OAUTH_CONFIGS[providerSlug.toLowerCase()];

    if (!providerConfig) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `OAuth not supported for provider: ${providerSlug}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client ID from connector's oauth_config or environment
    const oauthConfig = connector.oauth_config as { client_id?: string } | null;
    const clientId = oauthConfig?.client_id || 
      Deno.env.get(`${providerSlug.toUpperCase()}_CLIENT_ID`);

    if (!clientId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `OAuth client ID not configured for ${providerSlug}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);
    const codeVerifierHash = await hashCodeVerifier(codeVerifier);

    // Store transaction in database
    const { error: insertError } = await supabase.from("oauth_transactions").insert({
      user_id: userId,
      connector_id: connectorId,
      state,
      code_verifier_hash: codeVerifierHash,
      redirect_uri: redirectUri,
      status: "started",
    });

    if (insertError) {
      console.error("Failed to store OAuth transaction:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to initialize OAuth flow" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use connector's scopes or default provider scopes
    const scopes = connector.oauth_scopes || providerConfig.scopes;

    // Build authorization URL
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    // Add scopes (different formats per provider)
    if (providerSlug.toLowerCase() === "slack") {
      authParams.set("scope", scopes.join(","));
    } else {
      authParams.set("scope", scopes.join(" "));
    }

    // Google-specific parameters
    if (providerSlug.toLowerCase() === "google") {
      authParams.set("access_type", "offline");
      authParams.set("prompt", "consent");
    }

    const authorizationUrl = `${providerConfig.authUrl}?${authParams.toString()}`;

    console.log(`OAuth authorization URL generated for ${providerSlug}`);

    return new Response(
      JSON.stringify({
        success: true,
        authorizationUrl,
        state,
        // Return code verifier to client for callback (stored securely in memory/session)
        codeVerifier,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth start error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
