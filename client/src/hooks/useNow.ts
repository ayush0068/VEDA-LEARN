import { useEffect, useState } from 'react';

/** Current time (ms) that re-renders every `intervalMs` - keeps "live now", "today" and "2 hours ago" correct. */
export const useNow = (intervalMs = 30_000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
};