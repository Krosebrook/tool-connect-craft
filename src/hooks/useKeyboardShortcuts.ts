/**
 * Hook for handling keyboard shortcuts with accessibility support.
 * @module useKeyboardShortcuts
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  /** Key to listen for (e.g., 'k', 'Escape', 'Enter') */
  key: string;
  /** Require Ctrl/Cmd key */
  ctrlOrCmd?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Callback to execute */
  callback: (event: KeyboardEvent) => void;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Description for accessibility */
  description?: string;
}

/**
 * Hook to register keyboard shortcuts.
 * Automatically handles Ctrl vs Cmd for cross-platform support.
 *
 * @param shortcuts - Array of keyboard shortcuts to register
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'k',
 *     ctrlOrCmd: true,
 *     callback: () => setSearchOpen(true),
 *     description: 'Open search',
 *   },
 *   {
 *     key: 'Escape',
 *     callback: () => setSearchOpen(false),
 *     description: 'Close search',
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const ctrlOrCmd = shortcut.ctrlOrCmd
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey;

        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Allow Escape to work even in inputs
        const allowInInput = shortcut.key === 'Escape';

        if (
          keyMatch &&
          ctrlOrCmd &&
          shiftMatch &&
          altMatch &&
          (!isInput || allowInInput)
        ) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.callback(event);
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get the modifier key label for the current platform.
 *
 * @returns 'Cmd' for macOS, 'Ctrl' for others
 */
export function getModifierKey(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
  }
  return 'Ctrl';
}

/**
 * Format a keyboard shortcut for display.
 *
 * @param shortcut - Shortcut configuration
 * @returns Human-readable shortcut string (e.g., "⌘K", "Ctrl+Shift+P")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlOrCmd) {
    parts.push(getModifierKey());
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push('Alt');
  }
  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}
