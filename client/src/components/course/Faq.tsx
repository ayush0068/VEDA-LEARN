import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { FaqItem } from '@/constants/courseDetails';

export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div>
      <h2 id="faqs-heading" className="font-display text-[1.5rem] font-semibold text-veda-bark sm:text-[1.7rem]">
        Frequently Asked Questions
      </h2>
      <ul className="mt-4 divide-y divide-gold/20 overflow-hidden rounded-xl border border-gold/20 bg-ivory shadow-sm">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-[0.92rem] font-medium text-veda-bark transition-colors hover:bg-cream"
                >
                  {item.q}
                  <ChevronDown size={18} className={`shrink-0 text-veda-text transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              </h3>
              <div id={`faq-panel-${i}`} hidden={!isOpen} className="bg-cream/60 px-4 pb-4 pt-1 text-[0.88rem] leading-relaxed text-veda-text">
                {item.a}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}