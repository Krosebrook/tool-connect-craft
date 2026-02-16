import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage, clearLocalStorageByPrefix } from '../useLocalStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('useLocalStorage', () => {
  it('returns the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('updates the value and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => result.current[1]('updated'));
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated');
  });

  it('supports updater function', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(1);
  });

  it('removes value from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => result.current[1]('something'));
    act(() => result.current[2]());
    expect(result.current[0]).toBe('default');
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('works with objects', () => {
    const initial = { name: 'test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('obj-key', initial));
    act(() => result.current[1]({ name: 'updated', count: 5 }));
    expect(result.current[0]).toEqual({ name: 'updated', count: 5 });
  });

  it('works with arrays', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('arr-key', []));
    act(() => result.current[1](['a', 'b']));
    expect(result.current[0]).toEqual(['a', 'b']);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('bad-key', 'not-json');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    spy.mockRestore();
  });

  it('dispatches custom event on setValue', () => {
    const listener = vi.fn();
    window.addEventListener('local-storage-change', listener);
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => result.current[1]('new-value'));
    expect(listener).toHaveBeenCalled();
    window.removeEventListener('local-storage-change', listener);
  });

  it('responds to storage events from other tabs', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'test-key', newValue: JSON.stringify('from-other-tab') })
      );
    });
    expect(result.current[0]).toBe('from-other-tab');
  });
});

describe('clearLocalStorageByPrefix', () => {
  it('removes only items with the matching prefix', () => {
    localStorage.setItem('mcp-hub-theme', 'dark');
    localStorage.setItem('mcp-hub-lang', 'en');
    localStorage.setItem('other-key', 'keep');
    clearLocalStorageByPrefix('mcp-hub-');
    expect(localStorage.getItem('mcp-hub-theme')).toBeNull();
    expect(localStorage.getItem('mcp-hub-lang')).toBeNull();
    expect(localStorage.getItem('other-key')).toBe('keep');
  });

  it('does nothing when no items match', () => {
    localStorage.setItem('keep', 'value');
    clearLocalStorageByPrefix('no-match-');
    expect(localStorage.getItem('keep')).toBe('value');
  });
});
