import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import type { LiveClass } from '@/constants/liveClasses';
import { monthGrid, monthTitle, shiftMonth } from '@/utils/liveClassFormat';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface LiveCalendarProps {
  classes: LiveClass[];
  month: string; // YYYY-MM
  selected: string; // YYYY-MM-DD or ''
  onMonthChange: (month: string) => void;
  onSelect: (iso: string, classesOnDay: LiveClass[]) => void;
}

/** Month calendar: dark circle = upcoming / live class that day, light circle = recorded class, ring = chosen day. */
export default function LiveCalendar({ classes, month, selected, onMonthChange, onSelect }: LiveCalendarProps) {
  const byDate = useMemo(() => {
    const map = new Map<string, LiveClass[]>();
    classes.forEach((c) => map.set(c.date, [...(map.get(c.date) ?? []), c]));
    return map;
  }, [classes]);

  const cells = monthGrid(month);

  return (
    <section className="rounded-xl border border-gold/25 bg-ivory p-4 shadow-soft" aria-label="Class calendar">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-full text-veda-brown hover:bg-gold-pale/60">
          <ChevronLeft size={18} aria-hidden />
        </button>
        <h2 className="text-sm font-semibold text-veda-bark">{monthTitle(month)}</h2>
        <button type="button" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-full text-veda-brown hover:bg-gold-pale/60">
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[0.68rem] text-veda-muted">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[0.78rem]">
        {cells.map((day, i) => {
          if (day == null) return <span key={`e${i}`} />;
          const iso = `${month}-${String(day).padStart(2, '0')}`;
          const list = byDate.get(iso) ?? [];
          const live = list.some((c) => c.status !== 'completed');
          const isSelected = selected === iso;

          let cls = 'text-veda-text';
          if (list.length) cls = live ? 'bg-veda-brown font-semibold text-ivory' : 'bg-gold-pale font-medium text-veda-bark';
          if (isSelected) cls += ' ring-2 ring-gold ring-offset-2 ring-offset-ivory';

          return (
            <button
              key={iso}
              type="button"
              disabled={!list.length}
              onClick={() => onSelect(iso, list)}
              aria-pressed={isSelected}
              aria-label={list.length ? `${iso}: ${list.length} class${list.length > 1 ? 'es' : ''}` : iso}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors enabled:hover:opacity-85 disabled:cursor-default ${cls}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </section>
  );
}