import { ConnectionStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: ConnectionStatus | 'none';
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<ConnectionStatus | 'none', {
  label: string;
  className: string;
  icon: React.ReactNode;
}> = {
  active: {
    label: 'Connected',
    className: 'status-active',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: 'Pending',
    className: 'status-pending',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  expired: {
    label: 'Expired',
    className: 'status-error',
    icon: <Clock className="h-3 w-3" />,
  },
  revoked: {
    label: 'Revoked',
    className: 'status-revoked',
    icon: <XCircle className="h-3 w-3" />,
  },
  error: {
    label: 'Error',
    className: 'status-error',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  none: {
    label: 'Not Connected',
    className: 'bg-muted/50 text-muted-foreground border border-border',
    icon: null,
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({ status, className, showIcon = true, size = 'md' }: StatusBadgeProps) {
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
