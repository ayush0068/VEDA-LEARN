import { CalendarClock, PlayCircle, Radio, RefreshCw, Users, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { getMyLiveClasses } from '@/services/liveClass.service';
import type { StudentLiveClass } from '@/types/liveClass';

type Tab = 'live' | 'upcoming' | 'recordings';

const WHEN = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
const TIME = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

function ClassCard({ c }: { c: StudentLiveClass }) {
  const live = c.status === 'live';
  const opens = new Date(c.joinOpensAt).getTime() <= Date.now();
  const recorded = c.status === 'ended';
  const full = c.studentsNow >= c.maxStudents;

  return (
    <article className={`${CARD} flex flex-col p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${live ? 'bg-red-100 text-red-700' : recorded ? 'bg-cream text-veda-muted' : 'bg-green-100 text-green-700'}`}>
          {live ? <Radio size={12} className="animate-pulse" aria-hidden /> : <CalendarClock size={12} aria-hidden />}
          {live ? 'Live now' : recorded ? 'Recording' : 'Upcoming'}
        </span>
        {!recorded && (
          <span className="inline-flex items-center gap-1 text-xs text-veda-muted">
            <Users size={13} aria-hidden /> {c.studentsNow}/{c.maxStudents}
          </span>
        )}
      </div>
      <h3 className="mt-2.5 font-display text-lg font-bold leading-snug text-veda-bark">{c.title}</h3>
      {c.courseTitle && <p className="mt-0.5 text-xs font-medium text-saffron">{c.courseTitle}</p>}
      <p className="mt-2 text-sm text-veda-text">
        {WHEN.format(new Date(c.startsAt))} – {TIME.format(new Date(c.endsAt))}
      </p>
      <p className="text-sm text-veda-muted">with {c.host.name}</p>
      {c.description && <p className="mt-2 line-clamp-2 text-[0.82rem] text-veda-muted">{c.description}</p>}

      <div className="mt-auto pt-4">
        {recorded ? (
          <a href={c.recordingUrl} target="_blank" rel="noreferrer" className="btn-primary w-full">
            <PlayCircle size={16} aria-hidden /> Watch recording
          </a>
        ) : live || opens ? (
          <Link to={`/live/${c.id}`} className={`btn-primary w-full ${full ? 'pointer-events-none opacity-60' : ''}`} aria-disabled={full}>
            <Video size={16} aria-hidden /> {full ? 'Class is full' : live ? 'Join live class' : 'Enter waiting room'}
          </Link>
        ) : (
          <button type="button" disabled className="btn-primary w-full cursor-not-allowed opacity-60">
            Opens 30 min before start
          </button>
        )}
      </div>
    </article>
  );
}

export default function DashboardLiveClasses() {
  const [items, setItems] = useState<StudentLiveClass[] | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('live');
  const [picked, setPicked] = useState(false);

  const load = useCallback(() => {
    getMyLiveClasses()
      .then((list) => {
        setItems(list);
        setError('');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load live classes'));
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(() => !document.hidden && load(), 15000);
    return () => window.clearInterval(t);
  }, [load]);

  const live = (items ?? []).filter((c) => c.status === 'live');
  const upcoming = (items ?? []).filter((c) => c.status === 'scheduled');
  const recordings = (items ?? []).filter((c) => c.status === 'ended').reverse();

  // open on the tab that has something, unless the student already chose one
  useEffect(() => {
    if (items && !picked) setTab(live.length ? 'live' : upcoming.length ? 'upcoming' : recordings.length ? 'recordings' : 'live');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const shown = tab === 'live' ? live : tab === 'upcoming' ? upcoming : recordings;
  const TABS: { key: Tab; label: string; n: number }[] = [
    { key: 'live', label: 'Live now', n: live.length },
    { key: 'upcoming', label: 'Upcoming', n: upcoming.length },
    { key: 'recordings', label: 'Recordings', n: recordings.length },
  ];

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-veda-bark">Live Classes</h1>
          <p className="text-sm text-veda-muted">Join your teacher live with video and audio, right here in the browser.</p>
        </div>
        <button type="button" onClick={load} className="btn-outline !px-3" aria-label="Refresh">
          <RefreshCw size={16} aria-hidden />
        </button>
      </div>

      <div role="tablist" className="mt-5 inline-flex gap-1 rounded-xl bg-cream p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setPicked(true);
            }}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === t.key ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted hover:text-veda-bark'}`}
          >
            {t.label} <span className="text-xs opacity-70">({t.n})</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {error && !items ? (
          <p className={`${CARD} p-8 text-center text-sm text-veda-muted`}>{error}</p>
        ) : !items ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-gold/10" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className={`${CARD} flex flex-col items-center p-10 text-center`}>
            <Video size={34} strokeWidth={1.3} className="text-saffron" aria-hidden />
            <p className="mt-3 font-display text-lg font-bold text-veda-bark">{tab === 'live' ? 'No class is live right now' : tab === 'upcoming' ? 'No upcoming classes' : 'No recordings yet'}</p>
            <p className="mt-1 max-w-sm text-sm text-veda-muted">Classes of your enrolled courses show up here as soon as your teacher schedules them.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <ClassCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}