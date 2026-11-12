import { CalendarX } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/common/ui';
import type { ScheduleEntry, SlotKind } from '@/types/instructor';
import { DAY_LONG, DAY_ORDER, KIND_STYLE, formatRange, toMinutes } from '@/utils/schedule';

interface Props {
  entries: ScheduleEntry[] | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onOpen: (instructorId: string) => void;
}

/** Everyone's weekly sessions on one screen, day by day. */
export default function WeeklyTimetable({ entries, loading, error, onRetry, onOpen }: Props) {
  const [kind, setKind] = useState<SlotKind | 'all'>('all');
  const today = new Date().getDay();

  if (error && !entries) {
    return (
      <div className="flex flex-col items-center px-4 py-12 text-center">
        <CalendarX size={32} strokeWidth={1.4} className="text-saffron" aria-hidden />
        <p className="mt-3 font-display text-lg font-bold text-veda-bark">Could not load the schedule</p>
        <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{error}</p>
        <button type="button" onClick={onRetry} className="mt-4 rounded-xl border border-line bg-white/70 px-4 py-2.5 text-[0.85rem] font-semibold text-veda-bark hover:bg-white">
          Try again
        </button>
      </div>
    );
  }

  if (!entries) {
    return (
      <div className="grid gap-3 py-2 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading schedule">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-gold/10" />
        ))}
      </div>
    );
  }

  const shown = kind === 'all' ? entries : entries.filter((e) => e.kind === kind);

  return (
    <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(['all', 'live-class', 'office-hours', 'mentoring', 'review'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-full border px-3 py-1 text-[0.76rem] font-semibold transition ${kind === k ? 'border-saffron bg-saffron text-white' : 'border-line bg-white/70 text-veda-bark hover:border-gold/60'}`}
          >
            {k === 'all' ? 'All sessions' : KIND_STYLE[k].label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <CalendarX size={34} strokeWidth={1.3} className="text-saffron" aria-hidden />
          <p className="mt-3 font-display text-lg font-bold text-veda-bark">No sessions scheduled yet</p>
          <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">Open an instructor and use the Schedule tab to plan their week.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DAY_ORDER.map((day) => {
            const list = shown.filter((e) => e.day === day).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
            return (
              <section key={day} className={`rounded-2xl border p-3.5 ${day === today ? 'border-gold bg-white ring-2 ring-gold/25' : 'border-line bg-white/60'}`}>
                <h3 className="mb-2.5 flex items-center justify-between font-display text-[1.02rem] font-bold text-veda-bark">
                  {DAY_LONG[day]}
                  <span className="flex items-center gap-1.5 text-[0.72rem] font-sans font-medium text-veda-muted">
                    {day === today && <span className="rounded bg-saffron px-1.5 py-0.5 text-[0.66rem] font-bold text-white">Today</span>}
                    {list.length}
                  </span>
                </h3>

                {list.length === 0 ? (
                  <p className="py-3 text-center text-[0.78rem] text-veda-muted">Nothing scheduled</p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((e) => (
                      <li key={`${e.instructorId}-${e.id}`}>
                        <button type="button" onClick={() => onOpen(e.instructorId)} className="flex w-full items-start gap-2.5 rounded-xl border border-line bg-card/90 p-2.5 text-left transition hover:border-gold/60">
                          <span className="mt-0.5 h-9 w-1 shrink-0 rounded-full" style={{ background: KIND_STYLE[e.kind].bar }} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[0.8rem] font-bold text-veda-bark">{formatRange(e.start, e.end)}</span>
                            <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[0.64rem] font-semibold ${KIND_STYLE[e.kind].chip}`}>{KIND_STYLE[e.kind].label}</span>
                            {(e.title || e.courseTitle) && <span className="mt-0.5 block truncate text-[0.76rem] text-veda-text">{e.title || e.courseTitle}</span>}
                            <span className="mt-1 flex items-center gap-1.5 text-[0.74rem] text-veda-muted">
                              <Avatar name={e.name} src={e.avatar} className="h-5 w-5 text-[0.55rem]" />
                              <span className="truncate">{e.name}</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}