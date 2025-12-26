import { Connector, UserConnection } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { 
  Plug2, 
  ExternalLink, 
  MoreHorizontal,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConnectorIcon } from './ConnectorIcon';

interface ConnectorCardProps {
  connector: Connector;
  connection?: UserConnection;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isConnecting?: boolean;
}

export function ConnectorCard({ 
  connector, 
  connection, 
  onConnect, 
  onDisconnect,
  isConnecting 
}: ConnectorCardProps) {
  const status = connection?.status || 'none';
  const isConnected = status === 'active';
  
  return (
    <div className="connector-card group animate-fade-in">
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
              {isConnected && (
                <>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Token
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onClick={onDisconnect}
                  >
                    <Trash2 className="h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {connector.description}
        </p>
        
        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={status} size="sm" />
          
          {!isConnected ? (
            <Button 
              variant="connector" 
              size="sm" 
              onClick={onConnect}
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plug2 className="h-3.5 w-3.5" />
              )}
              Connect
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
      
      {/* Auth type indicator */}
      <div className="px-5 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {connector.authType === 'oauth' && 'OAuth 2.0'}
          {connector.authType === 'api_key' && 'API Key'}
          {connector.authType === 'none' && 'No Auth'}
        </span>
        {connection?.lastUsedAt && (
          <span className="text-xs text-muted-foreground">
            Last used {formatTimeAgo(connection.lastUsedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
