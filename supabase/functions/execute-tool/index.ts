import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExecuteToolRequest {
  jobId: string;
  connectorId: string;
  toolName: string;
  args: Record<string, unknown>;
  userId: string;
}

interface ToolSchema {
  type: "object";
  properties: Record<string, { type: string; required?: boolean }>;
  required?: string[];
}

interface ConnectorTool {
  id: string;
  name: string;
  description: string | null;
  schema: ToolSchema | null;
  source: "mcp" | "rest";
  connector_id: string;
}

interface Connector {
  id: string;
  name: string;
  slug: string;
  mcp_server_url: string | null;
  auth_type: "oauth" | "api_key" | "none";
}

// Create Supabase client with service role for database operations
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

// Emit a pipeline event
async function emitEvent(
  supabase: ReturnType<typeof getSupabaseClient>,
  jobId: string,
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
) {
  const { error } = await supabase.from("pipeline_events").insert({
    job_id: jobId,
    level,
    message,
    data: data ?? null,
  });

  if (error) {
    console.error("Failed to emit event:", error);
  }
}

// Update job status
async function updateJobStatus(
  supabase: ReturnType<typeof getSupabaseClient>,
  jobId: string,
  status: "queued" | "running" | "succeeded" | "failed" | "canceled",
  updates: {
    output?: Record<string, unknown>;
    error?: string;
    started_at?: string;
    finished_at?: string;
  } = {}
) {
  const { error } = await supabase
    .from("pipeline_jobs")
    .update({ status, ...updates })
    .eq("id", jobId);

  if (error) {
    console.error("Failed to update job status:", error);
  }
}

// Create audit log
async function createActionLog(
  supabase: ReturnType<typeof getSupabaseClient>,
  params: {
    userId: string;
    connectorId: string;
    toolName: string;
    request: Record<string, unknown>;
    response: Record<string, unknown> | null;
    status: "success" | "error";
    error: string | null;
    latencyMs: number;
  }
) {
  const { error } = await supabase.from("action_logs").insert({
    user_id: params.userId,
    connector_id: params.connectorId,
    tool_name: params.toolName,
    request: params.request,
    response: params.response,
    status: params.status,
    error: params.error,
    latency_ms: params.latencyMs,
  });

  if (error) {
    console.error("Failed to create action log:", error);
  }
}

// Validate tool arguments against schema
function validateArgs(
  args: Record<string, unknown>,
  schema: ToolSchema | null
): { valid: boolean; errors: string[] } {
  if (!schema || !schema.properties) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  const requiredFields = schema.required || [];

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in args) || args[field] === undefined || args[field] === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate types
  for (const [key, value] of Object.entries(args)) {
    const propSchema = schema.properties[key];
    if (!propSchema) continue;

    const expectedType = propSchema.type;
    const actualType = Array.isArray(value) ? "array" : typeof value;

    if (expectedType && actualType !== expectedType) {
      errors.push(
        `Invalid type for ${key}: expected ${expectedType}, got ${actualType}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// Execute MCP tool via MCP server
async function executeMCPTool(
  connector: Connector,
  tool: ConnectorTool,
  args: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  if (!connector.mcp_server_url) {
    return { success: false, error: "MCP server URL not configured" };
  }

  try {
    console.log(`Executing MCP tool: ${tool.name} on ${connector.mcp_server_url}`);

    const response = await fetch(connector.mcp_server_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: {
          name: tool.name,
          arguments: args,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `MCP server error: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "MCP tool execution failed",
      };
    }

    return { success: true, result: result.result };
  } catch (error) {
    console.error("MCP execution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "MCP execution failed",
    };
  }
}

