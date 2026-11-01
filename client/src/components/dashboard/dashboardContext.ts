import { useOutletContext } from 'react-router-dom';
import type { LiveClassState } from '@/hooks/useLiveClassState';
import type { StudentDashboard } from '@/types/dashboard';

/** Everything the dashboard pages get from <DashboardLayout> through <Outlet context>. */
export interface DashboardContextValue {
  data: StudentDashboard | null;
  loading: boolean;
  error: string;
  reload: () => void;
  /** current time (ms), refreshed every 30 s */
  now: number;
  liveState: LiveClassState;
  notify: (message: string) => void;
}

export const useDashboardContext = () => useOutletContext<DashboardContextValue>();