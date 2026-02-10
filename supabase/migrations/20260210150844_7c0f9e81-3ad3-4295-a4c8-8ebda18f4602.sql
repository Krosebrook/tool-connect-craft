
-- Drop existing restrictive policies on webhooks
DROP POLICY IF EXISTS "Users can create their own webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can view their own webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can update their own webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can delete their own webhooks" ON public.webhooks;

-- Create permissive policies that allow all access (internal tool, no end-user auth)
CREATE POLICY "Allow all select on webhooks" ON public.webhooks FOR SELECT USING (true);
CREATE POLICY "Allow all insert on webhooks" ON public.webhooks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on webhooks" ON public.webhooks FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on webhooks" ON public.webhooks FOR DELETE USING (true);

-- Do the same for webhook_deliveries
DROP POLICY IF EXISTS "Users can view their webhook deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Users can create webhook deliveries" ON public.webhook_deliveries;

CREATE POLICY "Allow all select on webhook_deliveries" ON public.webhook_deliveries FOR SELECT USING (true);
CREATE POLICY "Allow all insert on webhook_deliveries" ON public.webhook_deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on webhook_deliveries" ON public.webhook_deliveries FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on webhook_deliveries" ON public.webhook_deliveries FOR DELETE USING (true);
