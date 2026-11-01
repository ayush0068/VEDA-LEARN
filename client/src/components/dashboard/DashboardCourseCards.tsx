import { ArrowRight, BookOpen, Clock, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardEnrollment, DashboardRecommended } from '@/types/dashboard';
import { BookmarkButton, CARD, CourseImage, ProgressBar, StatusPill, Teacher } from './DashParts';

export interface SavedApi {
  isSaved: (slug: string) => boolean;
  toggleSaved: (slug: string) => void;
}

const lessonsText = (e: DashboardEnrollment) => `${e.completedLessons} of ${e.totalLessons} lessons${e.status === 'in-progress' ? ' completed' : ''}`;
const courseUrl = (slug: string) => `/courses/${slug}`;

/** The primary button of a course: "Continue →" (filled) or "Start Learning →" (outline) */
export function CourseAction({ e, className = '' }: { e: DashboardEnrollment; className?: string }) {
  const start = e.status === 'not-started';
  const label = e.status === 'completed' ? 'Review Course' : start ? 'Start Learning' : 'Continue';
  return (
    <Link
      to={courseUrl(e.slug)}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg text-[0.88rem] font-medium transition-colors ${
        start ? 'border border-gold/45 bg-white/60 text-veda-bark hover:bg-gold-pale/60' : 'bg-veda-brown text-ivory shadow-soft hover:bg-veda-bark'
      } ${className}`}
    >
      {label} <ArrowRight size={15} aria-hidden />
    </Link>
  );
}

/** "Continue Learning" hero card (desktop: image left, details right · phone: stacked) */
export function ContinueLearningCard({ e, saved, mobile = false }: { e: DashboardEnrollment; saved: SavedApi; mobile?: boolean }) {
  const module = e.currentModule || 'Start with the first lesson';

  const image = (
    <div className={`relative overflow-hidden ${mobile ? 'rounded-xl' : 'rounded-xl lg:rounded-r-none'}`}>
      <CourseImage src={e.image} category={e.category} className={`w-full ${mobile ? 'h-[170px] sm:h-[230px]' : 'h-[160px] lg:h-full lg:min-h-[152px]'}`} />
      {mobile ? (
        <>
          <StatusPill status={e.status} className="absolute left-3 top-3" />
          <div className="absolute right-3 top-3">
            <BookmarkButton saved={saved.isSaved(e.slug)} onToggle={() => saved.toggleSaved(e.slug)} label={e.title} />
          </div>
        </>
      ) : (
        <StatusPill status={e.status} className="absolute right-3 top-3" />
      )}
      <Link to={courseUrl(e.slug)} aria-label={`Play ${e.title}`} className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ivory/90 bg-veda-bark/45 text-ivory backdrop-blur-[1px] transition-transform hover:scale-105">
          <Play size={22} className="ml-0.5 fill-current" aria-hidden />
        </span>
      </Link>
    </div>
  );

  const body = (
    <div className={mobile ? 'px-1 pb-1 pt-3' : 'flex flex-col justify-between gap-3 p-4 pl-5'}>
      <div className="min-w-0">
        <h3 className={`font-display font-bold leading-snug text-veda-bark ${mobile ? 'text-[1.2rem]' : 'text-[1.3rem]'}`}>{e.title}</h3>
        <Teacher name={e.instructor} size="md" className="mt-2" />
        <p className="mt-3 flex items-center gap-2 text-[0.88rem] text-veda-text">
          <Clock size={17} className="shrink-0 text-veda-brown" aria-hidden /> <span className="min-w-0">{module}</span>
        </p>
      </div>

      <div className={mobile ? 'mt-3' : 'grid items-end gap-4 lg:grid-cols-[1fr_auto]'}>
        <div>
          <div className="flex items-center gap-3">
            <ProgressBar percent={e.percent} className="flex-1" />
            <span className="w-10 text-right text-[0.82rem] font-medium text-veda-bark">{e.percent}%</span>
          </div>
          <p className="mt-1.5 text-[0.8rem] text-veda-muted">{lessonsText(e)}</p>
        </div>
        <Link
          to={courseUrl(e.slug)}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-veda-brown px-6 text-[0.95rem] font-medium text-ivory shadow-soft transition-colors hover:bg-veda-bark ${mobile ? 'mt-3 w-full' : ''}`}
        >
          {e.status === 'not-started' ? 'Start Learning' : 'Continue Learning'} <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );

  return (
    <div className={`${CARD} ${mobile ? 'p-3' : 'overflow-hidden lg:grid lg:grid-cols-[minmax(250px,0.9fr)_1.4fr]'}`}>
      {image}
      {body}
    </div>
  );
}

