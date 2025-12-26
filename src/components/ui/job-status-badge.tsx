import { JobStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2, Circle } from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<JobStatus, {
  label: string;
  className: string;
  icon: React.ReactNode;
}> = {
  queued: {
    label: 'Queued',
    className: 'bg-muted/50 text-muted-foreground border border-border',
    icon: <Circle className="h-3 w-3" />,
  },
  running: {
    label: 'Running',
    className: 'bg-primary/15 text-primary border border-primary/30',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  succeeded: {
    label: 'Succeeded',
    className: 'status-active',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: 'Failed',
    className: 'status-error',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  canceled: {
    label: 'Canceled',
    className: 'status-revoked',
    icon: <XCircle className="h-3 w-3" />,
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function JobStatusBadge({ status, className, showIcon = true, size = 'md' }: JobStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}
