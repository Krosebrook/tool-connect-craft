import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plug2, 
  ExternalLink, 
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConnectorIcon } from './ConnectorIcon';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type DbConnector = Database['public']['Tables']['connectors']['Row'];
type DbUserConnection = Database['public']['Tables']['user_connections']['Row'];

interface OAuthConnectorCardProps {
  connector: DbConnector;
  connection?: DbUserConnection;
  onConnect: (connectorId: string) => void;
  onDisconnect: (connectionId: string, connectorName: string) => void;
  onRefreshToken: (connectionId: string) => void;
  isConnecting: boolean;
  isCurrentConnector: boolean;
}

export function OAuthConnectorCard({
  connector,
  connection,
  onConnect,
  onDisconnect,
  onRefreshToken,
  isConnecting,
  isCurrentConnector,
}: OAuthConnectorCardProps) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isConnected = connection?.status === 'active';
  const isExpired = connection?.status === 'expired';
  const isPending = connection?.status === 'pending';
  const isOAuth = connector.auth_type === 'oauth';

  const getStatusIndicator = () => {
    if (isConnected) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
    if (isExpired) {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    if (isPending) {
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
    return <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isExpired) return 'Token Expired';
    if (isPending) return 'Pending';
    return 'Not Connected';
  };

  const handleConnect = () => {
    onConnect(connector.id);
  };

  const handleDisconnect = () => {
    if (connection) {
      onDisconnect(connection.id, connector.name);
      setShowDisconnectDialog(false);
    }
  };

  const handleRefresh = async () => {
    if (connection) {
      setIsRefreshing(true);
      await onRefreshToken(connection.id);
      setIsRefreshing(false);
    }
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return 'Expired';
    if (diffMins < 60) return `Expires in ${diffMins}m`;
    if (diffHours < 24) return `Expires in ${diffHours}h`;
    return `Expires in ${diffDays}d`;
  };

  const showLoading = (isConnecting && isCurrentConnector) || isRefreshing;

  return (
    <>
      <div 
        className={cn(
          'connector-card group animate-fade-in',
          isConnected && 'ring-1 ring-success/20',
          isExpired && 'ring-1 ring-warning/20'
        )}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ConnectorIcon 
                  slug={connector.slug} 
                  name={connector.name}
                  className="h-10 w-10"
                />
                {isConnected && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {connector.name}
                </h3>
                <span className="text-xs text-muted-foreground capitalize">
                  {connector.category}
                </span>
              </div>
            </div>

            {isOAuth && (isConnected || isExpired) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={`/connectors/${connector.slug}`} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    Refresh Token
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onClick={() => setShowDisconnectDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {connector.description}
          </p>

          {/* Scopes (if connected) */}
          {isConnected && connection?.scopes && connection.scopes.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Permissions</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {connection.scopes.slice(0, 3).map((scope) => (
                  <Badge 
                    key={scope} 
                    variant="secondary" 
                    className="text-xs font-normal"
                  >
                    {scope.split('/').pop() || scope}
                  </Badge>
                ))}
                {connection.scopes.length > 3 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    +{connection.scopes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {getStatusIndicator()}
              <span className={cn(
                'text-sm',
                isConnected && 'text-success',
                isExpired && 'text-warning',
                !isConnected && !isExpired && 'text-muted-foreground'
              )}>
                {getStatusText()}
              </span>
            </div>

            {!isConnected && !isExpired ? (
              <Button
                variant="connector"
                size="sm"
                onClick={handleConnect}
                disabled={showLoading || !isOAuth}
                className="gap-2"
              >
                {showLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plug2 className="h-3.5 w-3.5" />
                )}
                {isOAuth ? 'Connect' : 'Configure'}
              </Button>
            ) : isExpired ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                Reconnect
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/connectors/${connector.slug}`} className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            {isOAuth && <Shield className="h-3 w-3" />}
            {connector.auth_type === 'oauth' && 'OAuth 2.0'}
            {connector.auth_type === 'api_key' && 'API Key'}
            {connector.auth_type === 'none' && 'No Auth'}
          </span>
          {connection?.expires_at && (
            <span className={cn(
              'text-xs',
              new Date(connection.expires_at) < new Date() 
                ? 'text-destructive' 
                : 'text-muted-foreground'
            )}>
              {formatExpiry(connection.expires_at)}
            </span>
          )}
        </div>
      </div>

      {/* Disconnect confirmation dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {connector.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke access to {connector.name}. You'll need to reconnect to use this integration again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
