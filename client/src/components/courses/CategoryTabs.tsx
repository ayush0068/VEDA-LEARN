import { BookOpen, Flower2, House, LayoutGrid, Orbit, ScrollText, Sprout } from 'lucide-react';
import type { ReactNode } from 'react';
import { COURSE_TABS } from '@/constants/courseCatalog';

/** Simple seated-meditation figure (lucide has no yoga icon) */
function MeditationIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 8v4.5M8 10.5c2.5 1.6 5.5 1.6 8 0M5 19c2.2-.2 4-1.6 7-1.6s4.8 1.4 7 1.6M7.5 17.5c-.4-2.2 1-3.6 4.5-3.6s4.9 1.4 4.5 3.6" />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  all: <LayoutGrid size={24} strokeWidth={1.5} aria-hidden />,
  'sanatan-lifestyle': <Flower2 size={24} strokeWidth={1.4} aria-hidden />,
  'vedic-astrology': <Orbit size={24} strokeWidth={1.4} aria-hidden />,
  'vastu-shastra': <House size={24} strokeWidth={1.4} aria-hidden />,
  'bhagavad-gita': <BookOpen size={24} strokeWidth={1.4} aria-hidden />,
  'mantra-science-healing': (
    <span className="font-deva text-[1.5rem] font-bold leading-none" aria-hidden>
      ॐ
    </span>
  ),
  'yoga-meditation': <MeditationIcon />,
  'ancient-texts': <ScrollText size={24} strokeWidth={1.4} aria-hidden />,
  'lifestyle-wellbeing': <Sprout size={24} strokeWidth={1.4} aria-hidden />,
};

interface CategoryTabsProps {
  active: string;
  onChange: (slug: string) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <nav
      aria-label="Course categories"
      className="relative z-10 -mt-8 rounded-t-[1.75rem] border-t border-gold/20 bg-ivory shadow-[0_-14px_30px_-20px_rgba(90,45,15,0.45)]"
    >
      <ul className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-3 py-3.5 [scrollbar-width:none] sm:px-6 lg:justify-between lg:gap-0 lg:px-8 lg:py-4 [&::-webkit-scrollbar]:hidden">
        {COURSE_TABS.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <li key={tab.slug} className="shrink-0">
              <button
                type="button"
                onClick={() => onChange(tab.slug)}
                aria-pressed={isActive}
                className={`flex h-full w-[78px] flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center transition-colors lg:w-[108px] lg:rounded-2xl lg:py-2 ${
                  isActive
                    ? 'bg-veda-brown text-ivory lg:bg-gold-pale/60 lg:text-veda-bark'
                    : 'text-veda-text hover:bg-gold-pale/40 hover:text-veda-bark'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:h-14 lg:w-14 ${
                    isActive
                      ? 'text-ivory lg:bg-veda-brown'
                      : 'border border-gold/25 bg-gold-pale/50 text-veda-brown'
                  }`}
                >
                  {ICONS[tab.slug]}
                </span>
                <span className="text-[0.68rem] leading-tight lg:text-[0.8rem]">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}