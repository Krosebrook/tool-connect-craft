import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Activity,
  Server,
  Wifi,
  Clock,
  AlertCircle,
  Bell,
  BellOff,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealthNotifications } from '@/hooks/useHealthNotifications';
import { useHealthAlerts } from '@/hooks/useHealthAlerts';

interface HealthCheckResult {
  connectorId: string;
  connectorName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  mcpServer: {
    configured: boolean;
    reachable: boolean;
    latencyMs: number | null;
    error: string | null;
  } | null;
  restApi: {
    configured: boolean;
    reachable: boolean;
    latencyMs: number | null;
    error: string | null;
  } | null;
  checkedAt: string;
}

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
}

interface HealthCheckResponse {
  success: boolean;
  summary?: HealthSummary;
  results?: HealthCheckResult[];
  error?: string;
}

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export function HealthCheckDashboard() {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    supported: notificationsSupported,
    enabled: notificationsEnabled,
    toggleNotifications,
    checkHealthChanges,
    sendTestNotification,
  } = useHealthNotifications();

  const { sendHealthAlerts } = useHealthAlerts();

  const fetchHealthStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<HealthCheckResponse>(
        'health-check'
      );

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.success) {
        setResults(data.results || []);
        setSummary(data.summary || null);
        setLastChecked(new Date());
        
        // Check for health changes and send notifications
        if (data.results) {
          checkHealthChanges(data.results);
          
          // Send email alerts for unhealthy connectors
          const unhealthyConnectors = data.results.filter(
            (r: HealthCheckResult) => r.status === 'unhealthy' || r.status === 'degraded'
          );
          if (unhealthyConnectors.length > 0) {
            sendHealthAlerts(unhealthyConnectors.map((r: HealthCheckResult) => ({
              connector: r.connectorName,
              slug: r.connectorId,
              status: r.status,
              error: r.mcpServer?.error || r.restApi?.error,
              latencyMs: r.mcpServer?.latencyMs || r.restApi?.latencyMs,
            })));
          }
        }
      } else {
        throw new Error(data?.error || 'Health check failed');
      }
    } catch (err) {
      console.error('Health check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  }, [checkHealthChanges]);

  useEffect(() => {
    fetchHealthStatus();
  }, [fetchHealthStatus]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthStatus, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealthStatus]);

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    const variants = {
      healthy: 'status-active',
      degraded: 'status-pending',
      unhealthy: 'status-error',
    };
    return (
      <span className={cn('status-chip', variants[status])}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getLatencyColor = (latencyMs: number | null) => {
    if (latencyMs === null) return 'text-muted-foreground';
    if (latencyMs < 200) return 'text-success';
    if (latencyMs < 500) return 'text-warning';
    return 'text-destructive';
  };

  const healthPercentage = summary
    ? Math.round((summary.healthy / Math.max(summary.total, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Connector Health
          </h2>
          {lastChecked && (
            <p className="text-sm text-muted-foreground mt-1">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notificationsSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!notificationsEnabled) {
                  toggleNotifications(true).then((success) => {
                    if (success) sendTestNotification();
                  });
                } else {
                  toggleNotifications(false);
                }
              }}
              className={cn(notificationsEnabled && 'border-primary/50')}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 mr-2" />
              )}
              {notificationsEnabled ? 'Alerts On' : 'Alerts Off'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && 'border-primary/50')}
          >
            <Clock className={cn('h-4 w-4 mr-2', autoRefresh && 'text-primary')} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealthStatus}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="connector-card p-4 border-destructive/50 bg-destructive/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Health Check Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Connectors"
            value={summary.total}
            icon={Server}
            color="text-foreground"
          />
          <SummaryCard
            label="Healthy"
            value={summary.healthy}
            icon={CheckCircle2}
            color="text-success"
          />
          <SummaryCard
            label="Degraded"
            value={summary.degraded}
            icon={AlertTriangle}
            color="text-warning"
          />
          <SummaryCard
            label="Unhealthy"
            value={summary.unhealthy}
            icon={XCircle}
            color="text-destructive"
          />
        </div>
      )}

      {/* Overall Health Progress */}
      {summary && summary.total > 0 && (
        <div className="connector-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Overall Health</span>
            <span className={cn(
              'text-lg font-bold',
              healthPercentage >= 80 ? 'text-success' :
              healthPercentage >= 50 ? 'text-warning' : 'text-destructive'
            )}>
              {healthPercentage}%
            </span>
          </div>
          <Progress 
            value={healthPercentage} 
            className="h-2"
          />
        </div>
      )}

      {/* Connector Status List */}
      <div className="space-y-3">
        {loading && results.length === 0 ? (
          <div className="connector-card p-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin mb-3" />
            <p className="text-muted-foreground">Checking connector health...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="connector-card p-8 text-center">
            <Server className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No connectors configured</p>
          </div>
        ) : (
          results.map((result) => (
            <ConnectorHealthCard key={result.connectorId} result={result} />
          ))
        )}
      </div>

      {/* Alerts Section */}
      {results.filter(r => r.status !== 'healthy').length > 0 && (
        <div className="connector-card p-5 border-warning/30">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Active Alerts
          </h3>
          <div className="space-y-3">
            {results
              .filter(r => r.status !== 'healthy')
              .map((result) => (
                <div
                  key={result.connectorId}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{result.connectorName}</p>
                    <div className="text-sm text-muted-foreground space-y-1 mt-1">
                      {result.mcpServer && !result.mcpServer.reachable && (
                        <p>MCP Server: {result.mcpServer.error || 'Unreachable'}</p>
                      )}
                      {result.restApi && !result.restApi.reachable && (
                        <p>REST API: {result.restApi.error || 'Unreachable'}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="connector-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function ConnectorHealthCard({ result }: { result: HealthCheckResult }) {
  const [expanded, setExpanded] = useState(result.status !== 'healthy');

  const getLatencyDisplay = (latencyMs: number | null) => {
    if (latencyMs === null) return '—';
    return `${latencyMs}ms`;
  };

  const getLatencyColor = (latencyMs: number | null) => {
    if (latencyMs === null) return 'text-muted-foreground';
    if (latencyMs < 200) return 'text-success';
    if (latencyMs < 500) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div
      className={cn(
        'connector-card p-4 cursor-pointer transition-all',
        result.status === 'healthy' && 'border-success/20',
        result.status === 'degraded' && 'border-warning/30',
        result.status === 'unhealthy' && 'border-destructive/30'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          'h-3 w-3 rounded-full',
          result.status === 'healthy' && 'bg-success',
          result.status === 'degraded' && 'bg-warning',
          result.status === 'unhealthy' && 'bg-destructive'
        )} />
        
        <div className="flex-1">
          <p className="font-medium text-foreground">{result.connectorName}</p>
          <p className="text-xs text-muted-foreground">
            Checked {new Date(result.checkedAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {result.mcpServer?.configured && (
            <div className="flex items-center gap-1.5">
              <Server className={cn(
                'h-4 w-4',
                result.mcpServer.reachable ? 'text-success' : 'text-destructive'
              )} />
              <span className={cn('text-xs font-mono', getLatencyColor(result.mcpServer.latencyMs))}>
                {getLatencyDisplay(result.mcpServer.latencyMs)}
              </span>
            </div>
          )}
          
          {result.restApi?.configured && (
            <div className="flex items-center gap-1.5">
              <Wifi className={cn(
                'h-4 w-4',
                result.restApi.reachable ? 'text-success' : 'text-destructive'
              )} />
              <span className={cn('text-xs font-mono', getLatencyColor(result.restApi.latencyMs))}>
                {getLatencyDisplay(result.restApi.latencyMs)}
              </span>
            </div>
          )}
        </div>

        {result.status === 'healthy' ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : result.status === 'degraded' ? (
          <AlertTriangle className="h-5 w-5 text-warning" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
      </div>

      {expanded && (result.mcpServer || result.restApi) && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {result.mcpServer?.configured && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">MCP Server</span>
              </div>
              <div className="flex items-center gap-3">
                {result.mcpServer.reachable ? (
                  <Badge variant="outline" className="border-success/50 text-success">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/50 text-destructive">
                    {result.mcpServer.error || 'Disconnected'}
                  </Badge>
                )}
                {result.mcpServer.latencyMs !== null && (
                  <span className={cn('font-mono', getLatencyColor(result.mcpServer.latencyMs))}>
                    {result.mcpServer.latencyMs}ms
                  </span>
                )}
              </div>
            </div>
          )}

          {result.restApi?.configured && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">REST API</span>
              </div>
              <div className="flex items-center gap-3">
                {result.restApi.reachable ? (
                  <Badge variant="outline" className="border-success/50 text-success">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-destructive/50 text-destructive">
                    {result.restApi.error || 'Unavailable'}
                  </Badge>
                )}
                {result.restApi.latencyMs !== null && (
                  <span className={cn('font-mono', getLatencyColor(result.restApi.latencyMs))}>
                    {result.restApi.latencyMs}ms
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
