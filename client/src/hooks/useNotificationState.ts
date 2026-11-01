import { useCallback, useState } from 'react';

const KEY = 'vedalearn_dash_seen_notifications';

const read = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

/** Which bell notifications were already seen (ids kept in localStorage). */
export const useNotificationState = () => {
  const [seen, setSeen] = useState<string[]>(read);

  const markSeen = useCallback((ids: string[]) => {
    setSeen((prev) => {
      const next = Array.from(new Set([...prev, ...ids])).slice(-100);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  return { seen, markSeen };
};