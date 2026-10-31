import { useEffect, useState } from 'react';

export interface TabSection {
  id: string;
  label: string;
}

/** Sticky Overview | Curriculum | Instructor | Reviews | FAQs bar. Click scrolls to the section; scrolling highlights it. */
export default function CourseTabs({ sections }: { sections: TabSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const go = (id: string) => {
    setActive(id);
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Course sections"
      className="sticky top-20 z-30 -mx-4 border-b border-gold/25 bg-ivory/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-t-2xl lg:px-4"
    >
      <ul className="flex gap-1 overflow-x-auto sm:gap-4 lg:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map(({ id, label }) => {
          const on = id === active;
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={on ? 'true' : undefined}
                className={`relative px-3 py-3.5 text-[0.95rem] transition-colors sm:px-4 ${
                  on ? 'font-semibold text-veda-bark' : 'text-veda-text hover:text-saffron'
                }`}
              >
                {label}
                <span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-saffron transition-opacity ${on ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}