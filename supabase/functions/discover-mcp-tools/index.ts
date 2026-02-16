import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { server_url, auth_method, auth_token } = await req.json();

    if (!server_url || typeof server_url !== "string") {
      return new Response(
        JSON.stringify({ error: "server_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(server_url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: "URL must use HTTP or HTTPS protocol" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build headers for the MCP request
    const mcpHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (auth_method === "api_key" && auth_token) {
      mcpHeaders["Authorization"] = `Bearer ${auth_token}`;
    } else if (auth_method === "bearer" && auth_token) {
      mcpHeaders["Authorization"] = `Bearer ${auth_token}`;
    }

    // Send MCP JSON-RPC tools/list request
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let mcpResponse: Response;
    try {
      mcpResponse = await fetch(server_url, {
        method: "POST",
        headers: mcpHeaders,
        body: JSON.stringify(mcpRequest),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: `Failed to reach MCP server: ${message}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeout);

    if (!mcpResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `MCP server responded with status ${mcpResponse.status}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mcpBody = await mcpResponse.json();

    // Parse JSON-RPC response
    if (mcpBody.error) {
      return new Response(
        JSON.stringify({
          error: `MCP server error: ${mcpBody.error.message || JSON.stringify(mcpBody.error)}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tools: MCPTool[] = mcpBody.result?.tools || [];

    return new Response(
      JSON.stringify({
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description || "",
          schema: t.inputSchema || { type: "object", properties: {} },
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("discover-mcp-tools error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
