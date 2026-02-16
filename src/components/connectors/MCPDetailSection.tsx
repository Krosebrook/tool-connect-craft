import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Globe, Server } from 'lucide-react';
import { useState } from 'react';
import type { Json } from '@/integrations/supabase/types';
import { MCPHealthIndicator } from './MCPHealthIndicator';
import { useMCPHealth } from '@/hooks/useMCPHealth';

interface MCPDetailSectionProps {
  connectorId: string;
  connectorSlug: string;
  mcpServerUrl: string | null;
  authType: string;
  toolCount: number;
  onToolsRefreshed?: () => void;
}

export function MCPDetailSection({
  connectorId,
  connectorSlug,
  mcpServerUrl,
  authType,
  toolCount,
  onToolsRefreshed,
}: MCPDetailSectionProps) {
  const [isRediscovering, setIsRediscovering] = useState(false);
  const { getHealth } = useMCPHealth(mcpServerUrl ? [connectorId] : []);
  const health = getHealth(connectorId);

  if (!mcpServerUrl) return null;

  const maskedUrl = authType !== 'none'
    ? mcpServerUrl.replace(/\/\/(.+?)@/, '//***@').replace(/(\?|&)(key|token|api_key)=[^&]+/gi, '$1$2=***')
    : mcpServerUrl;

  const handleRediscover = async () => {
    setIsRediscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('discover-mcp-tools', {
        body: { server_url: mcpServerUrl },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const tools = data?.tools || [];

      // Delete old tools and insert new ones
      await supabase
        .from('connector_tools')
        .delete()
        .eq('connector_id', connectorId)
        .eq('source', 'mcp');

      if (tools.length > 0) {
        await supabase.from('connector_tools').insert(
          tools.map((t: { name: string; description: string; schema: Record<string, unknown> }) => ({
            connector_id: connectorId,
            name: t.name,
            description: t.description || null,
            schema: t.schema as unknown as Json,
            source: 'mcp' as const,
          }))
        );
      }

      toast({
        title: 'Tools refreshed',
        description: `Found ${tools.length} tool${tools.length !== 1 ? 's' : ''}.`,
      });

      onToolsRefreshed?.();
    } catch (err) {
      toast({
        title: 'Re-discovery failed',
        description: err instanceof Error ? err.message : 'Could not reach MCP server.',
        variant: 'destructive',
      });
    } finally {
      setIsRediscovering(false);
    }
  };

  return (
    <div className="connector-card p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">MCP Server Details</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <code className="text-sm text-muted-foreground break-all">{maskedUrl}</code>
        </div>

        <div className="flex items-center gap-3">
          <MCPHealthIndicator status={health.status} latencyMs={health.latencyMs} />
          <Badge variant="secondary">{toolCount} tools</Badge>
          <Badge variant="outline">MCP Protocol</Badge>
          <Badge variant="outline" className="capitalize">{authType} auth</Badge>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleRediscover}
                disabled={isRediscovering}
              >
                <RefreshCw className={`h-4 w-4 ${isRediscovering ? 'animate-spin' : ''}`} />
                Re-discover Tools
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send a new tools/list request to refresh the available tools</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