/** Course card used in the 3-column "My Enrolled Courses" grid */
export function EnrolledCourseCard({ e, saved }: { e: DashboardEnrollment; saved: SavedApi }) {
  return (
    <article className={`${CARD} flex flex-col p-2.5`}>
      <div className="relative overflow-hidden rounded-xl">
        <CourseImage src={e.image} category={e.category} className="h-[104px] w-full" />
        <StatusPill status={e.status} className="absolute left-2.5 top-2.5" />
        <div className="absolute right-2.5 top-2.5">
          <BookmarkButton saved={saved.isSaved(e.slug)} onToggle={() => saved.toggleSaved(e.slug)} label={e.title} />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <h3 className="font-display text-[1.05rem] font-bold leading-snug text-veda-bark">
          <Link to={courseUrl(e.slug)} className="hover:text-saffron">
            {e.title}
          </Link>
        </h3>
        <Teacher name={e.instructor} className="mt-1.5" />
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar percent={e.percent} className="flex-1" />
          <span className="w-9 text-right text-[0.8rem] font-medium text-veda-bark">{e.percent}%</span>
        </div>
        <p className="mt-1 text-[0.78rem] text-veda-muted">{lessonsText(e)}</p>
        <CourseAction e={e} className="mt-3 w-full" />
      </div>
    </article>
  );
}

/** Phone list row: photo left, details right */
export function CourseRow({ e, saved }: { e: DashboardEnrollment; saved: SavedApi }) {
  return (
    <article className={`${CARD} grid grid-cols-[132px_1fr] gap-3 p-2.5 sm:grid-cols-[180px_1fr]`}>
      <div className="relative overflow-hidden rounded-xl">
        <CourseImage src={e.image} category={e.category} className="h-full min-h-[112px] w-full" />
      </div>
      <div className="min-w-0 py-0.5 pr-0.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-display text-[1.02rem] font-bold leading-snug text-veda-bark">
            <Link to={courseUrl(e.slug)}>{e.title}</Link>
          </h3>
          <BookmarkButton variant="plain" saved={saved.isSaved(e.slug)} onToggle={() => saved.toggleSaved(e.slug)} label={e.title} />
        </div>
        <Teacher name={e.instructor} className="mt-1" />
        <div className="mt-2.5 flex items-center gap-2.5">
          <ProgressBar percent={e.percent} className="flex-1" />
          <span className="w-9 text-right text-[0.78rem] font-medium text-veda-bark">{e.percent}%</span>
        </div>
        <p className="mt-1 text-[0.75rem] text-veda-muted">{lessonsText(e)}</p>
        <CourseAction e={e} className="mt-2.5 w-full" />
      </div>
    </article>
  );
}

/** Small card of "Recommended for You" */
export function RecommendedCard({ c, saved }: { c: DashboardRecommended; saved: SavedApi }) {
  return (
    <article className={`${CARD} overflow-hidden`}>
      <div className="relative">
        <CourseImage src={c.image} category={c.category} className="h-[78px] w-full sm:h-[84px]" />
        <div className="absolute right-2 top-2">
          <BookmarkButton saved={saved.isSaved(c.slug)} onToggle={() => saved.toggleSaved(c.slug)} label={c.title} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-[0.9rem] font-semibold leading-snug text-veda-bark">
          <Link to={courseUrl(c.slug)} className="hover:text-saffron">
            {c.title}
          </Link>
        </h3>
        <Teacher name={c.instructor} className="mt-1.5" />
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.78rem] text-veda-text">
          <Star size={14} className="fill-gold text-gold" aria-hidden />
          <span className="font-medium">{c.rating.toFixed(1)}</span>
          <span className="text-veda-muted">({c.studentsCount.toLocaleString('en-IN')})</span>
        </p>
      </div>
    </article>
  );
}

/** When the student has not enrolled yet */
export function NoCoursesCard() {
  return (
    <div className={`${CARD} flex flex-col items-center gap-3 px-6 py-10 text-center`}>
      <BookOpen size={36} strokeWidth={1.3} className="text-saffron" aria-hidden />
      <h3 className="font-display text-xl font-bold text-veda-bark">Your learning journey starts here</h3>
      <p className="max-w-sm text-sm text-veda-muted">You haven’t enrolled in a course yet. Explore Vedic wisdom courses and your progress will appear on this page.</p>
      <Link to="/courses" className="btn-primary">
        Browse Courses
      </Link>
    </div>
  );
}