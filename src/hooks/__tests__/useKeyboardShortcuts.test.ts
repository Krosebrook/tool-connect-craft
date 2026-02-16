import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, getModifierKey, formatShortcut } from '../useKeyboardShortcuts';

function fireKey(opts: Partial<KeyboardEventInit> & { key: string }) {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...opts }));
}

describe('useKeyboardShortcuts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls callback when matching key is pressed', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', callback: cb }]));
    fireKey({ key: 'k' });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('matches ctrlOrCmd with ctrlKey', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', ctrlOrCmd: true, callback: cb }]));
    fireKey({ key: 'k', ctrlKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('matches ctrlOrCmd with metaKey', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', ctrlOrCmd: true, callback: cb }]));
    fireKey({ key: 'k', metaKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does not fire ctrlOrCmd shortcut without modifier', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', ctrlOrCmd: true, callback: cb }]));
    fireKey({ key: 'k' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('matches shift modifier', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'p', shift: true, callback: cb }]));
    fireKey({ key: 'p', shiftKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('matches alt modifier', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'a', alt: true, callback: cb }]));
    fireKey({ key: 'a', altKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('prevents default by default', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', callback: cb }]));
    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it('does not prevent default when preventDefault is false', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', callback: cb, preventDefault: false }]));
    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);
    expect(spy).not.toHaveBeenCalled();
  });

  it('ignores shortcuts when focused on an input', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', callback: cb }]));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
    expect(cb).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('allows Escape even when focused on an input', () => {
    const cb = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'Escape', callback: cb }]));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cb).toHaveBeenCalledOnce();
    document.body.removeChild(input);
  });

  it('cleans up listener on unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts([{ key: 'k', callback: cb }]));
    unmount();
    fireKey({ key: 'k' });
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('getModifierKey', () => {
  it('returns Ctrl by default in jsdom', () => {
    expect(getModifierKey()).toBe('Ctrl');
  });
});

describe('formatShortcut', () => {
  it('formats simple key', () => {
    expect(formatShortcut({ key: 'k', callback: vi.fn() })).toBe('K');
  });

  it('formats ctrlOrCmd shortcut', () => {
    const result = formatShortcut({ key: 'k', ctrlOrCmd: true, callback: vi.fn() });
    expect(result).toContain('K');
    expect(result).toMatch(/Ctrl|⌘/);
  });

  it('formats shift shortcut', () => {
    expect(formatShortcut({ key: 'p', shift: true, callback: vi.fn() })).toBe('Shift+P');
  });

  it('formats combined modifiers', () => {
    const result = formatShortcut({ key: 'p', ctrlOrCmd: true, shift: true, alt: true, callback: vi.fn() });
    expect(result).toMatch(/Ctrl\+Shift\+Alt\+P|⌘\+Shift\+Alt\+P/);
  });
});
