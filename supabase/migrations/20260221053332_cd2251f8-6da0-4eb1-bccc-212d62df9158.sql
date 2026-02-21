
-- ============================================================
-- Fix overly permissive RLS policies
-- ============================================================

-- 1. connector_tools: Remove anon INSERT/DELETE (true) policies
--    Keep authenticated read access, restrict writes to service_role
DROP POLICY IF EXISTS "Anon users can delete connector tools" ON public.connector_tools;
DROP POLICY IF EXISTS "Authenticated users can delete connector tools" ON public.connector_tools;
DROP POLICY IF EXISTS "Anon users can insert connector tools" ON public.connector_tools;
DROP POLICY IF EXISTS "Authenticated users can insert connector tools" ON public.connector_tools;

-- Service role can manage connector_tools (used by edge functions)
CREATE POLICY "Service role can manage connector tools"
  ON public.connector_tools
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. connectors: Remove anon INSERT (true) policy
--    Keep public read for marketplace, restrict writes to service_role
DROP POLICY IF EXISTS "Anon users can register connectors" ON public.connectors;
DROP POLICY IF EXISTS "Authenticated users can register connectors" ON public.connectors;

-- Service role can manage connectors (used by edge functions)
CREATE POLICY "Service role can manage connectors"
  ON public.connectors
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. scheduler_jobs: Replace public SELECT (true) with authenticated-only
DROP POLICY IF EXISTS "Authenticated users can view scheduler jobs" ON public.scheduler_jobs;

CREATE POLICY "Authenticated users can view scheduler jobs"
  ON public.scheduler_jobs
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role full access for scheduler operations
CREATE POLICY "Service role can manage scheduler jobs"
  ON public.scheduler_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
