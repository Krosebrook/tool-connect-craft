import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MCPHealthIndicatorProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latencyMs?: number | null;
  className?: string;
}

const statusConfig = {
  healthy: { label: 'Online', color: 'bg-emerald-400', pulse: true },
  degraded: { label: 'Degraded', color: 'bg-amber-400', pulse: true },
  unhealthy: { label: 'Offline', color: 'bg-destructive', pulse: false },
  unknown: { label: 'Unknown', color: 'bg-muted-foreground', pulse: false },
} as const;

export function MCPHealthIndicator({ status, latencyMs, className }: MCPHealthIndicatorProps) {
  const config = statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex items-center gap-1.5 cursor-default', className)}>
          <span className="relative flex h-2.5 w-2.5">
            {config.pulse && (
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                  config.color
                )}
              />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-2.5 w-2.5',
                config.color
              )}
            />
          </span>
          <span className="text-xs text-muted-foreground">{config.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          MCP Server: {config.label}
          {latencyMs != null && ` (${latencyMs}ms)`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
