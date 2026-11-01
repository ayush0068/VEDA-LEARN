import { useCallback, useEffect, useState } from 'react';
import type { ApiRequestError } from '@/services/api';
import { getStudentDashboard } from '@/services/dashboard.service';
import type { StudentDashboard } from '@/types/dashboard';

/** Loads the signed-in student's dashboard from GET /api/dashboard (and re-loads on demand / when the tab regains focus). */
export const useStudentDashboard = () => {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setData(await getStudentDashboard());
      setError('');
    } catch (err) {
      // a failed silent refresh keeps showing the last good data
      if (!silent) setError((err as ApiRequestError).message || 'Could not load your dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // coming back to the tab (e.g. after finishing a lesson elsewhere) -> quietly refresh
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  return { data, loading, error, reload: () => load() };
};