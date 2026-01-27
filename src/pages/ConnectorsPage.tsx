import { Layout } from '@/components/layout/Layout';
import { OAuthConnectorCard } from '@/components/connectors/OAuthConnectorCard';
import { useConnectors } from '@/context/ConnectorContext';
import { useOAuthFlow } from '@/hooks/useOAuthFlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CONNECTOR_CATEGORIES } from '@/types/seed-data';
import { useState } from 'react';
import { Search, Grid3X3, List, Shield } from 'lucide-react';
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Connectors</h1>
          <p className="text-muted-foreground">
            Browse and manage your service integrations. Connect via OAuth, API keys, or MCP protocol.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {CONNECTOR_CATEGORIES.map((cat) => (
              <Button
                key={cat.slug}
                variant={category === cat.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.slug)}
                className="shrink-0"
              >
                {cat.name}
              </Button>
            ))}
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* OAuth Connectors Section */}
        {oauthConnectors.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">OAuth Integrations</h2>
              <span className="text-sm text-muted-foreground">({oauthConnectors.length})</span>
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
                      onConnect={() => {}} // Non-OAuth connectors would need different handling
                      onDisconnect={disconnectConnection}
                      onRefreshToken={refreshToken}
                      isConnecting={false}
                      isCurrentConnector={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {filteredConnectors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No connectors found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
