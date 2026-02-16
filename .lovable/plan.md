

## Plan: Add MCP Server Registration and Multi-User Connectivity

### What This Adds
A complete self-service flow for any employee/user to register an MCP server, auto-discover its tools, and make it available across the team.

---

### Step 1: Add MCP Registration Page (`/connectors/add-mcp`)

Create a new page with a form where users can:
- Enter a **name** and **description** for their MCP server
- Provide the **MCP Server URL** (the HTTP endpoint)
- Select an **auth method** (none, API key, or bearer token)
- Optionally provide an **API key** for authenticated MCP servers
- Click "Discover Tools" to auto-detect available tools from the server
- Review discovered tools and confirm registration

The form saves a new row to the `connectors` table with `auth_type` set appropriately and `mcp_server_url` populated.

### Step 2: Create `discover-mcp-tools` Edge Function

A new backend function that:
- Accepts an MCP server URL (and optional auth credentials)
- Sends the standard MCP JSON-RPC request: `{"method": "tools/list"}` to the server
- Parses the response to extract tool names, descriptions, and input schemas
- Returns the discovered tools to the frontend for preview
- On confirmation, inserts rows into `connector_tools` with `source = 'mcp'`

This follows the Model Context Protocol spec for tool discovery.

### Step 3: Add "Register MCP" Button to Connectors Page

Update `ConnectorsPage.tsx` to include:
- A prominent "Add MCP Server" button in the header area
- Links to the new `/connectors/add-mcp` route
- A tooltip explaining: "Register any MCP-compatible server to discover and use its tools"

### Step 4: Add Route to App.tsx

Register the new lazy-loaded page:
```text
/connectors/add-mcp --> AddMCPPage
```

### Step 5: Update ConnectorDetailPage for MCP-Specific Info

When viewing an MCP connector's detail page, show:
- The MCP Server URL (masked if authenticated)
- A "Re-discover Tools" button to refresh the tool list
- Connection health status (can the server be reached)
- A "Share with Team" option that makes it visible to all users

### Step 6: Multi-User Access

The existing `user_connections` table already supports per-user connections. Each employee:
1. Sees available MCP connectors on the Connectors page
2. Clicks "Connect" to create their own `user_connection` record
3. Can then execute tools through the connector using their own connection

No additional database changes needed -- the current schema handles this.

---

### Technical Details

**New files:**
- `src/pages/AddMCPPage.tsx` -- Registration form with tool discovery preview
- `supabase/functions/discover-mcp-tools/index.ts` -- Edge function for MCP tool discovery

**Modified files:**
- `src/App.tsx` -- Add route for `/connectors/add-mcp`
- `src/pages/ConnectorsPage.tsx` -- Add "Register MCP Server" button
- `src/pages/ConnectorDetailPage.tsx` -- Show MCP-specific details and re-discover button
- `src/components/connectors/ConnectorIcon.tsx` -- Add icon for user-registered MCP servers

**Database:** No schema changes needed. The existing `connectors` table has `mcp_server_url`, and `connector_tools` has `source = 'mcp'`. New MCP registrations are simply new rows.

**Edge function flow:**
```text
User enters MCP URL
  --> Frontend calls discover-mcp-tools edge function
  --> Edge function sends JSON-RPC {"method": "tools/list"} to the MCP server
  --> Returns tool definitions to frontend
  --> User confirms
  --> Frontend inserts connector + tools into database
  --> Connector appears on Connectors page for all users
```

**Security considerations:**
- MCP server URLs are validated (must be HTTPS in production)
- API keys for authenticated MCP servers are stored as secrets, not in plain text
- Rate limiting already applies via the existing execute-tool function
- Each user gets their own connection record for audit trail purposes

