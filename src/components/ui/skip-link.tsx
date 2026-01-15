/**
 * Skip link component for keyboard navigation accessibility.
 * Allows keyboard users to skip to main content quickly.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Target element ID to skip to */
  targetId?: string;
}

/**
 * Skip Link component for accessibility.
 * Hidden by default, visible on focus for keyboard navigation.
 *
 * @example
 * ```tsx
 * // In your layout
 * <SkipLink />
 * <header>...</header>
 * <main id="main-content">...</main>
 *
 * // Or with custom target
 * <SkipLink targetId="content-area">Skip to content</SkipLink>
 * ```
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, targetId = 'main-content', children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        className={cn(
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
          'focus:bg-primary focus:text-primary-foreground',
          'focus:px-4 focus:py-2 focus:rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'font-medium text-sm',
          className
        )}
        {...props}
      >
        {children ?? 'Skip to main content'}
      </a>
    );
  }
);

SkipLink.displayName = 'SkipLink';

export { SkipLink };
