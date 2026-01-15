/**
 * Visually hidden component for accessibility.
 * Content is hidden visually but accessible to screen readers.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Use as label for form elements */
  asLabel?: boolean;
}

/**
 * Visually Hidden component for screen reader-only content.
 * Use for providing additional context to screen reader users.
 *
 * @example
 * ```tsx
 * <Button>
 *   <Icon />
 *   <VisuallyHidden>Close menu</VisuallyHidden>
 * </Button>
 *
 * // As a form label
 * <VisuallyHidden asLabel>
 *   <label htmlFor="search">Search connectors</label>
 * </VisuallyHidden>
 * <input id="search" type="search" />
 * ```
 */
const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, asLabel, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('sr-only', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

VisuallyHidden.displayName = 'VisuallyHidden';

export { VisuallyHidden };
