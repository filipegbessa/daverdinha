'use client';
import { useEffect, useState } from 'react';

/**
 * Holds a value back until it stops changing. The conversation search now
 * hits the database, so firing on every keystroke would mean a query per
 * character typed.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
