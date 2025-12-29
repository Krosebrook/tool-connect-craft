import { JobStatusBadge } from '@/components/ui/job-status-badge';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Clock, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useConnectors } from '@/context/ConnectorContext';
import { ConnectorIcon } from './ConnectorIcon';
import type { Database } from '@/integrations/supabase/types';

type DbPipelineJob = Database['public']['Tables']['pipeline_jobs']['Row'];
type DbPipelineEvent = Database['public']['Tables']['pipeline_events']['Row'];

interface JobCardProps {
  job: DbPipelineJob;
  connector?: { slug: string; name: string };
  showEvents?: boolean;
}

export function JobCard({ job, connector, showEvents = true }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(job.status === 'running');
  const { events } = useConnectors();
  const jobEvents = events.get(job.id) || [];
  
  const duration = job.finished_at && job.started_at
    ? new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()
    : job.started_at
    ? Date.now() - new Date(job.started_at).getTime()
    : null;
  
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {connector && (
          <ConnectorIcon slug={connector.slug} name={connector.name} className="h-8 w-8" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-foreground">{job.type}</span>
            <JobStatusBadge status={job.status} size="sm" />
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="font-mono">{job.id.slice(0, 12)}</span>
            {duration !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(duration)}
              </span>
            )}
          </div>
        </div>
        
        <span className="text-xs text-muted-foreground">
          {formatTime(job.created_at)}
        </span>
      </div>
      
      {/* Events/Logs */}
      {isExpanded && showEvents && (
        <div className="border-t border-border bg-muted/20">
          <div className="p-3 space-y-1">
            {jobEvents.length > 0 ? (
              jobEvents.map((event) => (
                <EventLine key={event.id} event={event} />
              ))
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Terminal className="h-3.5 w-3.5" />
                No events yet...
              </div>
            )}
          </div>
          
          {/* Output */}
          {job.output && (
            <div className="border-t border-border p-3">
              <div className="text-xs text-muted-foreground mb-2">Output</div>
              <pre className="text-xs font-mono bg-background rounded p-3 overflow-auto max-h-40">
                {JSON.stringify(job.output, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Error */}
          {job.error && (
            <div className="border-t border-border p-3">
              <div className="text-xs text-destructive mb-2">Error</div>
              <pre className="text-xs font-mono bg-destructive/10 text-destructive rounded p-3">
                {job.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventLine({ event }: { event: DbPipelineEvent }) {
  return (
    <div className="flex items-start gap-2 text-xs font-mono py-1">
      <span className="text-muted-foreground shrink-0">
        {new Date(event.ts).toLocaleTimeString()}
      </span>
      <span
        className={cn(
          'shrink-0 uppercase font-semibold',
          event.level === 'info' && 'text-primary',
          event.level === 'warn' && 'text-warning',
          event.level === 'error' && 'text-destructive'
        )}
      >
        [{event.level}]
      </span>
      <span className="text-foreground">{event.message}</span>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
