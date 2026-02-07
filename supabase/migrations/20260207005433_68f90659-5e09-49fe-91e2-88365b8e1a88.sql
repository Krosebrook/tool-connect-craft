-- Create webhooks table for storing webhook configurations
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook_deliveries table for tracking webhook attempts
CREATE TABLE public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  response_code INTEGER,
  response_body TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create scheduler_jobs table for managing cron jobs
CREATE TABLE public.scheduler_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule TEXT NOT NULL,
  function_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  last_error TEXT,
  run_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_jobs ENABLE ROW LEVEL SECURITY;

-- Webhooks policies
CREATE POLICY "Users can view their own webhooks" 
  ON public.webhooks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks" 
  ON public.webhooks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks" 
  ON public.webhooks FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks" 
  ON public.webhooks FOR DELETE 
  USING (auth.uid() = user_id);

-- Webhook deliveries policies
CREATE POLICY "Users can view their webhook deliveries" 
  ON public.webhook_deliveries FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.webhooks w 
    WHERE w.id = webhook_deliveries.webhook_id AND w.user_id = auth.uid()
  ));

-- Scheduler jobs policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can view scheduler jobs" 
  ON public.scheduler_jobs FOR SELECT 
  USING (true);

-- Insert default token refresh job
INSERT INTO public.scheduler_jobs (name, description, schedule, function_name, is_active)
VALUES (
  'token-refresh',
  'Automatically refreshes expired OAuth tokens every 5 minutes',
  '*/5 * * * *',
  'token-refresh',
  true
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduler_jobs_updated_at
  BEFORE UPDATE ON public.scheduler_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for webhook deliveries
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduler_jobs;