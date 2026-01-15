/**
 * Loading spinner component with multiple size variants.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { VisuallyHidden } from './visually-hidden';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Screen reader label */
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

/**
 * Loading spinner with accessibility support.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With custom size and label
 * <LoadingSpinner size="lg" label="Loading connectors..." />
 *
 * // Full page loading
 * <div className="flex items-center justify-center min-h-screen">
 *   <LoadingSpinner size="xl" />
 * </div>
 * ```
 */
const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', label = 'Loading...', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <Loader2
          className={cn('animate-spin text-primary', sizeClasses[size])}
          aria-hidden="true"
        />
        <VisuallyHidden>{label}</VisuallyHidden>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Full page loading overlay.
 */
const PageLoader = React.forwardRef<HTMLDivElement, Omit<LoadingSpinnerProps, 'size'>>(
  ({ className, label = 'Loading page...', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-background/80 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="xl" label={label} />
          <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
        </div>
      </div>
    );
  }
);

PageLoader.displayName = 'PageLoader';

export { LoadingSpinner, PageLoader };
