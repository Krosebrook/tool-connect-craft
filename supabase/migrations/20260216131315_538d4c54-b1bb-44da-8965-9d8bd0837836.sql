
-- Create mcp_api_keys table for per-user MCP endpoint authentication
CREATE TABLE public.mcp_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own keys
CREATE POLICY "Users can view their own API keys"
ON public.mcp_api_keys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own keys
CREATE POLICY "Users can create their own API keys"
ON public.mcp_api_keys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own keys
CREATE POLICY "Users can delete their own API keys"
ON public.mcp_api_keys FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role can read all keys (for edge function auth lookup)
CREATE POLICY "Service role can read all API keys"
ON public.mcp_api_keys FOR SELECT
TO service_role
USING (true);

-- Service role can update last_used_at
CREATE POLICY "Service role can update API keys"
ON public.mcp_api_keys FOR UPDATE
TO service_role
USING (true);

-- Index for fast hash lookups during authentication
CREATE INDEX idx_mcp_api_keys_key_hash ON public.mcp_api_keys (key_hash);

-- Index for user queries
CREATE INDEX idx_mcp_api_keys_user_id ON public.mcp_api_keys (user_id);
