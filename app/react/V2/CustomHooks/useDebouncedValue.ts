import { useEffect, useState } from 'react';
import { DEFAULT_DEBOUNCE_MS } from './useDebouncedDraft.js';

const useDebouncedValue = <T>(value: T, delay = DEFAULT_DEBOUNCE_MS) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
};

export { useDebouncedValue };
