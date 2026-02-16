import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useConnectors } from '@/context/ConnectorContext';
import { useOAuthFlow } from '@/hooks/useOAuthFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ConnectorIcon } from '@/components/connectors/ConnectorIcon';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Shield,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format, isPast, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'pending' | 'error';

const statusConfig: Record<ConnectionStatus, { label: string; className: string; icon: React.ReactNode }> = {
  active: {
    label: 'Active',
    className: 'status-active',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  expired: {
    label: 'Expired',
    className: 'status-expired',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  revoked: {
    label: 'Revoked',
    className: 'status-revoked',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  pending: {
    label: 'Pending',
    className: 'status-pending',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  error: {
    label: 'Error',
    className: 'status-error',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

export default function ConnectionsPage() {
  const { connectors, connections, loading } = useConnectors();
  const { refreshToken, disconnectConnection, isConnecting } = useOAuthFlow();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkRefreshing, setIsBulkRefreshing] = useState(false);
  const [showBulkDisconnect, setShowBulkDisconnect] = useState(false);
  const [isBulkDisconnecting, setIsBulkDisconnecting] = useState(false);

  // Enrich connections with connector data
  const enrichedConnections = useMemo(() => {
    return connections
      .filter(c => c.status !== 'revoked')
      .map(connection => {
        const connector = connectors.find(c => c.id === connection.connector_id);
        return {
          ...connection,
          connector,
        };
      })
      .filter(c => c.connector);
  }, [connections, connectors]);

  const stats = useMemo(() => {
    const active = enrichedConnections.filter(c => c.status === 'active').length;
    const expired = enrichedConnections.filter(c => c.status === 'expired').length;
    const expiringSoon = enrichedConnections.filter(c => {
      if (!c.expires_at || c.status !== 'active') return false;
      const expiresAt = new Date(c.expires_at);
      return !isPast(expiresAt) && isPast(addMinutes(new Date(), -30));
    }).length;
    
    return { total: enrichedConnections.length, active, expired, expiringSoon };
  }, [enrichedConnections]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === enrichedConnections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(enrichedConnections.map(c => c.id)));
    }
  };

  const handleBulkRefresh = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkRefreshing(true);
    try {
      const refreshPromises = Array.from(selectedIds).map(id => refreshToken(id));
      await Promise.allSettled(refreshPromises);
    } finally {
      setIsBulkRefreshing(false);
      setSelectedIds(new Set());
    }
  };

  const handleBulkDisconnect = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkDisconnecting(true);
    try {
      const disconnectPromises = Array.from(selectedIds).map(id => {
        const connection = enrichedConnections.find(c => c.id === id);
        return disconnectConnection(id, connection?.connector?.name || 'Unknown');
      });
      await Promise.allSettled(disconnectPromises);
    } finally {
      setIsBulkDisconnecting(false);
      setShowBulkDisconnect(false);
      setSelectedIds(new Set());
    }
  };

  const getExpiryInfo = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    
    const expiry = new Date(expiresAt);
    const isExpired = isPast(expiry);
    const timeText = formatDistanceToNow(expiry, { addSuffix: true });
    
    return {
      isExpired,
      timeText,
      formattedDate: format(expiry, 'PPp'),
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Connection Management</h1>
          </div>
          <p className="text-muted-foreground">
            View and manage all OAuth connections, token expiry, and perform bulk operations.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-default">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Total Connections</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>All non-revoked connections across connectors</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-default">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">{stats.active}</div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Connections with valid, non-expired tokens</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-default">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Connections with expired tokens that need refreshing</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-default">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-warning">{stats.expiringSoon}</div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Active connections with tokens expiring within 30 minutes</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Connections Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>All Connections</CardTitle>
                <CardDescription>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} connection(s) selected`
                    : 'Select connections to perform bulk actions'}
                </CardDescription>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkRefresh}
                        disabled={isBulkRefreshing}
                      >
                        {isBulkRefreshing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh Selected
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Request new access tokens for selected connections</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDisconnect(true)}
                        disabled={isBulkDisconnecting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Disconnect Selected
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Revoke access for all selected connections</p></TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {enrichedConnections.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No connections yet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect to services from the Connectors page to get started.
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/connectors'}>
                  Browse Connectors
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === enrichedConnections.length && enrichedConnections.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Connector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Token Expiry</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedConnections.map((connection) => {
                    const status = statusConfig[connection.status as ConnectionStatus] || statusConfig.pending;
                    const expiryInfo = getExpiryInfo(connection.expires_at);
                    
                    return (
                      <TableRow key={connection.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(connection.id)}
                            onCheckedChange={() => toggleSelect(connection.id)}
                            aria-label={`Select ${connection.connector?.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ConnectorIcon
                              slug={connection.connector?.slug || ''}
                              name={connection.connector?.name || ''}
                            />
                            <div>
                              <div className="font-medium text-foreground">
                                {connection.connector?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {connection.connector?.slug}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1.5', status.className)}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(connection.scopes || []).slice(0, 2).map((scope) => (
                              <Tooltip key={scope}>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs cursor-default">
                                    {scope}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent><p>OAuth scope: {scope}</p></TooltipContent>
                              </Tooltip>
                            ))}
                            {(connection.scopes || []).length > 2 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs cursor-default">
                                    +{(connection.scopes || []).length - 2}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{(connection.scopes || []).slice(2).join(', ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {expiryInfo ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={cn(
                                  'text-sm cursor-default',
                                  expiryInfo.isExpired ? 'text-destructive' : 'text-muted-foreground'
                                )}>
                                  <div className="font-medium">{expiryInfo.timeText}</div>
                                  <div className="text-xs">{expiryInfo.formattedDate}</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{expiryInfo.isExpired ? 'Token has expired — refresh to restore access' : 'Token is still valid'}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">No expiry</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {connection.last_used_at ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-muted-foreground cursor-default">
                                  {formatDistanceToNow(new Date(connection.last_used_at), { addSuffix: true })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Last tool execution using this connection</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => refreshToken(connection.id)}
                                  disabled={isConnecting}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Refresh access token</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => disconnectConnection(connection.id, connection.connector?.name || 'Unknown')}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Disconnect and revoke access</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Bulk Disconnect Confirmation */}
        <AlertDialog open={showBulkDisconnect} onOpenChange={setShowBulkDisconnect}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect {selectedIds.size} connection(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                This will revoke access tokens and disconnect the selected services. 
                You'll need to re-authenticate to use them again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isBulkDisconnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
