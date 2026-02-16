-- Allow anonymous users to read active connectors (for browsing the catalog)
CREATE POLICY "Connectors are publicly readable"
ON public.connectors
FOR SELECT
TO anon
USING (is_active = true);

-- Allow anonymous users to read connector tools (for browsing)
CREATE POLICY "Connector tools are publicly readable"
ON public.connector_tools
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM connectors c
  WHERE c.id = connector_tools.connector_id AND c.is_active = true
));

-- Allow anon to insert connectors (for demo/unauthenticated usage)
CREATE POLICY "Anon users can register connectors"
ON public.connectors
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to insert connector tools
CREATE POLICY "Anon users can insert connector tools"
ON public.connector_tools
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon to delete connector tools (for re-discovery)
CREATE POLICY "Anon users can delete connector tools"
ON public.connector_tools
FOR DELETE
TO anon
USING (true);