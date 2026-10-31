import { BookOpen, CalendarDays, PlayCircle, Radio, Video } from 'lucide-react';
import type { ReactNode } from 'react';

export type LiveTab = 'upcoming' | 'ongoing' | 'enrollments' | 'recordings';

const TABS: { id: LiveTab; desktop: string; mobile: string; icon: ReactNode; mobileIcon: ReactNode }[] = [
  { id: 'upcoming', desktop: 'Upcoming Classes', mobile: 'Upcoming', icon: <CalendarDays size={18} aria-hidden />, mobileIcon: <CalendarDays size={22} strokeWidth={1.5} aria-hidden /> },
  { id: 'ongoing', desktop: 'Ongoing Now', mobile: 'Ongoing', icon: <Radio size={18} aria-hidden />, mobileIcon: <PlayCircle size={22} strokeWidth={1.5} aria-hidden /> },
  { id: 'enrollments', desktop: 'My Enrollments', mobile: 'My Classes', icon: <BookOpen size={18} aria-hidden />, mobileIcon: <BookOpen size={22} strokeWidth={1.5} aria-hidden /> },
  { id: 'recordings', desktop: 'Class Recordings', mobile: 'Recordings', icon: <PlayCircle size={18} aria-hidden />, mobileIcon: <Video size={22} strokeWidth={1.5} aria-hidden /> },
];

interface LiveTabsProps {
  active: LiveTab;
  onChange: (tab: LiveTab) => void;
}

export default function LiveTabs({ active, onChange }: LiveTabsProps) {
  return (
    <nav aria-label="Live class views">
      {/* desktop: segmented bar */}
      <ul className="hidden grid-cols-4 gap-1 rounded-xl border border-gold/25 bg-cream/70 p-1.5 lg:grid">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onChange(t.id)}
                aria-pressed={on}
                className={`flex h-11 w-full items-center justify-center gap-2.5 rounded-lg text-sm font-medium transition-colors ${
                  on ? 'bg-veda-brown text-ivory shadow-soft' : 'text-veda-text hover:bg-gold-pale/60 hover:text-veda-bark'
                }`}
              >
                {t.icon}
                {t.desktop}
              </button>
            </li>
          );
        })}
      </ul>

      {/* mobile: four icon tiles */}
      <ul className="grid grid-cols-4 gap-2.5 lg:hidden">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onChange(t.id)}
                aria-pressed={on}
                className={`flex h-[86px] w-full flex-col items-center justify-center gap-2 rounded-2xl border text-[0.78rem] font-medium transition-colors ${
                  on ? 'border-veda-brown bg-veda-brown text-ivory shadow-soft' : 'border-gold/20 bg-cream/80 text-veda-text'
                }`}
              >
                {t.mobileIcon}
                {t.mobile}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}