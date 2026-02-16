import { Layout } from '@/components/layout/Layout';
import { OAuthConnectorCard } from '@/components/connectors/OAuthConnectorCard';
import { useConnectors } from '@/context/ConnectorContext';
import { useOAuthFlow } from '@/hooks/useOAuthFlow';
import { useMCPHealth } from '@/hooks/useMCPHealth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CONNECTOR_CATEGORIES } from '@/types/seed-data';
import { useState } from 'react';
import { Search, Grid3X3, List, Shield, Plus, Server, MessageSquare, Zap, Code2, HardDrive, Database, Puzzle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Separate OAuth connectors for highlighting
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
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search connectors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter connectors by name or description</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {CONNECTOR_CATEGORIES.map((cat) => (
              <Tooltip key={cat.slug}>
                <TooltipTrigger asChild>
                  <Button
                    variant={category === cat.slug ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategory(cat.slug)}
                    className="shrink-0"
                  >
                    {cat.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{cat.slug === 'all' ? 'Show all connectors' : `Show only ${cat.name} connectors`}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grid view — show connectors as cards</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>List view — show connectors in a compact list</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* OAuth Connectors Section */}
        {oauthConnectors.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-default">
                    <Shield className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">OAuth Integrations</h2>
                    <span className="text-sm text-muted-foreground">({oauthConnectors.length})</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connectors using OAuth 2.0 + PKCE for secure token-based authentication</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}>
              {oauthConnectors.map((connector, index) => {
                const connection = connections.find(
                  c => c.connector_id === connector.id && 
                  (c.status === 'active' || c.status === 'expired')
                );
                return (
                  <div 
                    key={connector.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <OAuthConnectorCard
                      connector={connector}
                      connection={connection}
                      onConnect={startOAuthFlow}
                      onDisconnect={disconnectConnection}
                      onRefreshToken={refreshToken}
                      isConnecting={isConnecting}
                      isCurrentConnector={connectingConnectorId === connector.id}
                      healthStatus={connector.mcp_server_url ? getHealth(connector.id).status : undefined}
                      healthLatency={connector.mcp_server_url ? getHealth(connector.id).latencyMs : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Connectors Section */}
        {otherConnectors.length > 0 && (
          <div>
            {oauthConnectors.length > 0 && (
              <h2 className="text-lg font-semibold text-foreground mb-4">Other Integrations</h2>
            )}
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}>
              {otherConnectors.map((connector, index) => {
                const connection = connections.find(
                  c => c.connector_id === connector.id && c.status === 'active'
                );
                return (
                  <div 
                    key={connector.id}
                    style={{ animationDelay: `${(oauthConnectors.length + index) * 50}ms` }}
                  >
                    <OAuthConnectorCard
                      connector={connector}
                      connection={connection}
                      onConnect={() => {}}
                      onDisconnect={disconnectConnection}
                      onRefreshToken={refreshToken}
                      isConnecting={false}
                      isCurrentConnector={false}
                      healthStatus={connector.mcp_server_url ? getHealth(connector.id).status : undefined}
                      healthLatency={connector.mcp_server_url ? getHealth(connector.id).latencyMs : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {filteredConnectors.length === 0 && (
          <div key={category} className="text-center py-16 space-y-4 animate-fade-in">
            {(() => {
              const emptyStates: Record<string, { icon: React.ReactNode; title: string; description: string; cta?: { label: string; action: () => void } }> = {
                mcp: {
                  icon: <Server className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
                  title: 'No MCP servers registered yet',
                  description: 'Register your first MCP-compatible server to discover its tools and make them available to your team.',
                },
                communication: {
                  icon: <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
                  title: 'No communication connectors found',
                  description: 'Connect messaging platforms like Slack or Gmail to send messages and manage communications.',
                  cta: { label: 'Browse All Connectors', action: () => setCategory('all') },
                },
                productivity: {
                  icon: <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
                  title: 'No productivity connectors found',
                  description: 'Integrate tools like Notion or Airtable to streamline your workflows and boost productivity.',
                  cta: { label: 'Browse All Connectors', action: () => setCategory('all') },
                },
                development: {
                  icon: <Code2 className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
                  title: 'No development connectors found',
                  description: 'Connect platforms like GitHub or Vercel to manage code, deployments, and CI/CD pipelines.',
                  cta: { label: 'Browse All Connectors', action: () => setCategory('all') },
                },
                storage: {
                  icon: <HardDrive className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
                  title: 'No storage connectors found',
                  description: 'Add cloud storage integrations like Google Drive to access and manage your files.',
                  cta: { label: 'Browse All Connectors', action: () => setCategory('all') },
                },
                database: {
                  icon: <Database className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
                  title: 'No database connectors found',
                  description: 'Connect database tools like Airtable to query, create, and manage your structured data.',
                  cta: { label: 'Browse All Connectors', action: () => setCategory('all') },
                },
                custom: {
                  icon: <Puzzle className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
                  title: 'No custom connectors found',
                  description: 'Register custom integrations via API keys or MCP protocol to extend your toolset.',
                },
              };

              const state = emptyStates[category];
              if (state) {
                return (
                  <>
                    {state.icon}
                    <h3 className="text-lg font-semibold text-foreground">{state.title}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">{state.description}</p>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      {category === 'mcp' && (
                        <Button asChild variant="glow" className="gap-2">
                          <Link to="/connectors/add-mcp">
                            <Plus className="h-4 w-4" />
                            Register MCP Server
                          </Link>
                        </Button>
                      )}
                      {(category === 'mcp' || category === 'custom') && (
                        <Button variant="outline" className="gap-2" onClick={() => setCategory('all')}>
                          Browse All Connectors
                        </Button>
                      )}
                      {state.cta && (
                        <Button variant="outline" className="gap-2" onClick={state.cta.action}>
                          {state.cta.label}
                        </Button>
                      )}
                    </div>
                  </>
                );
              }
              return <p className="text-muted-foreground">No connectors found matching your criteria.</p>;
            })()}
          </div>
        )}
      </div>
    </Layout>
  );
}
