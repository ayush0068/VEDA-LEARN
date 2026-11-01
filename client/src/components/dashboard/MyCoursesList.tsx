import { useState } from 'react';
import type { DashboardEnrollment } from '@/types/dashboard';
import { CourseRow, NoCoursesCard } from './DashboardCourseCards';
import type { SavedApi } from './DashboardCourseCards';

type Filter = 'all' | 'in-progress' | 'completed';

/** "All (3) · In Progress (2) · Completed (1)" chips + the matching course list. `limit` keeps the dashboard short. */
export default function MyCoursesList({ enrollments, saved, limit }: { enrollments: DashboardEnrollment[]; saved: SavedApi; limit?: number }) {
  const [filter, setFilter] = useState<Filter>('all');

  const counts = {
    all: enrollments.length,
    'in-progress': enrollments.filter((e) => e.status === 'in-progress').length,
    completed: enrollments.filter((e) => e.status === 'completed').length,
  };
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'in-progress', label: `In Progress (${counts['in-progress']})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
  ];

  const filtered = enrollments.filter((e) => filter === 'all' || e.status === filter);
  const list = limit ? filtered.slice(0, limit) : filtered;

  if (!enrollments.length) return <NoCoursesCard />;

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter my courses">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[0.85rem] transition-colors ${
              filter === t.key ? 'border-veda-brown bg-veda-brown font-medium text-ivory' : 'border-gold/35 bg-white/50 text-veda-bark hover:bg-gold-pale/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2" role="tabpanel">
          {list.map((e) => (
            <CourseRow key={e.slug} e={e} saved={saved} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-gold/20 bg-white/40 px-4 py-6 text-center text-sm text-veda-muted" role="tabpanel">
          No courses in this list yet.
        </p>
      )}
    </div>
  );
}