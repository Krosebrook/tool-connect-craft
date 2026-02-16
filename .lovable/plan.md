

# Build an MCP Server Endpoint (MCP Proxy)

## Goal
Create a backend function that acts as an MCP-compliant server. When a user's AI assistant (Claude, ChatGPT, Copilot, etc.) connects to this endpoint, it sees all the tools from that user's connected services -- and can call them through a single URL.

## How It Works

The user gets a personal MCP URL like:
```
https://<project-url>/functions/v1/mcp-server
```

They paste this URL into their AI client (e.g., Claude Desktop config). The AI client sends standard MCP JSON-RPC requests, and this endpoint:
1. Authenticates the user (via Bearer token)
2. Lists all tools from their active connections
3. Proxies `tools/call` requests to the appropriate upstream MCP server or REST handler

## What Gets Built

### 1. New Database Table: `mcp_api_keys`
Stores per-user API keys for authenticating external AI clients:

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| name | text | Label (e.g. "Claude Desktop") |
| key_hash | text | SHA-256 hash of the API key |
| key_prefix | text | First 8 chars for display (e.g. `mcp_a1b2...`) |
| last_used_at | timestamptz | Tracking |
| created_at | timestamptz | Audit |

RLS: users can only read/manage their own keys.

### 2. New Edge Function: `mcp-server`
A Streamable HTTP MCP server using `mcp-lite` that handles three JSON-RPC methods:

- **`initialize`** -- Returns server info and capabilities
- **`tools/list`** -- Queries the user's active connections, joins to `connector_tools`, and returns a merged list with namespaced tool names (e.g. `slack__send_message`, `github__create_issue`)
- **`tools/call`** -- Parses the namespaced tool name, finds the upstream connector, and proxies the call via the existing `executeMCPTool` / `executeRESTTool` logic

Authentication: The function reads a `Bearer <key>` header, hashes it, looks up the `mcp_api_keys` table, and identifies the user.

### 3. New UI Page: `MCPEndpointPage`
A settings page at `/settings/mcp-endpoint` where users can:

- See their personal MCP endpoint URL
- Generate / revoke API keys
- Copy a ready-to-paste config snippet for Claude Desktop, Cursor, etc.
- View which tools will be exposed (based on active connections)

### 4. Navigation Update
Add a link to the new page in the sidebar/nav under Settings.

## Technical Details

### Tool Namespacing
Tools are prefixed with the connector slug to avoid collisions:
```
{connector_slug}__{tool_name}
```
Example: A Slack connector with a `send_message` tool becomes `slack__send_message`.

### Edge Function Structure

```text
supabase/functions/mcp-server/
  index.ts      -- Hono + mcp-lite server
  deno.json     -- mcp-lite dependency
```

The function will:
1. Extract Bearer token from Authorization header
2. Hash it with SHA-256 and look up `mcp_api_keys`
3. Query `user_connections` (status = 'active') joined with `connectors` and `connector_tools`
4. For `tools/list`: return all tools with namespaced names
5. For `tools/call`: parse the namespace, find the connector's `mcp_server_url`, and forward the JSON-RPC call (or run REST simulation)

### Config.toml Addition
```toml
[functions.mcp-server]
verify_jwt = false
```

### API Key Generation
Keys are generated client-side with `crypto.randomUUID()` prefixed with `mcp_`, displayed once to the user, then only the SHA-256 hash is stored. The prefix (`mcp_a1b2c3d4`) is stored for identification in the UI.

### Security
- API keys are hashed before storage (never stored in plaintext)
- RLS on `mcp_api_keys` ensures user isolation
- Rate limiting reuses existing per-user rate limit logic
- Audit logging records every tool call through the proxy

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `supabase/functions/mcp-server/index.ts` |
| Create | `supabase/functions/mcp-server/deno.json` |
| Create | `src/pages/MCPEndpointPage.tsx` |
| Modify | `src/App.tsx` (add route) |
| Modify | `src/components/layout/Layout.tsx` (add nav link) |
| Migration | Create `mcp_api_keys` table with RLS |

