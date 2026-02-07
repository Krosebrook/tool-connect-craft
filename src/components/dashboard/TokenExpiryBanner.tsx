import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConnectors } from '@/context/ConnectorContext';
import { useMemo } from 'react';

interface ExpiringConnection {
  id: string;
  connectorName: string;
  expiresAt: Date;
  minutesRemaining: number;
}

export function TokenExpiryBanner() {
  const { connectors, connections } = useConnectors();

  const expiringConnections = useMemo(() => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return connections
      .filter(conn => {
        if (conn.status !== 'active' || !conn.expires_at) return false;
        const expiresAt = new Date(conn.expires_at);
        return expiresAt > now && expiresAt <= oneHourFromNow;
      })
      .map(conn => {
        const connector = connectors.find(c => c.id === conn.connector_id);
        const expiresAt = new Date(conn.expires_at!);
        const minutesRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
        
        return {
          id: conn.id,
          connectorName: connector?.name || 'Unknown',
          expiresAt,
          minutesRemaining,
        };
      })
      .sort((a, b) => a.minutesRemaining - b.minutesRemaining);
  }, [connections, connectors]);

  if (expiringConnections.length === 0) {
    return null;
  }

  const isUrgent = expiringConnections.some(c => c.minutesRemaining <= 15);

  return (
    <Alert 
      variant={isUrgent ? 'destructive' : 'default'}
      className={isUrgent 
        ? 'border-destructive/50 bg-destructive/10' 
        : 'border-warning/50 bg-warning/10'
      }
    >
      <AlertTriangle className={`h-4 w-4 ${isUrgent ? 'text-destructive' : 'text-warning'}`} />
      <AlertTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Token{expiringConnections.length > 1 ? 's' : ''} Expiring Soon
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p className="text-sm">
            {expiringConnections.length === 1 ? (
              <>
                <span className="font-medium">{expiringConnections[0].connectorName}</span>
                {' '}token expires in{' '}
                <span className="font-medium">{expiringConnections[0].minutesRemaining} minutes</span>
              </>
            ) : (
              <>
                <span className="font-medium">{expiringConnections.length} connections</span>
                {' '}have tokens expiring within the next hour
              </>
            )}
          </p>
          
          {expiringConnections.length > 1 && (
            <ul className="text-sm space-y-1 ml-4">
              {expiringConnections.slice(0, 3).map(conn => (
                <li key={conn.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{conn.connectorName}</span>
                  <span className="text-muted-foreground">
                    ({conn.minutesRemaining}m remaining)
                  </span>
                </li>
              ))}
              {expiringConnections.length > 3 && (
                <li className="text-muted-foreground">
                  +{expiringConnections.length - 3} more...
                </li>
              )}
            </ul>
          )}

          <div className="flex items-center gap-3 mt-3">
            <Button asChild size="sm" variant={isUrgent ? 'destructive' : 'outline'}>
              <Link to="/connections" className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Manage Connections
              </Link>
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
