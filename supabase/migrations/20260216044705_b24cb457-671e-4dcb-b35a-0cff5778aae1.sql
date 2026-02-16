-- Allow authenticated users to insert new MCP connectors
CREATE POLICY "Authenticated users can register connectors"
ON public.connectors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert tools for connectors
CREATE POLICY "Authenticated users can insert connector tools"
ON public.connector_tools
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete connector tools (for re-discovery)
CREATE POLICY "Authenticated users can delete connector tools"
ON public.connector_tools
FOR DELETE
TO authenticated
USING (true);