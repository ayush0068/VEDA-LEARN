import { useEffect } from 'react';
import { CARD, DashboardSkeleton } from '@/components/dashboard/DashParts';
import { useDashboardContext } from '@/components/dashboard/dashboardContext';
import MyCoursesList from '@/components/dashboard/MyCoursesList';
import { useSavedCourses } from '@/hooks/useSavedCourses';

/** /dashboard/my-courses: every course the student is enrolled in, with the same filter chips as the phone dashboard. */
export default function DashboardMyCourses() {
  const { data, loading, error, reload } = useDashboardContext();
  const saved = useSavedCourses();

  useEffect(() => {
    document.title = 'My Courses | VedaLearn';
  }, []);

  if (loading && !data) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-6">
      <h1 className="font-display text-[1.9rem] font-bold text-veda-bark">My Courses</h1>
      <p className="mb-4 mt-1 text-sm text-veda-muted">Pick up where you left off.</p>
      {data ? (
        <MyCoursesList enrollments={data.enrollments} saved={saved} />
      ) : (
        <div className={`${CARD} p-6 text-center`} role="alert">
          <p className="text-sm text-veda-muted">{error || 'Could not load your courses.'}</p>
          <button type="button" onClick={reload} className="btn-primary mt-4">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}