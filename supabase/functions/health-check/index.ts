import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  connectorId: string;
  connectorName: string;
  status: "healthy" | "degraded" | "unhealthy";
  mcpServer: {
    configured: boolean;
    reachable: boolean;
    latencyMs: number | null;
    error: string | null;
  } | null;
  restApi: {
    configured: boolean;
    reachable: boolean;
    latencyMs: number | null;
    error: string | null;
  } | null;
  checkedAt: string;
}

interface Connector {
  id: string;
  name: string;
  slug: string;
  mcp_server_url: string | null;
  is_active: boolean | null;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

async function checkMCPServer(
  url: string
): Promise<{ reachable: boolean; latencyMs: number; error: string | null }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "health-check", version: "1.0.0" },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      return { reachable: true, latencyMs, error: null };
    } else {
      return {
        reachable: false,
        latencyMs,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("aborted")) {
      return { reachable: false, latencyMs, error: "Connection timeout (10s)" };
    }
    
    return { reachable: false, latencyMs, error: errorMessage };
  }
}

async function checkRESTApi(
  connectorSlug: string
): Promise<{ configured: boolean; reachable: boolean; latencyMs: number | null; error: string | null }> {
  // REST API endpoints are typically configured per-connector
  // This is a placeholder that checks if common REST patterns are reachable
  const restEndpoints: Record<string, string> = {
    google: "https://www.googleapis.com/oauth2/v3/tokeninfo",
    github: "https://api.github.com/zen",
    slack: "https://slack.com/api/api.test",
    notion: "https://api.notion.com/v1/users/me",
    linear: "https://api.linear.app/graphql",
  };

  const endpoint = restEndpoints[connectorSlug.toLowerCase()];
  
  if (!endpoint) {
    return { configured: false, reachable: false, latencyMs: null, error: null };
  }

  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // For health checks, we just need the endpoint to respond
    // 401/403 means the API is reachable but needs auth
    if (response.ok || response.status === 401 || response.status === 403) {
      return { configured: true, reachable: true, latencyMs, error: null };
    } else {
      return {
        configured: true,
        reachable: false,
        latencyMs,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return {
      configured: true,
      reachable: false,
      latencyMs,
      error: errorMessage.includes("aborted") ? "Connection timeout" : errorMessage,
    };
  }
}

interface McpCheckResult {
  configured: boolean;
  reachable: boolean;
  latencyMs: number | null;
  error: string | null;
}

interface RestCheckResult {
  configured: boolean;
  reachable: boolean;
  latencyMs: number | null;
  error: string | null;
}

function determineStatus(
  mcpResult: McpCheckResult | null,
  restResult: RestCheckResult | null
): "healthy" | "degraded" | "unhealthy" {
  const mcpHealthy = mcpResult === null || !mcpResult.configured || mcpResult.reachable;
  const restHealthy = restResult === null || !restResult.configured || restResult.reachable;

  if (mcpHealthy && restHealthy) return "healthy";
  if (mcpHealthy || restHealthy) return "degraded";
  return "unhealthy";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseClient();

  try {
    const url = new URL(req.url);
    const connectorId = url.searchParams.get("connectorId");

    console.log(`Health check request: connectorId=${connectorId || "all"}`);

    // Fetch connectors
    let query = supabase.from("connectors").select("*");
    
    if (connectorId) {
      query = query.eq("id", connectorId);
    } else {
      query = query.eq("is_active", true);
    }

    const { data: connectors, error: fetchError } = await query;

    if (fetchError) {
      console.error("Failed to fetch connectors:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch connectors" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connectors || connectors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, results: [], message: "No connectors found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Run health checks in parallel
    const results: HealthCheckResult[] = await Promise.all(
      connectors.map(async (connector: Connector) => {
        console.log(`Checking health for connector: ${connector.name}`);

        let mcpResult = null;
        let restResult = null;

        // Check MCP server if configured
        if (connector.mcp_server_url) {
          const mcpCheck = await checkMCPServer(connector.mcp_server_url);
          mcpResult = {
            configured: true,
            reachable: mcpCheck.reachable,
            latencyMs: mcpCheck.latencyMs,
            error: mcpCheck.error,
          };
        }

        // Check REST API availability
        restResult = await checkRESTApi(connector.slug);

        const status = determineStatus(mcpResult, restResult);

        return {
          connectorId: connector.id,
          connectorName: connector.name,
          status,
          mcpServer: mcpResult,
          restApi: restResult.configured ? restResult : null,
          checkedAt: new Date().toISOString(),
        };
      })
    );

    // Calculate summary
    const summary = {
      total: results.length,
      healthy: results.filter((r) => r.status === "healthy").length,
      degraded: results.filter((r) => r.status === "degraded").length,
      unhealthy: results.filter((r) => r.status === "unhealthy").length,
    };

    console.log(`Health check complete: ${JSON.stringify(summary)}`);

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
