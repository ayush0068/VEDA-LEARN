import { useEffect, useRef, useState } from 'react';
import { DEFAULT_CATALOG } from '@/constants/courseCatalog';
import { getSearchOverview, searchCourses } from '@/services/search.service';
import type { Course } from '@/types';
import { localOverview, localSearch } from '@/utils/search';

const DEBOUNCE_MS = 220;

/**
 * Data for the search page.
 *  - overview: trending searches + suggested courses (loaded once, defaults shown instantly)
 *  - results: live results for `query` (null while nothing is typed); falls back to the built-in
 *    catalogue when the API / database can't be reached, so search always works.
 */
export const useSearchData = (query: string, active: boolean) => {
  const [overview, setOverview] = useState(() => localOverview(DEFAULT_CATALOG));
  const [results, setResults] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(false);
  const overviewLoaded = useRef(false);
  const requestId = useRef(0);

  // overview is fetched shortly after the page loads (not while the animation plays) and retried on open if it failed
  useEffect(() => {
    const load = () => {
      if (overviewLoaded.current) return;
      overviewLoaded.current = true;
      getSearchOverview()
        .then((data) => {
          const fallback = localOverview(DEFAULT_CATALOG);
          if (data.trending.length > 0 || data.suggested.length > 0) {
            setOverview({
              trending: data.trending.length > 0 ? data.trending : fallback.trending,
              suggested: data.suggested.length > 0 ? data.suggested : fallback.suggested,
            });
          }
        })
        .catch(() => {
          overviewLoaded.current = false;
        });
    };

    if (active) {
      load();
      return;
    }
    const timer = window.setTimeout(load, 1500);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    const q = query.trim();
    const id = ++requestId.current;

    if (!active || !q) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      searchCourses(q)
        .then((data) => {
          if (id === requestId.current) setResults(data.results);
        })
        .catch(() => {
          if (id === requestId.current) setResults(localSearch(DEFAULT_CATALOG, q));
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, active]);

  return { overview, results, loading };
};