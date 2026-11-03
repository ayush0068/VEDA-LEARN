import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashLogo from '@/components/dashboard/DashLogo';
import { LiveToast, useLiveToast } from '@/components/live/LiveCommon';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileLandscape from '@/components/profile/ProfileLandscape';
import { ProfileSkeleton } from '@/components/profile/ProfileParts';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import type { ProfileContextValue } from '@/components/profile/profileContext';
import { useCart } from '@/context/CartContext';
import { useNotificationState } from '@/hooks/useNotificationState';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { buildNotifications } from '@/utils/dashboardLogic';

/**
 * /profile - signed-in students only. Same top bar as the dashboard, then the "My Profile" banner,
 * a section menu on the left and the chosen section (<Outlet>) on the right.
 */
export default function Profile() {
  const { count } = useCart();
  const location = useLocation();
  const now = useNow();
  const { message, show } = useLiveToast();
  const { seen, markSeen } = useNotificationState();
  const { data } = useStudentDashboard(); // only used for the bell
  const state = useProfile();
  const [drawer, setDrawer] = useState(false);

  const notifications = useMemo(() => (data ? buildNotifications(now, data.assignments, data.activity) : []), [data, now]);

  useEffect(() => {
    setDrawer(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  const { profile, loading, error, reload } = state;
  const ctx: ProfileContextValue | null = profile ? { ...state, profile, notify: show } : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-[#fef1e2] via-[#fef6ef] to-[#fdecd3]">
      <DashboardHeader hideUserName cartCount={count} notifications={notifications} seen={seen} onSeen={markSeen} onOpenMenu={() => setDrawer(true)} />

      <ProfileHero />

      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-5 px-4 pb-40 sm:px-6 lg:grid-cols-[295px_minmax(0,1fr)] lg:gap-7 lg:px-12 lg:pb-40">
        <ProfileSidebar />

        <div className="min-w-0">
          {ctx ? (
            <Outlet context={ctx} />
          ) : loading ? (
            <ProfileSkeleton />
          ) : (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-800">{error || 'Could not load your profile'}</p>
              <button type="button" onClick={() => void reload()} className="btn-primary mt-4 px-6">
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      <ProfileLandscape />

      {/* phone: menu button of the top bar opens the student menu */}
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