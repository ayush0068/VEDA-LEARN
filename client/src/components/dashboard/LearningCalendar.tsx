import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { CalendarEvent, CalendarKind } from '@/utils/dashboardLogic';
import { istParts } from '@/utils/dashboardLogic';
import { formatShortDate, monthGrid, monthTitle, shiftMonth } from '@/utils/liveClassFormat';
import { CARD } from './DashParts';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DOT: Record<CalendarKind, string> = {
  live: 'bg-veda-brown',
  assignment: 'bg-orange-500',
  completed: 'bg-emerald-600',
};
const LEGEND: { kind: CalendarKind; label: string }[] = [
  { kind: 'live', label: 'Live Class' },
  { kind: 'assignment', label: 'Assignment Due' },
  { kind: 'completed', label: 'Completed' },
];

/** Month calendar built from the real date: today is filled, dots mark live classes / assignments / completed work. */
export default function LearningCalendar({ now, events }: { now: number; events: Map<string, CalendarEvent[]> }) {
  const today = istParts(now);
  const [month, setMonth] = useState(today.month);
  const [selected, setSelected] = useState('');

  // the page stayed open past midnight into a new month -> follow it if the student was on the old "current" month
  const [lastToday, setLastToday] = useState(today.month);
  useEffect(() => {
    if (today.month !== lastToday) {
      setMonth((m) => (m === lastToday ? today.month : m));
      setLastToday(today.month);
    }
  }, [today.month, lastToday]);

  const cells = monthGrid(month);
  const chosen = selected && selected.startsWith(month) ? (events.get(selected) ?? []) : [];

  return (
    <section className={`${CARD} p-4`} aria-labelledby="learning-calendar">
      <h2 id="learning-calendar" className="font-display text-[1.2rem] font-bold text-veda-bark">
        Learning Calendar
      </h2>

      <div className="mt-3 flex items-center justify-between rounded-full bg-gold-pale/40 px-1.5 py-1">
        <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-full text-veda-brown hover:bg-white/70">
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button type="button" onClick={() => setMonth(today.month)} title="Back to this month" className="text-[0.92rem] font-medium text-veda-bark">
          {monthTitle(month)}
        </button>
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-full text-veda-brown hover:bg-white/70">
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[0.7rem] text-veda-muted">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[0.78rem]">
        {cells.map((day, i) => {
          if (day == null) return <span key={`e${i}`} />;
          const iso = `${month}-${String(day).padStart(2, '0')}`;
          const list = events.get(iso) ?? [];
          const kinds = Array.from(new Set(list.map((e) => e.kind)));
          const isToday = iso === today.iso;
          const isSelected = selected === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={!list.length}
              onClick={() => setSelected(isSelected ? '' : iso)}
              aria-pressed={isSelected}
              aria-label={`${formatShortDate(iso)}${isToday ? ' (today)' : ''}${list.length ? `, ${list.length} item${list.length > 1 ? 's' : ''}` : ''}`}
              aria-current={isToday ? 'date' : undefined}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-default ${
                isToday ? 'bg-veda-brown font-semibold text-ivory' : 'text-veda-text enabled:hover:bg-gold-pale/60'
              } ${isSelected ? 'ring-2 ring-gold ring-offset-1 ring-offset-ivory' : ''}`}
            >
              {day}
              {kinds.length > 0 && (
                <span className="absolute -right-0.5 top-0 flex gap-px" aria-hidden>
                  {kinds.slice(0, 3).map((k) => (
                    <span key={k} className={`h-[5px] w-[5px] rounded-full ${DOT[k]} ${isToday ? 'ring-1 ring-ivory' : ''}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.7rem] text-veda-text">
        {LEGEND.map((l) => (
          <li key={l.kind} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${DOT[l.kind]}`} aria-hidden /> {l.label}
          </li>
        ))}
      </ul>

      {chosen.length > 0 && (
        <ul className="animate-fade-in mt-3 space-y-1.5 border-t border-gold/20 pt-3">
          {chosen.map((e, i) => {
            const body = (
              <>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.kind]}`} aria-hidden />
                <span className="min-w-0 flex-1 text-[0.8rem] leading-snug text-veda-bark">
                  {e.title}
                  {e.time && <span className="block text-[0.72rem] text-veda-muted">{e.time}</span>}
                </span>
              </>
            );
            return (
              <li key={`${e.title}-${i}`}>
                {e.to ? (
                  <Link to={e.to} className="flex gap-2 rounded-lg px-1.5 py-1 hover:bg-gold-pale/50">
                    {body}
                  </Link>
                ) : (
                  <div className="flex gap-2 px-1.5 py-1">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}