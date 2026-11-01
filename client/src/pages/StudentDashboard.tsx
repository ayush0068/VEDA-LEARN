import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CARD, DashboardSkeleton } from '@/components/dashboard/DashParts';
import { useDashboardContext } from '@/components/dashboard/dashboardContext';
import DesktopDashboard from '@/components/dashboard/DesktopDashboard';
import MobileDashboard from '@/components/dashboard/MobileDashboard';
import { useAuth } from '@/context/AuthContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSavedCourses } from '@/hooks/useSavedCourses';

/** Student Dashboard (/dashboard): desktop and phone have their own layouts, both fed by GET /api/dashboard. */
export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload, now, liveState, notify } = useDashboardContext();
  const saved = useSavedCourses(); // one instance, so every bookmark button on the page stays in sync
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const location = useLocation();

  useEffect(() => {
    document.title = 'My Dashboard | VedaLearn';
  }, []);

  // /dashboard#something scrolls to that section once the data is on screen
  useEffect(() => {
    if (!data || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [data, location.hash]);

  if (loading && !data) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <div className={`${CARD} mx-auto max-w-md p-8 text-center`} role="alert">
          <h1 className="font-display text-2xl font-bold text-veda-bark">We couldn’t load your dashboard</h1>
          <p className="mt-2 text-sm text-veda-muted">{error || 'Something went wrong. Please try again.'}</p>
          <button type="button" onClick={reload} className="btn-primary mt-5">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const userName = data.user.name || user?.name || 'Student';
  const props = { data, userName, ctx: { now, liveState, notify }, saved };
  return isDesktop ? <DesktopDashboard {...props} /> : <MobileDashboard {...props} />;
}