// Execute REST tool (placeholder for REST API integrations)
async function executeRESTTool(
  connector: Connector,
  tool: ConnectorTool,
  args: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  console.log(`Executing REST tool: ${tool.name} for connector: ${connector.slug}`);

  // This is a placeholder implementation that simulates REST API calls
  // In production, this would be replaced with actual REST API integrations
  // based on the connector's configuration

  try {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock success response
    return {
      success: true,
      result: {
        tool: tool.name,
        connector: connector.slug,
        timestamp: new Date().toISOString(),
        data: {
          message: `Successfully executed ${tool.name}`,
          input: args,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "REST execution failed",
    };
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = getSupabaseClient();

  try {
    const body: ExecuteToolRequest = await req.json();
    const { jobId, connectorId, toolName, args, userId } = body;

    console.log(`Execute tool request: job=${jobId}, tool=${toolName}`);

    // Validate required fields
    if (!jobId || !connectorId || !toolName || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: jobId, connectorId, toolName, userId",
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
      await updateJobStatus(supabase, jobId, "failed", {
        error: "Connector not found",
        finished_at: new Date().toISOString(),
      });
      await emitEvent(supabase, jobId, "error", "Connector not found");

      return new Response(
        JSON.stringify({ success: false, error: "Connector not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch tool
    const { data: tool, error: toolError } = await supabase
      .from("connector_tools")
      .select("*")
      .eq("connector_id", connectorId)
      .eq("name", toolName)
      .single();

    if (toolError || !tool) {
      await updateJobStatus(supabase, jobId, "failed", {
        error: `Tool '${toolName}' not found`,
        finished_at: new Date().toISOString(),
      });
      await emitEvent(supabase, jobId, "error", `Tool '${toolName}' not found`);

      return new Response(
        JSON.stringify({ success: false, error: `Tool '${toolName}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate arguments
    const validation = validateArgs(args, tool.schema as ToolSchema);
    if (!validation.valid) {
      const errorMsg = `Validation failed: ${validation.errors.join(", ")}`;
      await updateJobStatus(supabase, jobId, "failed", {
        error: errorMsg,
        finished_at: new Date().toISOString(),
      });
      await emitEvent(supabase, jobId, "error", errorMsg, { errors: validation.errors });

      return new Response(
        JSON.stringify({ success: false, error: errorMsg, validationErrors: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update job to running
    await updateJobStatus(supabase, jobId, "running", {
      started_at: new Date().toISOString(),
    });
    await emitEvent(supabase, jobId, "info", `Starting ${toolName} execution...`, { args });

    // Execute based on tool source
    let result: { success: boolean; result?: unknown; error?: string };

    if (tool.source === "mcp") {
      await emitEvent(supabase, jobId, "info", "Connecting to MCP server...");
      result = await executeMCPTool(connector as Connector, tool as ConnectorTool, args);
    } else {
      await emitEvent(supabase, jobId, "info", "Executing REST API call...");
      result = await executeRESTTool(connector as Connector, tool as ConnectorTool, args);
    }

    const latencyMs = Date.now() - startTime;

    if (result.success) {
      // Success
      await updateJobStatus(supabase, jobId, "succeeded", {
        output: result.result as Record<string, unknown>,
        finished_at: new Date().toISOString(),
      });
      await emitEvent(supabase, jobId, "info", "Tool execution completed successfully", {
        result: result.result,
      });

      await createActionLog(supabase, {
        userId,
        connectorId,
        toolName,
        request: args,
        response: result.result as Record<string, unknown>,
        status: "success",
        error: null,
        latencyMs,
      });

      return new Response(
        JSON.stringify({ success: true, result: result.result, latencyMs }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Failure
      await updateJobStatus(supabase, jobId, "failed", {
        error: result.error,
        finished_at: new Date().toISOString(),
      });
      await emitEvent(supabase, jobId, "error", result.error || "Execution failed");

      await createActionLog(supabase, {
        userId,
        connectorId,
        toolName,
        request: args,
        response: null,
        status: "error",
        error: result.error || "Unknown error",
        latencyMs,
      });

      return new Response(
        JSON.stringify({ success: false, error: result.error, latencyMs }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Execute tool error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
