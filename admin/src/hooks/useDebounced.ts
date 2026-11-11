import { useEffect, useState } from 'react';

/** Returns `value` only after it has stopped changing for `delay` ms (used for live search boxes). */
export const useDebounced = <T,>(value: T, delay = 350): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};