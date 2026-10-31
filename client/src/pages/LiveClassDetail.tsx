import { ArrowLeft, ArrowRight, Bookmark, CalendarDays, CalendarPlus, Check, CircleCheck, Clock, Play, Share2, Star, UsersRound, Video, BadgeCheck, PlayCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { DateBadge, liveActionLabel, registeredCount } from '@/components/live/LiveClassCard';
import { LiveThumb, LiveToast, TeacherAvatar, useLiveToast } from '@/components/live/LiveCommon';
import { LIVE_CLASSES, getLiveClass, getLiveTeacher } from '@/constants/liveClasses';
import type { LiveClass } from '@/constants/liveClasses';
import { useLiveClassState } from '@/hooks/useLiveClassState';
import { downloadIcs, formatClassDate, formatRegistered, formatTimeRange } from '@/utils/liveClassFormat';

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-[0.88rem] text-veda-text">
      <span className="text-veda-muted">{icon}</span>
      {children}
    </li>
  );
}

function NotFound() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-display text-4xl font-semibold text-veda-bark">Class not found</h1>
      <p className="mt-3 text-veda-muted">This live class does not exist or has been removed.</p>
      <Link to="/live-classes" className="btn-primary mt-6">
        Back to Live Classes
      </Link>
    </section>
  );
}

export default function LiveClassDetail() {
  const { id } = useParams();
  const item = getLiveClass(id);
  const { message, show } = useLiveToast();
  const state = useLiveClassState(show);

  if (!item) return <NotFound />;
  return <Detail item={item} state={state} message={message} notify={show} />;
}

