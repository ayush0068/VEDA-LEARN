import { useEffect, useState } from 'react';
import { getHealth } from '@/services/health.service';
import type { HealthResponse } from '@/types';

interface HealthState {
  data: HealthResponse | null;
  error: string | null;
  loading: boolean;
}

export const useHealth = (): HealthState => {
  const [state, setState] = useState<HealthState>({ data: null, error: null, loading: true });

  useEffect(() => {
    let active = true;
    getHealth()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((err: Error) => active && setState({ data: null, error: err.message, loading: false }));
    return () => {
      active = false;
    };
  }, []);

  return state;
};
