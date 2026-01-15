/**
 * Unit tests for formatter utility functions.
 * @module formatters.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTimeAgo,
  formatDuration,
  formatCompactNumber,
  formatFieldName,
  formatBytes,
} from '../formatters';

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for dates within 30 seconds', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe('just now');
  });

  it('formats seconds ago correctly', () => {
    const thirtySecsAgo = new Date(Date.now() - 45000).toISOString();
    expect(formatTimeAgo(thirtySecsAgo)).toBe('45s ago');
  });

  it('formats minutes ago correctly', () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatTimeAgo(fiveMinsAgo)).toBe('5m ago');
  });

  it('formats hours ago correctly', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('formats days ago correctly', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('formats weeks ago correctly', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(formatTimeAgo(twoWeeksAgo)).toBe('2w ago');
  });

  it('formats older dates with month and day', () => {
    const oldDate = new Date('2024-01-01T00:00:00Z').toISOString();
    const result = formatTimeAgo(oldDate);
    expect(result).toContain('Jan');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds for values under 1 second', () => {
    expect(formatDuration(150)).toBe('150ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds for values under 1 minute', () => {
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(30000)).toBe('30.0s');
  });

  it('formats minutes and seconds for longer durations', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(120000)).toBe('2m');
    expect(formatDuration(185000)).toBe('3m 5s');
  });
});

describe('formatCompactNumber', () => {
  it('returns plain number for values under 1000', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(500)).toBe('500');
    expect(formatCompactNumber(999)).toBe('999');
  });

  it('formats thousands with K suffix', () => {
    expect(formatCompactNumber(1000)).toBe('1.0K');
    expect(formatCompactNumber(2500)).toBe('2.5K');
    expect(formatCompactNumber(999999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatCompactNumber(1000000)).toBe('1.0M');
    expect(formatCompactNumber(2500000)).toBe('2.5M');
  });

  it('formats billions with B suffix', () => {
    expect(formatCompactNumber(1000000000)).toBe('1.0B');
    expect(formatCompactNumber(5500000000)).toBe('5.5B');
  });

  it('respects custom decimal places', () => {
    expect(formatCompactNumber(1234567, 2)).toBe('1.23M');
    expect(formatCompactNumber(1234567, 0)).toBe('1M');
  });
});

describe('formatFieldName', () => {
  it('converts snake_case to Title Case', () => {
    expect(formatFieldName('user_name')).toBe('User name');
    expect(formatFieldName('created_at')).toBe('Created at');
  });

  it('converts camelCase to Title Case', () => {
    expect(formatFieldName('userName')).toBe('User Name');
    expect(formatFieldName('createdAt')).toBe('Created At');
  });

  it('handles single words', () => {
    expect(formatFieldName('name')).toBe('Name');
  });
});

describe('formatBytes', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(2621440)).toBe('2.5 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('respects custom decimal places', () => {
    expect(formatBytes(1536, 2)).toBe('1.5 KB');
    expect(formatBytes(1536, 0)).toBe('2 KB');
  });
});
