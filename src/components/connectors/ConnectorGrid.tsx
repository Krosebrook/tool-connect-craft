import { OAuthConnectorCard } from '@/components/connectors/OAuthConnectorCard';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type DbConnector = Database['public']['Tables']['connectors']['Row'];
type DbUserConnection = Database['public']['Tables']['user_connections']['Row'];

interface ConnectorGridProps {
  oauthConnectors: DbConnector[];
  otherConnectors: DbConnector[];
  connections: DbUserConnection[];
  viewMode: 'grid' | 'list';
  animationKey: string;
  onConnect: (connectorId: string) => void;
  onDisconnect: (connectionId: string, connectorName: string) => void;
  onRefreshToken: (connectionId: string) => void;
  isConnecting: boolean;
  connectingConnectorId: string | null;
  getHealth: (connectorId: string) => { status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'; latencyMs?: number | null };
}

export function ConnectorGrid({
  oauthConnectors,
  otherConnectors,
  connections,
  viewMode,
  animationKey,
  onConnect,
  onDisconnect,
  onRefreshToken,
  isConnecting,
  connectingConnectorId,
  getHealth,
}: ConnectorGridProps) {
  const gridClassName = cn(
    viewMode === 'grid'
      ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'space-y-4'
  );

  const findConnection = (connectorId: string, includeExpired = false) =>
    connections.find(
      (c) =>
        c.connector_id === connectorId &&
        (c.status === 'active' || (includeExpired && c.status === 'expired'))
    );

  return (
    <>
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
          <div key={`oauth-${animationKey}`} className={gridClassName}>
            {oauthConnectors.map((connector, index) => (
              <div
                key={connector.id}
                className="animate-fade-in opacity-0"
                style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
              >
                <OAuthConnectorCard
                  connector={connector}
                  connection={findConnection(connector.id, true)}
                  onConnect={onConnect}
                  onDisconnect={onDisconnect}
                  onRefreshToken={onRefreshToken}
                  isConnecting={isConnecting}
                  isCurrentConnector={connectingConnectorId === connector.id}
                  healthStatus={connector.mcp_server_url ? getHealth(connector.id).status : undefined}
                  healthLatency={connector.mcp_server_url ? getHealth(connector.id).latencyMs : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Connectors Section */}
      {otherConnectors.length > 0 && (
        <div>
          {oauthConnectors.length > 0 && (
            <h2 className="text-lg font-semibold text-foreground mb-4">Other Integrations</h2>
          )}
          <div key={`other-${animationKey}`} className={gridClassName}>
            {otherConnectors.map((connector, index) => (
              <div
                key={connector.id}
                className="animate-fade-in opacity-0"
                style={{
                  animationDelay: `${(oauthConnectors.length + index) * 75}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <OAuthConnectorCard
                  connector={connector}
                  connection={findConnection(connector.id)}
                  onConnect={() => {}}
                  onDisconnect={onDisconnect}
                  onRefreshToken={onRefreshToken}
                  isConnecting={false}
                  isCurrentConnector={false}
                  healthStatus={connector.mcp_server_url ? getHealth(connector.id).status : undefined}
                  healthLatency={connector.mcp_server_url ? getHealth(connector.id).latencyMs : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
