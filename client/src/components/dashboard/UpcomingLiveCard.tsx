import { ArrowRight, CalendarPlus, Clock, Radio, UsersRound, Video, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DASH_PLATFORM_LABEL } from '@/constants/dashboard';
import { getLiveTeacher } from '@/constants/liveClasses';
import type { LiveClass } from '@/constants/liveClasses';
import type { LiveClassState } from '@/hooks/useLiveClassState';
import { downloadIcs, formatClassDate, formatRegistered, formatTimeRange, monthShort, weekdayShort } from '@/utils/liveClassFormat';
import { BookmarkButton, CARD, CourseImage, SectionTitle, Teacher } from './DashParts';

interface Props {
  cls: LiveClass | null;
  liveState: LiveClassState;
  notify: (message: string) => void;
  /** desktop: compact card in the right column · mobile: wider card with extra details */
  variant?: 'desktop' | 'mobile';
}

/** "Upcoming Live Class": the class running now, or else the next one to start (decided from the real clock). */
export default function UpcomingLiveCard({ cls, liveState, notify, variant = 'desktop' }: Props) {
  const mobile = variant === 'mobile';
  const title = mobile ? 'Upcoming Live Classes' : 'Upcoming Live Class';

  if (!cls) {
    return (
      <section className={`${CARD} p-5`} aria-labelledby="upcoming-live">
        <SectionTitle id="upcoming-live" title={title} to="/live-classes" size={mobile ? 'lg' : 'md'} />
        <p className="mt-3 text-sm text-veda-muted">No live classes are scheduled right now. New sessions appear here as soon as they are announced.</p>
        <Link to="/live-classes" className="btn-primary mt-4">
          Browse live classes
        </Link>
      </section>
    );
  }

  const teacher = getLiveTeacher(cls.teacherId);
  const live = cls.status === 'ongoing';
  const registered = liveState.isEnrolled(cls.id);
  const joinLabel = live || !registered ? (mobile ? 'Join Live Class' : 'Join Now') : 'View Class';

  const addToCalendar = () => {
    downloadIcs(cls, teacher.name);
    notify('Calendar file downloaded');
  };

  return (
    <section className={`${CARD} ${mobile ? 'p-3' : 'p-4'}`} aria-labelledby="upcoming-live">
      <div className={mobile ? 'px-1 pb-3 pt-1' : 'pb-3'}>
        <SectionTitle id="upcoming-live" title={title} to="/live-classes" size={mobile ? 'lg' : 'md'} />
      </div>

      <div className="relative overflow-hidden rounded-xl">
        <CourseImage src={cls.image} category={cls.category} className={`w-full ${mobile ? 'h-[170px] sm:h-[220px]' : 'h-[125px]'}`} />
        <div className="absolute left-2.5 top-2.5 rounded-lg bg-ivory/95 px-2.5 py-1 text-center leading-tight shadow">
          <span className="block text-[0.68rem] font-medium tracking-wide text-veda-bark">{monthShort(cls.date)}</span>
          <span className="block font-display text-[1.35rem] font-bold text-veda-bark">{Number(cls.date.slice(8))}</span>
          <span className="block text-[0.68rem] text-veda-text">{weekdayShort(cls.date)}</span>
        </div>
        <div className="absolute right-2.5 top-2.5 flex items-center gap-2">
          {mobile && (
            <span className={`rounded-full px-3 py-1 text-[0.75rem] font-medium ${live ? 'bg-red-600 text-white' : 'bg-[#f6dfa6] text-veda-bark'}`}>{live ? '● Live Now' : 'Live Class'}</span>
          )}
          <BookmarkButton saved={liveState.isSaved(cls.id)} onToggle={() => liveState.toggleSaved(cls)} label={cls.title} />
        </div>
        {!mobile && live && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[0.7rem] font-semibold text-white">
            <Radio size={12} aria-hidden /> Live now
          </span>
        )}
      </div>

      <div className={mobile ? 'px-1 pt-3' : 'pt-3'}>
        <h3 className={`font-display font-bold leading-snug text-veda-bark ${mobile ? 'text-[1.1rem]' : 'text-[1.02rem]'}`}>
          <Link to={`/live-classes/${cls.id}`} className="hover:text-saffron">
            {cls.title}
          </Link>
        </h3>
        <Teacher name={teacher.name} size="md" className="mt-2" />

        {mobile ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[0.82rem] text-veda-text">
            <div className="flex items-center gap-2">
              <CalendarDays size={17} className="shrink-0 text-veda-brown" aria-hidden />
              <dt className="sr-only">Date</dt>
              <dd>{formatClassDate(cls.date)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={17} className="shrink-0 text-veda-brown" aria-hidden />
              <dt className="sr-only">Time</dt>
              <dd>{formatTimeRange(cls, true)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Video size={17} className="shrink-0 text-veda-brown" aria-hidden />
              <dt className="sr-only">Platform</dt>
              <dd>{DASH_PLATFORM_LABEL[cls.platform] ?? cls.platform}</dd>
            </div>
            <div className="flex items-center gap-2">
              <UsersRound size={17} className="shrink-0 text-veda-brown" aria-hidden />
              <dt className="sr-only">Registered</dt>
              <dd>{formatRegistered(cls.registered)} Registered</dd>
            </div>
          </dl>
        ) : (
          <div className="mt-2.5 flex items-center justify-between gap-2 text-[0.8rem] text-veda-text">
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="shrink-0 text-veda-brown" aria-hidden /> {formatTimeRange(cls, true)}
            </span>
            <span className="flex items-center gap-1.5 text-veda-muted">
              <Video size={15} className="shrink-0" aria-hidden /> {DASH_PLATFORM_LABEL[cls.platform] ?? cls.platform}
            </span>
          </div>
        )}

        <div className={`mt-4 grid gap-2.5 ${mobile ? 'grid-cols-[1fr_1fr]' : 'grid-cols-[0.8fr_1.2fr]'}`}>
          <button
            type="button"
            onClick={() => liveState.join(cls)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-veda-brown px-3 text-[0.88rem] font-medium text-ivory shadow-soft transition-colors hover:bg-veda-bark"
          >
            {joinLabel} <ArrowRight size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={addToCalendar}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gold/40 bg-white/40 px-3 text-[0.85rem] font-medium text-veda-bark transition-colors hover:bg-gold-pale/60"
          >
            <CalendarPlus size={17} aria-hidden /> Add to Calendar
          </button>
        </div>
      </div>
    </section>
  );
}