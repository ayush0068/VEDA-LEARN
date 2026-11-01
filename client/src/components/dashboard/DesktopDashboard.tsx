import { ChartColumn, BookOpen, PlayCircle, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/course/Avatar';
import {
  DASH_AVATAR_SRC,
  DASH_HEADER_ART_SRC,
  DASH_QUOTE_EN,
  DASH_QUOTE_SANSKRIT,
} from '@/constants/dashboard';
import type { StudentDashboard } from '@/types/dashboard';
import { buildCalendarEvents, nextLiveClass, pickContinue } from '@/utils/dashboardLogic';
import { LotusMark } from '@/components/common/Logo';
import { ContinueLearningCard, EnrolledCourseCard, NoCoursesCard, RecommendedCard } from './DashboardCourseCards';
import type { SavedApi } from './DashboardCourseCards';
import { CARD, IconCircle, SectionTitle } from './DashParts';
import type { DashboardContextValue } from './dashboardContext';
import LearningCalendar from './LearningCalendar';
import RecentActivity from './RecentActivity';
import UpcomingLiveCard from './UpcomingLiveCard';

interface Props {
  data: StudentDashboard;
  userName: string;
  ctx: Pick<DashboardContextValue, 'now' | 'liveState' | 'notify'>;
  saved: SavedApi;
}

function HeaderArt() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] xl:block" aria-hidden>
      {failed ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(233,168,103,0.45),transparent_60%)]" />
      ) : (
        <img
          src={DASH_HEADER_ART_SRC}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-[80%_20%] [mask-image:linear-gradient(to_right,transparent,#000_45%)]"
        />
      )}
    </div>
  );
}

function StatCard({ Icon, value, label, linkLabel, to }: { Icon: LucideIcon; value: string; label: string; linkLabel: string; to: string }) {
  return (
    <div className={`${CARD} flex items-center gap-3 p-3.5`}>
      <IconCircle className="h-[58px] w-[58px]">
        <Icon size={28} strokeWidth={1.3} aria-hidden />
      </IconCircle>
      <div className="min-w-0">
        <p className="font-display text-[1.7rem] font-bold leading-none text-veda-bark">{value}</p>
        <p className="mt-1 text-[0.82rem] leading-tight text-veda-text">{label}</p>
        <Link to={to} className="mt-1.5 inline-flex items-center gap-1 text-[0.78rem] font-medium text-veda-brown hover:text-saffron">
          {linkLabel} →
        </Link>
      </div>
    </div>
  );
}

/** Desktop composition (screens ≥ 1024px): welcome row, stats, continue learning, courses, recommended + right column */
export default function DesktopDashboard({ data, userName, ctx, saved }: Props) {
  const { now, liveState, notify } = ctx;
  const [showAll, setShowAll] = useState(false);

  const continueCourse = useMemo(() => pickContinue(data.enrollments), [data.enrollments]);
  const next = useMemo(() => nextLiveClass(now), [now]);
  const events = useMemo(() => buildCalendarEvents(now, data.assignments, data.activity), [now, data.assignments, data.activity]);
  const shown = showAll ? data.enrollments : data.enrollments.slice(0, 3);
  const { stats } = data;

  return (
    <div>
      {/* welcome row */}
      <section className="relative overflow-hidden px-6 pb-3 pt-5" aria-labelledby="welcome-heading">
        <HeaderArt />
        <div className="relative flex items-center gap-5">
          <div className="relative">
            <Avatar name={userName} src={DASH_AVATAR_SRC} className="h-[84px] w-[84px] ring-4 ring-gold-pale" textClass="text-2xl" />
            <span className="absolute -bottom-0.5 -left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-ivory shadow ring-1 ring-gold/40" aria-hidden>
              <LotusMark className="h-4 w-4" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[1.15rem] text-veda-bark">Welcome Back,</p>
            <h1 id="welcome-heading" className="flex items-center gap-2 font-display text-[1.95rem] font-bold leading-tight text-veda-bark">
              <span className="truncate">{userName}</span>
              <LotusMark className="h-7 w-7 shrink-0" />
            </h1>
            <p className="mt-1 text-[0.95rem] text-veda-text">Continue your learning journey. Knowledge today, a better tomorrow.</p>
          </div>
          <div className="hidden shrink-0 pr-[19%] text-center xl:block">
            <p className="font-deva text-[1.35rem] font-semibold text-veda-brown">“{DASH_QUOTE_SANSKRIT}”</p>
            <p className="mt-0.5 text-[0.78rem] text-veda-text">{DASH_QUOTE_EN}</p>
            <div className="mx-auto mt-1.5 flex items-center justify-center gap-1.5 text-saffron" aria-hidden>
              <span className="h-px w-10 bg-saffron/60" />
              <span className="h-1 w-1 rotate-45 bg-saffron" />
              <span className="h-px w-10 bg-saffron/60" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 px-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* main column */}
        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-4 2xl:grid-cols-4">
            <StatCard Icon={BookOpen} value={String(stats.enrolled)} label="Enrolled Courses" linkLabel="View Courses" to="/dashboard/my-courses" />
            <StatCard Icon={PlayCircle} value={String(stats.liveClassesAttended)} label="Live Classes Attended" linkLabel="View History" to="/live-classes" />
            <StatCard Icon={Trophy} value={String(stats.certificates)} label="Certificates Earned" linkLabel="View Certificates" to="/dashboard/certificates" />
            <StatCard
              Icon={ChartColumn}
              value={`${stats.overallPercent}%`}
              label="Overall Progress"
              linkLabel="Keep Learning"
              to={continueCourse ? `/courses/${continueCourse.slug}` : '/courses'}
            />
          </div>

          <section aria-labelledby="continue-heading" className="space-y-3">
            <SectionTitle id="continue-heading" title="Continue Learning" to="/dashboard/my-courses" label="View All Courses" />
            {continueCourse ? <ContinueLearningCard e={continueCourse} saved={saved} /> : <NoCoursesCard />}
          </section>

          {data.enrollments.length > 0 && (
            <section aria-labelledby="enrolled-heading" className="space-y-3">
              <SectionTitle
                id="enrolled-heading"
                title="My Enrolled Courses"
                onClick={data.enrollments.length > 3 ? () => setShowAll((v) => !v) : undefined}
                to={data.enrollments.length > 3 ? undefined : '/dashboard/my-courses'}
                label={showAll ? 'Show Less' : 'View All'}
              />
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {shown.map((e) => (
                  <EnrolledCourseCard key={e.slug} e={e} saved={saved} />
                ))}
              </div>
            </section>
          )}

          {data.recommended.length > 0 && (
            <section aria-labelledby="recommended-heading" className="space-y-3">
              <SectionTitle id="recommended-heading" title="Recommended for You" to="/courses" />
              <div className="grid grid-cols-2 gap-4 2xl:grid-cols-4">
                {data.recommended.map((c) => (
                  <RecommendedCard key={c.slug} c={c} saved={saved} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* right column */}
        <aside className="min-w-0 space-y-5" aria-label="Schedule and activity">
          <UpcomingLiveCard cls={next} liveState={liveState} notify={notify} />
          <LearningCalendar now={now} events={events} />
          <RecentActivity activity={data.activity} now={now} />
        </aside>
      </div>
    </div>
  );
}