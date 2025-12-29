-- Create enums for type safety
CREATE TYPE public.auth_type AS ENUM ('oauth', 'api_key', 'none');
CREATE TYPE public.tool_source AS ENUM ('mcp', 'rest');
CREATE TYPE public.connection_status AS ENUM ('pending', 'active', 'expired', 'revoked', 'error');
CREATE TYPE public.job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
CREATE TYPE public.event_level AS ENUM ('info', 'warn', 'error');
CREATE TYPE public.oauth_transaction_status AS ENUM ('started', 'completed', 'failed');

-- Connectors table (public registry of available integrations)
CREATE TABLE public.connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  icon_url TEXT,
  auth_type public.auth_type NOT NULL DEFAULT 'none',
  oauth_provider TEXT,
  oauth_scopes TEXT[],
  oauth_config JSONB DEFAULT '{}',
  mcp_server_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Connector tools table
CREATE TABLE public.connector_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB DEFAULT '{}',
  source public.tool_source NOT NULL DEFAULT 'rest',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User connections (user-specific connector instances)
CREATE TABLE public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  status public.connection_status NOT NULL DEFAULT 'pending',
  secret_ref_access TEXT,
  secret_ref_refresh TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, connector_id)
);

-- OAuth transactions for PKCE flow
CREATE TABLE public.oauth_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  code_verifier_hash TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  status public.oauth_transaction_status NOT NULL DEFAULT 'started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Pipeline jobs for background/long-running operations
CREATE TABLE public.pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status public.job_status NOT NULL DEFAULT 'queued',
  input JSONB DEFAULT '{}',
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pipeline events for job progress streaming
CREATE TABLE public.pipeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.pipeline_jobs(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  level public.event_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'
);

-- Action logs for auditing
CREATE TABLE public.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  request JSONB DEFAULT '{}',
  response JSONB,
  status TEXT,
  error TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX idx_user_connections_connector_id ON public.user_connections(connector_id);
CREATE INDEX idx_pipeline_jobs_user_id ON public.pipeline_jobs(user_id);
CREATE INDEX idx_pipeline_jobs_status ON public.pipeline_jobs(status);
CREATE INDEX idx_pipeline_events_job_id ON public.pipeline_events(job_id);
CREATE INDEX idx_action_logs_user_id ON public.action_logs(user_id);
CREATE INDEX idx_oauth_transactions_state ON public.oauth_transactions(state);

-- Enable RLS on all tables
ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connectors (readable by all authenticated users)
CREATE POLICY "Connectors are readable by authenticated users"
ON public.connectors FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for connector_tools (readable by all authenticated users)
CREATE POLICY "Connector tools are readable by authenticated users"
ON public.connector_tools FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.connectors c 
  WHERE c.id = connector_id AND c.is_active = true
));

-- RLS Policies for user_connections
CREATE POLICY "Users can view their own connections"
ON public.user_connections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections"
ON public.user_connections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
ON public.user_connections FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
ON public.user_connections FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for oauth_transactions
CREATE POLICY "Users can view their own oauth transactions"
ON public.oauth_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own oauth transactions"
ON public.oauth_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth transactions"
ON public.oauth_transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for pipeline_jobs
CREATE POLICY "Users can view their own jobs"
ON public.pipeline_jobs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
ON public.pipeline_jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
ON public.pipeline_jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for pipeline_events (users can see events for their jobs)
CREATE POLICY "Users can view events for their jobs"
ON public.pipeline_events FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pipeline_jobs j 
  WHERE j.id = job_id AND j.user_id = auth.uid()
));

CREATE POLICY "Users can create events for their jobs"
ON public.pipeline_events FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pipeline_jobs j 
  WHERE j.id = job_id AND j.user_id = auth.uid()
));

-- RLS Policies for action_logs
CREATE POLICY "Users can view their own action logs"
ON public.action_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own action logs"
ON public.action_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_connections;

-- Use REPLICA IDENTITY FULL for complete row data in realtime
ALTER TABLE public.pipeline_jobs REPLICA IDENTITY FULL;
ALTER TABLE public.pipeline_events REPLICA IDENTITY FULL;
ALTER TABLE public.user_connections REPLICA IDENTITY FULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for user_connections updated_at
CREATE TRIGGER update_user_connections_updated_at
BEFORE UPDATE ON public.user_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();