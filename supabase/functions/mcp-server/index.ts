import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Hash a key using SHA-256
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Authenticate a bearer token and return the user_id
async function authenticateKey(
  token: string
): Promise<{ userId: string; keyId: string } | null> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const keyHash = await hashKey(token);

  const { data, error } = await supabase
    .from("mcp_api_keys")
    .select("id, user_id")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data) return null;

  // Update last_used_at
  await supabase
    .from("mcp_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { userId: data.user_id, keyId: data.id };
}

// Fetch all tools for a user's active connections
async function getUserTools(userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Get active connections with connector info
  const { data: connections, error: connError } = await supabase
    .from("user_connections")
    .select("id, connector_id, connectors(id, slug, name, mcp_server_url)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (connError || !connections) return [];

  const tools: Array<{
    namespacedName: string;
    description: string;
    inputSchema: Record<string, unknown>;
    connectorSlug: string;
    connectorName: string;
    mcpServerUrl: string | null;
    originalToolName: string;
  }> = [];

  for (const conn of connections) {
    const connector = conn.connectors as any;
    if (!connector) continue;

    const { data: connectorTools } = await supabase
      .from("connector_tools")
      .select("name, description, schema, source")
      .eq("connector_id", conn.connector_id);

    if (!connectorTools) continue;

    for (const tool of connectorTools) {
      tools.push({
        namespacedName: `${connector.slug}__${tool.name}`,
        description: `[${connector.name}] ${tool.description || tool.name}`,
        inputSchema: (tool.schema as Record<string, unknown>) || {
          type: "object",
          properties: {},
        },
        connectorSlug: connector.slug,
        connectorName: connector.name,
        mcpServerUrl: connector.mcp_server_url,
        originalToolName: tool.name,
      });
    }
  }

  return tools;
}

// Log a tool call to action_logs
async function logToolCall(
  userId: string,
  connectorId: string,
  toolName: string,
  request: Record<string, unknown>,
  response: Record<string, unknown> | null,
  status: "success" | "error",
  error: string | null,
  latencyMs: number
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  await supabase.from("action_logs").insert({
    user_id: userId,
    connector_id: connectorId,
    tool_name: toolName,
    request,
    response,
    status,
    error,
    latency_ms: latencyMs,
  });
}

const app = new Hono().basePath("/mcp-server");

// Handle CORS preflight
app.options("/*", (c) => {
  return new Response(null, { headers: corsHeaders });
});

// Health check / info endpoint
app.get("/", (c) => {
  return c.json(
    {
      name: "MCP Hub Server",
      version: "1.0.0",
      description:
        "MCP proxy server that aggregates tools from your connected services",
      mcp_endpoint: "/mcp",
    },
    200,
    corsHeaders
  );
});

// MCP endpoint
app.all("/mcp", async (c) => {
  // Extract bearer token
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Missing Authorization header" },
        id: null,
      },
      401,
      corsHeaders
    );
  }

  const auth = await authenticateKey(token);
  if (!auth) {
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Invalid API key" },
        id: null,
      },
      401,
      corsHeaders
    );
  }

  // Fetch user's tools
  const userTools = await getUserTools(auth.userId);

  // Create a fresh MCP server for this request
  const mcpServer = new McpServer({
    name: "MCP Hub",
    version: "1.0.0",
  });

  // Register each tool dynamically
  for (const tool of userTools) {
    mcpServer.tool({
      name: tool.namespacedName,
      description: tool.description,
      inputSchema: tool.inputSchema as any,
      handler: async (args: Record<string, unknown>) => {
        const startTime = Date.now();
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Find the connector ID
        const { data: connector } = await supabase
          .from("connectors")
          .select("id, mcp_server_url")
          .eq("slug", tool.connectorSlug)
          .single();

        if (!connector) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Connector '${tool.connectorSlug}' not found`,
              },
            ],
          };
        }

        try {
          // Proxy the call to the upstream MCP server or execute via REST
          let result: string;

          if (tool.mcpServerUrl) {
            // Forward to upstream MCP server
            const rpcPayload = {
              jsonrpc: "2.0",
              method: "tools/call",
              params: { name: tool.originalToolName, arguments: args },
              id: crypto.randomUUID(),
            };

            const upstream = await fetch(tool.mcpServerUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(rpcPayload),
            });

            const upstreamResult = await upstream.json();
            result = JSON.stringify(upstreamResult.result || upstreamResult, null, 2);
          } else {
            // Call the existing execute-tool edge function
            const execResponse = await fetch(
              `${SUPABASE_URL}/functions/v1/execute-tool`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  connectorSlug: tool.connectorSlug,
                  toolName: tool.originalToolName,
                  args,
                  userId: auth.userId,
                }),
              }
            );

            const execResult = await execResponse.json();
            result = JSON.stringify(execResult, null, 2);
          }

          const latency = Date.now() - startTime;
          await logToolCall(
            auth.userId,
            connector.id,
            tool.originalToolName,
            args as Record<string, unknown>,
            { result },
            "success",
            null,
            latency
          );

          return {
            content: [{ type: "text" as const, text: result }],
          };
        } catch (err) {
          const latency = Date.now() - startTime;
          const errorMsg = err instanceof Error ? err.message : String(err);

          await logToolCall(
            auth.userId,
            connector.id,
            tool.originalToolName,
            args as Record<string, unknown>,
            null,
            "error",
            errorMsg,
            latency
          );

          return {
            content: [
              {
                type: "text" as const,
                text: `Error executing tool: ${errorMsg}`,
              },
            ],
          };
        }
      },
    });
  }

  const transport = new StreamableHttpTransport();
  const response = await transport.handleRequest(c.req.raw, mcpServer);

  // Add CORS headers to response
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
});

// Catch-all for the base path (when called without /mcp suffix)
app.all("/*", async (c) => {
  // Redirect non-MCP requests to the MCP endpoint
  const url = new URL(c.req.url);
  if (!url.pathname.endsWith("/mcp") && !url.pathname.endsWith("/")) {
    return c.json(
      { error: "Use /mcp endpoint for MCP protocol requests" },
      404,
      corsHeaders
    );
  }
  return c.json(
    { error: "Method not allowed" },
    405,
    corsHeaders
  );
});

Deno.serve(app.fetch);
