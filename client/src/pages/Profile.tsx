import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { LiveToast, useLiveToast } from '@/components/live/LiveCommon';
import ProfileDrawer from '@/components/profile/ProfileDrawer';
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

  const { profile, loading, error, reload } = state;
  const ctx: ProfileContextValue | null = profile ? { ...state, profile, notify: show } : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-[#fef1e2] via-[#fef6ef] to-[#fdecd3]">
      <DashboardHeader current="profile" hideUserName cartCount={count} notifications={notifications} seen={seen} onSeen={markSeen} onOpenMenu={() => setDrawer(true)} />

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

      {/* phone: the menu button of the top bar opens the profile sections */}
      <ProfileDrawer open={drawer} onClose={() => setDrawer(false)} />

      <LiveToast message={message} />
    </div>
  );
}