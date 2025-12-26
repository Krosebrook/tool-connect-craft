import { Layout } from '@/components/layout/Layout';
import { useConnectors } from '@/context/ConnectorContext';
import { JobCard } from '@/components/connectors/JobCard';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plug2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { connectors, connections, jobs, logs } = useConnectors();
  
  const activeConnections = connections.filter(c => c.status === 'active');
  const runningJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued');
  const recentJobs = jobs.slice(0, 10);
  const recentLogs = logs.slice(0, 5);
  
  const successRate = logs.length > 0
    ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)
    : 100;
  
  return (
    <Layout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your connections, jobs, and recent activity.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Active Connections"
            value={activeConnections.length}
            icon={Plug2}
            color="text-success"
          />
          <StatCard
            label="Running Jobs"
            value={runningJobs.length}
            icon={Activity}
            color="text-primary"
            pulse={runningJobs.length > 0}
          />
          <StatCard
            label="Total Actions"
            value={logs.length}
            icon={Clock}
            color="text-muted-foreground"
          />
          <StatCard
            label="Success Rate"
            value={`${successRate}%`}
            icon={successRate === 100 ? CheckCircle2 : AlertCircle}
            color={successRate >= 90 ? 'text-success' : successRate >= 70 ? 'text-warning' : 'text-destructive'}
          />
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Jobs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Jobs
              </h2>
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => {
                  const connector = connectors.find(c => c.id === job.connectorId);
                  return (
                    <JobCard 
                      key={job.id} 
                      job={job} 
                      connector={connector ? { slug: connector.slug, name: connector.name } : undefined}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="connector-card p-8 text-center">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No jobs executed yet</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Connections */}
            <div className="connector-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plug2 className="h-4 w-4 text-muted-foreground" />
                Active Connections
              </h3>
              
              {activeConnections.length > 0 ? (
                <div className="space-y-3">
                  {activeConnections.map((conn) => {
                    const connector = connectors.find(c => c.id === conn.connectorId);
                    if (!connector) return null;
                    return (
                      <Link
                        key={conn.id}
                        to={`/connectors/${connector.slug}`}
                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-sm text-foreground flex-1">{connector.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No active connections
                  <Button asChild variant="link" size="sm" className="block mt-2">
                    <Link to="/connectors">Browse Connectors</Link>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Recent Logs */}
            <div className="connector-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </h3>
              
              {recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-1.5 ${
                        log.status === 'success' ? 'bg-success' : 'bg-destructive'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono text-foreground truncate">
                          {log.toolName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{log.latencyMs.toFixed(0)}ms</span>
                          <span>•</span>
                          <span>{formatTimeAgo(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No activity recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color,
  pulse 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="connector-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-5 w-5 ${color} ${pulse ? 'pulse-live' : ''}`} />
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
