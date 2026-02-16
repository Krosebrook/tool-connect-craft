import { Layout } from '@/components/layout/Layout';
import { useConnectors } from '@/context/ConnectorContext';
import { useOAuthFlow } from '@/hooks/useOAuthFlow';
import { useMCPHealth } from '@/hooks/useMCPHealth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ConnectorFilters } from '@/components/connectors/ConnectorFilters';
import { ConnectorGrid } from '@/components/connectors/ConnectorGrid';
import { ConnectorEmptyState } from '@/components/connectors/ConnectorEmptyState';

export default function ConnectorsPage() {
  const { connectors, connections } = useConnectors();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    isConnecting,
    connectorId: connectingConnectorId,
    startOAuthFlow,
    disconnectConnection,
    refreshToken,
  } = useOAuthFlow();

  const mcpConnectorIds = connectors
    .filter(c => c.mcp_server_url)
    .map(c => c.id);
  const { getHealth } = useMCPHealth(mcpConnectorIds);
  
  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.name.toLowerCase().includes(search.toLowerCase()) ||
      (connector.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || 
      (connector.category || '').toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const oauthConnectors = filteredConnectors.filter(c => c.auth_type === 'oauth');
  const otherConnectors = filteredConnectors.filter(c => c.auth_type !== 'oauth');
  
  return (
    <Layout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Connectors</h1>
            <p className="text-muted-foreground">
              Browse and manage your service integrations. Connect via OAuth, API keys, or MCP protocol.
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="glow" className="gap-2 mt-4 md:mt-0 shrink-0">
                <Link to="/connectors/add-mcp">
                  <Plus className="h-4 w-4" />
                  Register MCP Server
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Register any MCP-compatible server to discover and use its tools</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <ConnectorFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {filteredConnectors.length > 0 ? (
          <ConnectorGrid
            oauthConnectors={oauthConnectors}
            otherConnectors={otherConnectors}
            connections={connections}
            viewMode={viewMode}
            animationKey={`${category}-${search}`}
            onConnect={startOAuthFlow}
            onDisconnect={disconnectConnection}
            onRefreshToken={refreshToken}
            isConnecting={isConnecting}
            connectingConnectorId={connectingConnectorId}
            getHealth={getHealth}
          />
        ) : (
          <ConnectorEmptyState
            category={category}
            onResetCategory={() => setCategory('all')}
          />
        )}
      </div>
    </Layout>
  );
}
