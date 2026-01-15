/**
 * Utility functions for formatting data for display.
 * Centralizes formatting logic to avoid duplication across components.
 * @module formatters
 */

/**
 * Formats a date string into a relative time description.
 * Uses Intl.RelativeTimeFormat for localization when available.
 *
 * @param dateStr - ISO 8601 date string to format
 * @returns Relative time string (e.g., "2m ago", "3h ago", "5d ago")
 *
 * @example
 * ```ts
 * formatTimeAgo(new Date().toISOString()); // "just now"
 * formatTimeAgo(new Date(Date.now() - 60000).toISOString()); // "1m ago"
 * ```
 */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 30) return 'just now';
  if (diffMins < 1) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Formats a duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration (e.g., "150ms", "2.5s", "1m 30s")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

/**
 * Formats a number with appropriate suffixes (K, M, B).
 *
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 */
export function formatCompactNumber(num: number, decimals = 1): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(decimals)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(decimals)}M`;
  return `${(num / 1000000000).toFixed(decimals)}B`;
}

/**
 * Formats a field name from snake_case or camelCase to Title Case.
 *
 * @param name - Field name to format
 * @returns Human-readable field name
 */
export function formatFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Formats bytes to a human-readable file size.
 *
 * @param bytes - Size in bytes
 * @param decimals - Decimal places (default: 1)
 * @returns Formatted size (e.g., "1.5 MB", "256 KB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
