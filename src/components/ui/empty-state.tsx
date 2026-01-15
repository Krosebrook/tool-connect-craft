/**
 * Empty state component for when there's no content to display.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'glow' | 'outline';
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state component for lists, tables, and containers with no data.
 *
 * @example
 * ```tsx
 * // Simple empty state
 * <EmptyState
 *   icon={InboxIcon}
 *   title="No messages"
 *   description="You don't have any messages yet."
 * />
 *
 * // With action
 * <EmptyState
 *   icon={PlusIcon}
 *   title="No connectors"
 *   description="Connect your first service to get started."
 *   action={{
 *     label: "Browse Connectors",
 *     onClick: () => navigate('/connectors'),
 *   }}
 * />
 * ```
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon,
      title,
      description,
      action,
      secondaryAction,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center',
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="mb-4 rounded-full bg-muted p-4">
            <Icon
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="flex items-center gap-3">
            {action && (
              <Button variant={action.variant ?? 'default'} onClick={action.onClick}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
