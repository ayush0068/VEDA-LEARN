import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LiveClass } from '@/constants/liveClasses';

const SAVED_KEY = 'vedalearn_saved_live_classes';
const ENROLLED_KEY = 'vedalearn_enrolled_live_classes';

const read = (key: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const usePersistedList = (key: string) => {
  const [list, setList] = useState<string[]>(() => read(key));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* storage unavailable */
    }
  }, [key, list]);
  return [list, setList] as const;
};

/**
 * Bookmarks + enrollments for live classes (ids in localStorage; swap for a server call later)
 * and the shared "Join Live Class" behaviour used by the cards and the detail page.
 */
export const useLiveClassState = (notify: (message: string) => void) => {
  const navigate = useNavigate();
  const [saved, setSaved] = usePersistedList(SAVED_KEY);
  const [enrolled, setEnrolled] = usePersistedList(ENROLLED_KEY);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);
  const isEnrolled = useCallback((id: string) => enrolled.includes(id), [enrolled]);

  const toggleSaved = useCallback(
    (c: LiveClass) => {
      const was = saved.includes(c.id);
      setSaved((prev) => (was ? prev.filter((x) => x !== c.id) : [...prev, c.id]));
      notify(was ? 'Removed from saved classes' : 'Class saved');
    },
    [saved, setSaved, notify],
  );

  const enroll = useCallback((id: string) => setEnrolled((prev) => (prev.includes(id) ? prev : [...prev, id])), [setEnrolled]);
  const unenroll = useCallback((id: string) => setEnrolled((prev) => prev.filter((x) => x !== id)), [setEnrolled]);

  /** Join Live Class: register first, open the class link when it is live, otherwise go to the details */
  const join = useCallback(
    (c: LiveClass) => {
      if (c.status === 'completed') {
        navigate(`/live-classes/${c.id}`);
        return;
      }
      const first = !enrolled.includes(c.id);
      if (first) enroll(c.id);

      if (c.status === 'ongoing') {
        window.open(c.joinUrl, '_blank', 'noopener,noreferrer');
        notify(`Opening ${c.platform}…`);
      } else if (first) {
        notify(`You're registered for “${c.title}”. Find it under My Enrollments.`);
      } else {
        navigate(`/live-classes/${c.id}`);
      }
    },
    [enrolled, enroll, navigate, notify],
  );

  return { savedIds: saved, enrolledIds: enrolled, isSaved, isEnrolled, toggleSaved, enroll, unenroll, join };
};

export type LiveClassState = ReturnType<typeof useLiveClassState>;