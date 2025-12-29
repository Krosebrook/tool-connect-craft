import { Layout } from '@/components/layout/Layout';
import { ConnectorCard } from '@/components/connectors/ConnectorCard';
import { useConnectors } from '@/context/ConnectorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CONNECTOR_CATEGORIES } from '@/types/seed-data';
import { useState } from 'react';
import { Search, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConnectorsPage() {
  const { connectors, connections, connect, disconnect } = useConnectors();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const filteredConnectors = connectors.filter(connector => {
    const matchesSearch = connector.name.toLowerCase().includes(search.toLowerCase()) ||
      (connector.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || 
      (connector.category || '').toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCategory;
  });
  
  const handleConnect = async (connectorId: string) => {
    setConnectingId(connectorId);
    try {
      await connect(connectorId);
    } finally {
      setConnectingId(null);
    }
  };
  
  const handleDisconnect = async (connectionId: string) => {
    await disconnect(connectionId);
  };
  
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
        
        {/* Connectors Grid */}
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {filteredConnectors.map((connector, index) => {
            const connection = connections.find(c => c.connector_id === connector.id && c.status === 'active');
            return (
              <div 
                key={connector.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ConnectorCard
                  connector={{
                    ...connector,
                    iconUrl: connector.icon_url,
                    authType: connector.auth_type,
                    isActive: connector.is_active ?? true,
                    createdAt: connector.created_at,
                  }}
                  connection={connection ? {
                    ...connection,
                    userId: connection.user_id,
                    connectorId: connection.connector_id,
                    lastUsedAt: connection.last_used_at,
                    createdAt: connection.created_at,
                    updatedAt: connection.updated_at,
                  } : undefined}
                  onConnect={() => handleConnect(connector.id)}
                  onDisconnect={() => connection && handleDisconnect(connection.id)}
                  isConnecting={connectingId === connector.id}
                />
              </div>
            );
          })}
        </div>
        
        {filteredConnectors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No connectors found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