function Detail({ item, state, message, notify }: { item: LiveClass; state: ReturnType<typeof useLiveClassState>; message: string | null; notify: (m: string) => void }) {
  const teacher = getLiveTeacher(item.teacherId);
  const enrolled = state.isEnrolled(item.id);
  const saved = state.isSaved(item.id);
  const action = liveActionLabel(item, enrolled);
  const isLive = item.status === 'ongoing';
  const isDone = item.status === 'completed';

  const related = [...LIVE_CLASSES.filter((c) => c.id !== item.id && c.status === 'upcoming')]
    .sort((a, b) => Number(b.category === item.category) - Number(a.category === item.category))
    .slice(0, 4);

  const onMain = () => {
    if (isDone) {
      if (item.recordingUrl) window.open(item.recordingUrl, '_blank', 'noopener,noreferrer');
      else notify('The recording is being processed. Please check back soon.');
      return;
    }
    if (isLive) {
      state.join(item);
      return;
    }
    if (!enrolled) {
      state.enroll(item.id);
      notify(`You're registered for “${item.title}”. We'll see you there!`);
    } else {
      notify('You are all set! The class link opens when the session starts.');
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: `Join "${item.title}" live on VedaLearn`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('Class link copied');
    } catch {
      /* share sheet dismissed */
    }
  };

  const pill = isLive ? 'LIVE NOW' : isDone ? 'Recording' : 'Live Class';

  return (
    <div className="pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        {/* top bar: back / share */}
        <div className="flex items-center justify-between">
          <Link to="/live-classes" className="inline-flex h-10 items-center gap-2 rounded-lg pr-3 text-sm font-medium text-veda-brown hover:text-saffron">
            <ArrowLeft size={18} aria-hidden /> Live Classes
          </Link>
          <div className="flex items-center gap-1.5 lg:hidden">
            <button type="button" onClick={share} aria-label="Share class" className="flex h-10 w-10 items-center justify-center rounded-full text-veda-brown hover:bg-gold-pale/60">
              <Share2 size={19} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => state.toggleSaved(item)}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from saved' : 'Save class'}
              className="flex h-10 w-10 items-center justify-center rounded-full text-veda-brown hover:bg-gold-pale/60"
            >
              <Bookmark size={19} className={saved ? 'fill-gold text-gold' : ''} aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-2 grid gap-x-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* hero + title + tags */}
          <header className="lg:col-start-1 lg:row-start-1">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
              <LiveThumb src={item.image} category={item.category} className="h-full w-full" />
              <span className={`absolute left-3 top-3 rounded-lg px-3.5 py-1.5 text-[0.78rem] font-medium shadow-sm ${isLive ? 'bg-red-600 text-white' : 'bg-ivory/95 text-veda-bark'}`}>
                {pill}
              </span>
              <button
                type="button"
                onClick={onMain}
                aria-label={isDone ? 'Watch recording' : isLive ? 'Join live now' : 'Register for this class'}
                className="absolute left-1/2 top-1/2 flex h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-veda-bark/55 text-ivory ring-2 ring-ivory/80 backdrop-blur-sm transition hover:scale-105 hover:bg-veda-bark/75"
              >
                <Play size={28} className="ml-1 fill-ivory" aria-hidden />
              </button>
              <DateBadge date={item.date} className="absolute bottom-3 left-3 !px-3 !py-2" />
            </div>

            <h1 className="mt-4 font-display text-[1.7rem] font-bold leading-tight text-veda-bark sm:text-[2rem] lg:text-[2.3rem]">{item.title}</h1>
            <p className="mt-1.5 flex items-center gap-2 text-[0.98rem] text-veda-text">
              <TeacherAvatar src={teacher.avatar} name={teacher.name} className="h-7 w-7" />
              {teacher.name}
            </p>

            <ul className="mt-3.5 flex flex-wrap gap-2">
              {[...item.tags, item.level].map((t) => (
                <li key={t} className="rounded-full bg-gold-pale/70 px-3.5 py-1.5 text-[0.78rem] text-saffron">
                  {t}
                </li>
              ))}
            </ul>
          </header>

          {/* info + actions (right column, sticky on desktop) */}
          <div className="mt-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-gold/25 bg-ivory p-4 shadow-soft sm:p-5">
                <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-1">
                  <Meta icon={<CalendarDays size={18} aria-hidden />}>{formatClassDate(item.date)}</Meta>
                  <Meta icon={<Clock size={18} aria-hidden />}>{formatTimeRange(item, true)}</Meta>
                  <Meta icon={<Video size={18} aria-hidden />}>Live on {item.platform}</Meta>
                  <Meta icon={<UsersRound size={18} aria-hidden />}>{formatRegistered(registeredCount(item, enrolled))} Registered</Meta>
                </ul>

                <button
                  type="button"
                  onClick={onMain}
                  className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[0.95rem] font-medium transition-colors ${
                    action.done ? 'border border-veda-brown/60 bg-gold-pale/50 text-veda-brown' : 'bg-veda-brown text-ivory hover:bg-veda-bark'
                  }`}
                >
                  {action.done ? <Check size={17} aria-hidden /> : isDone ? <PlayCircle size={17} aria-hidden /> : null}
                  {isDone ? 'Watch Recording' : action.text}
                  {!action.done && !isDone && <ArrowRight size={17} aria-hidden />}
                </button>
                {enrolled && !isDone && (
                  <button
                    type="button"
                    onClick={() => {
                      state.unenroll(item.id);
                      notify('Registration cancelled');
                    }}
                    className="mt-2 w-full text-center text-[0.8rem] text-veda-muted underline-offset-2 hover:text-saffron hover:underline"
                  >
                    Cancel registration
                  </button>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      downloadIcs(item, teacher.name);
                      notify('Calendar file downloaded');
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-veda-brown/50 text-[0.85rem] font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory"
                  >
                    <CalendarPlus size={16} aria-hidden /> Add to Calendar
                  </button>
                  <button
                    type="button"
                    onClick={share}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-veda-brown/50 text-[0.85rem] font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory"
                  >
                    <Share2 size={16} aria-hidden /> Share Class
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* body */}
          <div className="lg:col-start-1 lg:row-start-2">
            <section className="mt-7" aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-[1.45rem] font-semibold text-veda-bark">
                About This Session
              </h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-veda-text">{item.about}</p>
            </section>

            <section className="mt-6 rounded-2xl border border-gold/20 bg-cream/60 p-4 sm:p-5" aria-labelledby="learn-heading">
              <h2 id="learn-heading" className="font-display text-[1.3rem] font-semibold text-veda-bark">
                What You'll Learn
              </h2>
              <ul className="mt-3 space-y-2.5">
                {item.learn.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[0.92rem] text-veda-text">
                    <CircleCheck size={18} className="mt-0.5 shrink-0 fill-saffron text-ivory" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-7" aria-labelledby="teacher-heading">
              <h2 id="teacher-heading" className="font-display text-[1.45rem] font-semibold text-veda-bark">
                Your Teacher
              </h2>
              <div className="mt-3 rounded-2xl border border-gold/25 bg-ivory p-4 shadow-soft">
                <div className="flex items-center gap-4">
                  <TeacherAvatar src={teacher.avatar} name={teacher.name} className="h-[88px] w-[88px] border border-gold/40" text="text-2xl" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-display text-[1.15rem] font-semibold leading-snug text-veda-bark">
                      {teacher.name}
                      <BadgeCheck size={18} className="shrink-0 fill-gold text-ivory" aria-label="Verified teacher" />
                    </p>
                    <p className="mt-0.5 text-[0.88rem] text-veda-text">{teacher.role}</p>
                    <p className="text-[0.88rem] text-veda-muted">{teacher.years}</p>
                  </div>
                </div>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-veda-muted">{teacher.bio}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-gold/20 pt-4 text-center">
                  <div>
                    <UsersRound size={20} className="mx-auto text-saffron" aria-hidden />
                    <dt className="sr-only">Students</dt>
                    <dd className="mt-1 font-semibold text-veda-bark">{teacher.students}</dd>
                    <p className="text-[0.76rem] text-veda-muted" aria-hidden>Students</p>
                  </div>
                  <div>
                    <PlayCircle size={20} className="mx-auto text-saffron" aria-hidden />
                    <dt className="sr-only">Classes</dt>
                    <dd className="mt-1 font-semibold text-veda-bark">{teacher.classes}</dd>
                    <p className="text-[0.76rem] text-veda-muted" aria-hidden>Classes</p>
                  </div>
                  <div>
                    <Star size={20} className="mx-auto fill-saffron text-saffron" aria-hidden />
                    <dt className="sr-only">Rating</dt>
                    <dd className="mt-1 font-semibold text-veda-bark">{teacher.rating.toFixed(1)}</dd>
                    <p className="text-[0.76rem] text-veda-muted" aria-hidden>Rating</p>
                  </div>
                </dl>
              </div>
            </section>
          </div>
        </div>

        {/* related */}
        {related.length > 0 && (
          <section className="mt-9" aria-labelledby="related-heading">
            <div className="flex items-end justify-between">
              <h2 id="related-heading" className="font-display text-[1.45rem] font-semibold text-veda-bark">
                Related Live Classes
              </h2>
              <Link to="/live-classes" className="inline-flex items-center gap-1 pb-0.5 text-sm font-medium text-veda-brown hover:text-saffron">
                View All <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
            <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              {related.map((c, i) => (
                <li key={c.id} className="w-[44%] min-w-[168px] max-w-[230px] shrink-0 snap-start">
                  <Link to={`/live-classes/${c.id}`} className="group block overflow-hidden rounded-xl border border-gold/25 bg-ivory shadow-soft">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <LiveThumb src={c.image} category={c.category} seed={i} className="h-full w-full transition duration-500 group-hover:scale-105" />
                      <span
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-veda-bark/60 text-ivory backdrop-blur-sm"
                        aria-hidden
                      >
                        <Bookmark size={14} className={state.isSaved(c.id) ? 'fill-gold-soft text-gold-soft' : ''} />
                      </span>
                    </div>
                    <p className="line-clamp-2 px-2.5 py-2 font-display text-[0.9rem] font-semibold leading-snug text-veda-bark">{c.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <LiveToast message={message} />
    </div>
  );
}