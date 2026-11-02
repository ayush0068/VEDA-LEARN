import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LiveToast, useLiveToast } from '@/components/live/LiveCommon';
import { useCart } from '@/context/CartContext';
import { useLiveClassState } from '@/hooks/useLiveClassState';
import { useNotificationState } from '@/hooks/useNotificationState';
import { useNow } from '@/hooks/useNow';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { buildNotifications } from '@/utils/dashboardLogic';
import DashboardBottomNav from './DashboardBottomNav';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import DashLogo from './DashLogo';
import type { DashboardContextValue } from './dashboardContext';

/**
 * Shell of the student area: top bar + left menu (desktop), top bar + drawer + tab bar (phone).
 * It loads the dashboard data once and hands it to the pages through <Outlet context>.
 */
export default function DashboardLayout() {
  const { count } = useCart();
  const location = useLocation();
  const now = useNow();
  const { message, show } = useLiveToast();
  const liveState = useLiveClassState(show);
  const { data, loading, error, reload } = useStudentDashboard();
  const { seen, markSeen } = useNotificationState();
  const [drawer, setDrawer] = useState(false);

  const notifications = useMemo(() => (data ? buildNotifications(now, data.assignments, data.activity) : []), [data, now]);

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  // scroll to the top on every dashboard page change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const ctx: DashboardContextValue = { data, loading, error, reload, now, liveState, notify: show };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff6e8] via-[#fdecd0] to-[#fbe2bb]">
      <DashboardHeader cartCount={count} notifications={notifications} seen={seen} onSeen={markSeen} onOpenMenu={() => setDrawer(true)} />

      <div className="lg:flex">
        <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-[217px] shrink-0 border-r border-gold/20 lg:block">
          <DashboardSidebar />
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-8" id="dashboard-main">
          <Outlet context={ctx} />
        </main>
      </div>

      <DashboardBottomNav />

      {/* phone drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="animate-fade-in absolute inset-0 bg-veda-bark/50" />
          <div className="animate-fade-in absolute inset-y-0 left-0 flex w-[17.5rem] max-w-[85vw] flex-col bg-ivory shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <DashLogo compact />
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gold-pale/60">
                <X size={20} aria-hidden />
              </button>
            </div>
            <DashboardSidebar className="flex-1" onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <LiveToast message={message} />
    </div>
  );
}