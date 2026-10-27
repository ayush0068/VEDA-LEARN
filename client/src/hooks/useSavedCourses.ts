import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vedalearn_saved_courses';

const read = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

/** Bookmarked courses (slugs in localStorage). Swap for a server-backed wishlist later. */
export const useSavedCourses = () => {
  const [saved, setSaved] = useState<string[]>(read);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      /* storage unavailable */
    }
  }, [saved]);

  const isSaved = useCallback((slug: string) => saved.includes(slug), [saved]);
  const toggleSaved = useCallback(
    (slug: string) => setSaved((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
    [],
  );

  return { isSaved, toggleSaved };
};