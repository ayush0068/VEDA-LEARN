import { CalendarX2, SearchX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LiveBottomNav from '@/components/live/LiveBottomNav';
import LiveCalendar from '@/components/live/LiveCalendar';
import LiveClassCard from '@/components/live/LiveClassCard';
import LiveClassRow from '@/components/live/LiveClassRow';
import { LiveToast, useLiveToast } from '@/components/live/LiveCommon';
import LiveFilters, { EMPTY_LIVE_FILTERS, hasActiveLiveFilters } from '@/components/live/LiveFilters';
import type { LiveFilterState } from '@/components/live/LiveFilters';
import LiveHero from '@/components/live/LiveHero';
import { FeaturedTeacher, RecordingsCta, WhyJoin } from '@/components/live/LiveSidebar';
import LiveTabs from '@/components/live/LiveTabs';
import type { LiveTab } from '@/components/live/LiveTabs';
import { LIVE_CLASSES, LIVE_TEACHERS, LIVE_TIME_OPTIONS } from '@/constants/liveClasses';
import type { LiveClass } from '@/constants/liveClasses';
import { useLiveClassState } from '@/hooks/useLiveClassState';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { classSortKey, monthKey, startHour } from '@/utils/liveClassFormat';

const TAB_IDS: LiveTab[] = ['upcoming', 'ongoing', 'enrollments', 'recordings'];

const HEADINGS: Record<LiveTab, { title: string; sub: string; empty: string }> = {
  upcoming: {
    title: 'Upcoming Live Classes',
    sub: 'Join our upcoming live sessions and learn directly from expert teachers',
    empty: 'No upcoming classes match your filters.',
  },
  ongoing: {
    title: 'Ongoing Now',
    sub: 'Classes that are live right now. Jump in and learn in real time',
    empty: 'No class is live right now. Check the upcoming classes.',
  },
  enrollments: {
    title: 'My Enrollments',
    sub: 'Classes you have registered for',
    empty: "You haven't registered for any class yet. Join one from Upcoming Classes.",
  },
  recordings: {
    title: 'Class Recordings',
    sub: 'Missed a session? Watch the recordings and revise at your own pace',
    empty: 'No recordings match your filters.',
  },
};

const statusMatches = (c: LiveClass, tab: LiveTab, enrolledIds: string[]) => {
  switch (tab) {
    case 'upcoming':
      return c.status === 'upcoming';
    case 'ongoing':
      return c.status === 'ongoing';
    case 'recordings':
      return c.status === 'completed';
    default:
      return enrolledIds.includes(c.id);
  }
};

// month the calendar opens on: the first class that is not finished yet
const FIRST_OPEN = LIVE_CLASSES.filter((c) => c.status !== 'completed').sort((a, b) => classSortKey(a).localeCompare(classSortKey(b)))[0];
const INITIAL_MONTH = monthKey((FIRST_OPEN ?? LIVE_CLASSES[0]).date);

export default function LiveClasses() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as LiveTab | null;
  const tab: LiveTab = tabParam && TAB_IDS.includes(tabParam) ? tabParam : 'upcoming';

  const [filters, setFilters] = useState<LiveFilterState>(EMPTY_LIVE_FILTERS);
  const [month, setMonth] = useState(INITIAL_MONTH);
  const listRef = useRef<HTMLDivElement>(null);

  const { message, show } = useLiveToast();
  const state = useLiveClassState(show);

  const setTab = useCallback(
    (next: LiveTab) => {
      const p = new URLSearchParams(params);
      if (next === 'upcoming') p.delete('tab');
      else p.set('tab', next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  const patchFilters = (patch: Partial<LiveFilterState>) => setFilters((f) => ({ ...f, ...patch }));
  const clearFilters = () => setFilters(EMPTY_LIVE_FILTERS);

  const scrollToList = () => window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);

  // a date picked in the Date filter moves the calendar to that month
  useEffect(() => {
    if (filters.date) setMonth(monthKey(filters.date));
  }, [filters.date]);

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const bucket = LIVE_TIME_OPTIONS.find((t) => t.value === filters.time);
    const teacherName = (id: string) => LIVE_TEACHERS.find((t) => t.id === id)?.name ?? '';

    const list = LIVE_CLASSES.filter((c) => {
      if (!statusMatches(c, tab, state.enrolledIds)) return false;
      if (filters.category && c.category !== filters.category) return false;
      if (filters.teacher && c.teacherId !== filters.teacher) return false;
      if (filters.level && c.level !== filters.level) return false;
      if (filters.date && c.date !== filters.date) return false;
      if (bucket && !(startHour(c) >= bucket.from && startHour(c) < bucket.to)) return false;
      if (q && !`${c.title} ${teacherName(c.teacherId)} ${c.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });

    const sorted = list.sort((a, b) => classSortKey(a).localeCompare(classSortKey(b)));
    return tab === 'recordings' ? sorted.reverse() : sorted;
  }, [tab, filters, state.enrolledIds]);

  const onCalendarSelect = (iso: string, onDay: LiveClass[]) => {
    if (filters.date === iso) {
      patchFilters({ date: '' });
      return;
    }
    patchFilters({ date: iso });
    if (onDay.some((c) => c.status === 'upcoming')) setTab('upcoming');
    else if (onDay.some((c) => c.status === 'ongoing')) setTab('ongoing');
    else setTab('recordings');
    scrollToList();
  };

  const viewTeacher = (teacherId: string) => {
    setFilters({ ...EMPTY_LIVE_FILTERS, teacher: teacherId });
    setTab('upcoming');
    scrollToList();
  };

  const browseRecordings = () => {
    setTab('recordings');
    scrollToList();
  };

  const heading = HEADINGS[tab];
  const filtered = hasActiveLiveFilters(filters);

  return (
    <div>
      <LiveHero />

      <section className="relative z-10 -mt-8 rounded-t-[1.75rem] border-t border-gold/20 bg-ivory pb-10 pt-5 shadow-[0_-14px_30px_-20px_rgba(90,45,15,0.45)] lg:pb-14 lg:pt-6">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_316px] lg:gap-7 lg:px-8">
          <div className="min-w-0">
            <LiveTabs active={tab} onChange={setTab} />

            <div className="mt-4">
              <LiveFilters filters={filters} onChange={patchFilters} onClear={clearFilters} />
            </div>

            <div ref={listRef} className="mt-6 scroll-mt-24 lg:mt-7">
              <h2 className="font-display text-[1.6rem] font-semibold leading-tight text-veda-bark lg:text-[1.9rem]">{heading.title}</h2>
              <p className="mt-1 text-sm text-veda-text">{heading.sub}</p>

              {results.length === 0 ? (
                <div className="mt-6 flex flex-col items-center rounded-2xl border border-gold/25 bg-cream/50 px-6 py-14 text-center">
                  {filtered ? <SearchX size={36} strokeWidth={1.3} className="text-saffron" aria-hidden /> : <CalendarX2 size={36} strokeWidth={1.3} className="text-saffron" aria-hidden />}
                  <h3 className="mt-3 font-display text-xl font-semibold text-veda-bark">No classes found</h3>
                  <p className="mt-1 max-w-sm text-sm text-veda-muted">{filtered ? 'Try a different search or clear the filters.' : heading.empty}</p>
                  {filtered ? (
                    <button type="button" onClick={clearFilters} className="btn-primary mt-5 px-6 py-2.5">
                      Clear all filters
                    </button>
                  ) : tab === 'enrollments' || tab === 'ongoing' ? (
                    <button type="button" onClick={() => setTab('upcoming')} className="btn-primary mt-5 px-6 py-2.5">
                      Browse upcoming classes
                    </button>
                  ) : null}
                </div>
              ) : isDesktop ? (
                <ul className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {results.map((c, i) => (
                    <li key={c.id}>
                      <LiveClassCard
                        item={c}
                        index={i}
                        saved={state.isSaved(c.id)}
                        enrolled={state.isEnrolled(c.id)}
                        onToggleSaved={state.toggleSaved}
                        onJoin={state.join}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-4 grid gap-3.5 md:grid-cols-2">
                  {results.map((c, i) => (
                    <li key={c.id}>
                      <LiveClassRow item={c} index={i} enrolled={state.isEnrolled(c.id)} onJoin={state.join} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* desktop sidebar */}
          <aside className="hidden space-y-5 lg:block" aria-label="Live class extras">
            <LiveCalendar classes={LIVE_CLASSES} month={month} selected={filters.date} onMonthChange={setMonth} onSelect={onCalendarSelect} />
            <WhyJoin />
            <FeaturedTeacher onViewProfile={viewTeacher} />
            <RecordingsCta onBrowse={browseRecordings} />
          </aside>
        </div>
      </section>

      <LiveToast message={message} />
      <LiveBottomNav />
    </div>
  );
}