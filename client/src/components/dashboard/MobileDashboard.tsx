import { BookOpen, ChartColumn, ChevronRight, Clock, FileText, Radio, Trophy, PlayCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/course/Avatar';
import { LotusMark } from '@/components/common/Logo';
import { DASH_AVATAR_SRC, DASH_HEADER_ART_SRC, DASH_QUOTE_BANNER_SRC, DASH_QUOTE_SANSKRIT } from '@/constants/dashboard';
import type { StudentDashboard } from '@/types/dashboard';
import { buildSchedule, nextLiveClass, pickContinue } from '@/utils/dashboardLogic';
import type { ScheduleItem } from '@/utils/dashboardLogic';
import { ContinueLearningCard, NoCoursesCard } from './DashboardCourseCards';
import type { SavedApi } from './DashboardCourseCards';
import { CARD, IconCircle, SectionTitle } from './DashParts';
import type { DashboardContextValue } from './dashboardContext';
import MyCoursesList from './MyCoursesList';
import UpcomingLiveCard from './UpcomingLiveCard';

interface Props {
  data: StudentDashboard;
  userName: string;
  ctx: Pick<DashboardContextValue, 'now' | 'liveState' | 'notify'>;
  saved: SavedApi;
}

function Welcome({ userName }: { userName: string }) {
  const [artFailed, setArtFailed] = useState(false);
  return (
    <section className="relative overflow-hidden px-4 pb-4 pt-5 sm:px-6" aria-labelledby="m-welcome">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-3/4" aria-hidden>
        {artFailed ? (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_20%,rgba(233,168,103,0.4),transparent_60%)]" />
        ) : (
          <img
            src={DASH_HEADER_ART_SRC}
            alt=""
            onError={() => setArtFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-[85%_20%] opacity-70 [mask-image:linear-gradient(to_right,transparent,#000_55%)]"
          />
        )}
      </div>
      <div className="relative flex items-center gap-3.5">
        <div className="relative shrink-0">
          <Avatar name={userName} src={DASH_AVATAR_SRC} className="h-[68px] w-[68px] ring-[3px] ring-gold-pale" textClass="text-xl" />
          <span className="absolute -bottom-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ivory shadow ring-1 ring-gold/40" aria-hidden>
            <LotusMark className="h-3 w-3" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[0.95rem] text-veda-bark">Welcome Back,</p>
          <h1 id="m-welcome" className="flex items-center gap-1.5 font-display text-[1.45rem] font-bold leading-tight text-veda-bark">
            <span className="truncate">{userName}</span>
            <LotusMark className="h-5 w-5 shrink-0" />
          </h1>
          <p className="text-[0.88rem] text-veda-text">Continue your learning journey.</p>
        </div>
      </div>
      <div className="relative mt-3 text-center sm:text-left">
        <p className="font-deva text-[1.2rem] font-semibold text-veda-brown sm:pl-24">“{DASH_QUOTE_SANSKRIT}”</p>
        <div className="mx-auto mt-0.5 flex items-center justify-center gap-1.5 text-saffron sm:ml-24 sm:justify-start" aria-hidden>
          <span className="h-px w-9 bg-saffron/60" />
          <span className="h-1 w-1 rotate-45 bg-saffron" />
          <span className="h-px w-9 bg-saffron/60" />
        </div>
      </div>
    </section>
  );
}

function Stat({ Icon, value, label, link, to }: { Icon: LucideIcon; value: string; label: string; link: string; to: string }) {
  return (
    <div className={`${CARD} flex items-center gap-2.5 p-3`}>
      <IconCircle className="h-[48px] w-[48px] sm:h-[56px] sm:w-[56px]">
        <Icon size={24} strokeWidth={1.3} aria-hidden />
      </IconCircle>
      <div className="min-w-0">
        <p className="font-display text-[1.55rem] font-bold leading-none text-veda-bark">{value}</p>
        <p className="mt-1 text-[0.78rem] leading-tight text-veda-text">{label}</p>
        <Link to={to} className="mt-1 inline-block text-[0.72rem] font-medium leading-tight text-veda-brown">
          {link} →
        </Link>
      </div>
    </div>
  );
}

const SCHEDULE_ICON: Record<ScheduleItem['kind'], LucideIcon> = { lesson: PlayCircle, live: Radio, assignment: FileText };

function TodaySchedule({ items }: { items: ScheduleItem[] }) {
  return (
    <section aria-labelledby="m-schedule" className="space-y-3">
      <SectionTitle id="m-schedule" title="Today’s Schedule" to="/live-classes" />
      <div className={`${CARD} px-3 py-2`}>
        {items.length ? (
          <ul className="relative">
            {/* vertical timeline */}
            <span className="absolute bottom-6 left-[calc(3.75rem+7px)] top-6 w-px bg-gold/50" aria-hidden />
            {items.map((it) => {
              const Icon = SCHEDULE_ICON[it.kind];
              return (
                <li key={it.key} className="border-b border-gold/15 last:border-b-0">
                  <Link to={it.to} className={`grid grid-cols-[3.75rem_14px_1fr_auto] items-center gap-x-3 py-3.5 ${it.done ? 'opacity-60' : ''}`}>
                    <span className="text-[0.82rem] font-medium leading-tight text-veda-bark">
                      <span className="block">{it.time.split(' ')[0]}</span>
                      <span className="block">{it.time.split(' ')[1]}</span>
                    </span>
                    <span className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-ivory bg-saffron ring-1 ring-saffron/60" aria-hidden />
                    <span className="flex min-w-0 items-center gap-3">
                      <IconCircle className="h-12 w-12">
                        <Icon size={24} strokeWidth={1.4} aria-hidden />
                      </IconCircle>
                      <span className="min-w-0">
                        <span className="block text-[0.95rem] font-medium text-veda-bark">
                          {it.title}
                          {it.done && <span className="ml-2 text-[0.7rem] font-normal text-veda-muted">(done)</span>}
                        </span>
                        <span className="block text-[0.8rem] leading-snug text-veda-text">{it.subtitle}</span>
                        {it.extra && <span className="block text-[0.78rem] leading-snug text-veda-muted">{it.extra}</span>}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-veda-text" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-2 py-5 text-center text-sm text-veda-muted">Nothing scheduled for today. Enjoy a calm day of learning!</p>
        )}
      </div>
    </section>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[150px] w-[150px] shrink-0" role="img" aria-label={`${percent}% overall progress`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1dfb4" strokeOpacity=".6" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#5a2d0f"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-[1.8rem] font-bold leading-none text-veda-bark">{percent}%</span>
        <span className="mt-1 text-[0.78rem] leading-tight text-veda-text">
          Overall
          <br />
          Progress
        </span>
      </div>
    </div>
  );
}

function LearningProgress({ data }: { data: StudentDashboard }) {
  const { stats } = data;
  const rows: { Icon: LucideIcon; value: string; label: string }[] = [
    { Icon: BookOpen, value: `${stats.inProgress} / ${stats.enrolled}`, label: 'Courses in Progress' },
    { Icon: PlayCircle, value: `${stats.lessonsDone} / ${stats.lessonsTotal}`, label: 'Lessons Completed' },
    { Icon: Clock, value: `${stats.liveClassesAttended} / ${stats.liveClassesRegistered}`, label: 'Live Classes Attended' },
    { Icon: Trophy, value: String(stats.certificates), label: 'Certificates Earned' },
  ];
  return (
    <section aria-labelledby="m-progress" className="space-y-3">
      <SectionTitle id="m-progress" title="Learning Progress" to="/dashboard/my-courses" />
      <div className={`${CARD} flex flex-col items-center gap-4 p-4 sm:flex-row sm:justify-around`}>
        <ProgressRing percent={stats.overallPercent} />
        <ul className="w-full max-w-[17rem] space-y-2.5">
          {rows.map(({ Icon, value, label }) => (
            <li key={label} className="flex items-center gap-3">
              <IconCircle className="h-10 w-10">
                <Icon size={20} strokeWidth={1.5} aria-hidden />
              </IconCircle>
              <div className="leading-tight">
                <p className="text-[0.95rem] font-medium text-veda-bark">{value}</p>
                <p className="text-[0.78rem] text-veda-text">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QuoteBanner() {
  const [failed, setFailed] = useState(false);
  return (
    <section aria-label="Inspiration" className="relative isolate flex min-h-[190px] items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#fbe7c4] via-[#f6cf93] to-[#e9a867]">
      {!failed && (
        <img src={DASH_QUOTE_BANNER_SRC} alt="" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 -z-10 h-full w-full object-cover object-right" />
      )}
      <div className="px-6 py-7 text-center sm:px-10">
        <p className="font-display text-[1.3rem] font-semibold leading-snug text-veda-bark sm:text-[1.6rem]">
          “A Step Towards
          <br />
          Higher Knowledge
          <br />A Better You.”
        </p>
        <div className="mx-auto mt-3 flex items-center justify-center gap-1.5 text-saffron" aria-hidden>
          <span className="h-px w-10 bg-saffron/70" />
          <span className="h-1 w-1 rotate-45 bg-saffron" />
          <span className="h-px w-10 bg-saffron/70" />
        </div>
      </div>
    </section>
  );
}

/** Phone / tablet composition (screens < 1024px) */
export default function MobileDashboard({ data, userName, ctx, saved }: Props) {
  const { now, liveState, notify } = ctx;
  const continueCourse = useMemo(() => pickContinue(data.enrollments), [data.enrollments]);
  const next = useMemo(() => nextLiveClass(now), [now]);
  const schedule = useMemo(() => buildSchedule(now, data.enrollments, data.assignments), [now, data.enrollments, data.assignments]);
  const { stats } = data;

  return (
    <div className="mx-auto max-w-3xl">
      <Welcome userName={userName} />

      <div className="space-y-6 px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          <Stat Icon={BookOpen} value={String(stats.enrolled)} label="Enrolled Courses" link="View All" to="/dashboard/my-courses" />
          <Stat Icon={PlayCircle} value={String(stats.liveClassesAttended)} label="Live Classes Attended" link="View History" to="/live-classes" />
          <Stat Icon={Trophy} value={String(stats.certificates)} label="Certificates Earned" link="View Certificates" to="/dashboard/certificates" />
          <Stat
            Icon={ChartColumn}
            value={`${stats.overallPercent}%`}
            label="Overall Progress"
            link="Keep Learning"
            to={continueCourse ? `/courses/${continueCourse.slug}` : '/courses'}
          />
        </div>

        <section aria-labelledby="m-continue" className="space-y-3">
          <SectionTitle id="m-continue" title="Continue Learning" to="/dashboard/my-courses" />
          {continueCourse ? <ContinueLearningCard e={continueCourse} saved={saved} mobile /> : <NoCoursesCard />}
        </section>

        {data.enrollments.length > 0 && (
          <section aria-labelledby="m-courses" className="space-y-3">
            <SectionTitle id="m-courses" title="My Courses" to="/dashboard/my-courses" />
            <MyCoursesList enrollments={data.enrollments} saved={saved} limit={3} />
          </section>
        )}

        <UpcomingLiveCard cls={next} liveState={liveState} notify={notify} variant="mobile" />
        <TodaySchedule items={schedule} />
        <LearningProgress data={data} />
        <QuoteBanner />
      </div>
    </div>
  );
}