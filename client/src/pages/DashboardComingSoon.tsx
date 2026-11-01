import { Link, useParams } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { DASH_SECTION_TITLES } from '@/constants/dashboard';

/** Sidebar pages that are not built yet (Certificates, Bookmarks, Notes, Assignments, Settings) */
export default function DashboardComingSoon() {
  const { section = '' } = useParams();
  const title = DASH_SECTION_TITLES[section] ?? 'This page';

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className={`${CARD} mx-auto max-w-md p-8 text-center`}>
        <h1 className="font-display text-3xl font-bold text-veda-bark">{title}</h1>
        <p className="mt-2 text-sm text-veda-muted">This section is coming in a later milestone.</p>
        <Link to="/dashboard" className="btn-primary mt-5">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}