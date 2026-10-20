import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

interface FooterColumnProps {
  title: string;
  children: ReactNode;
}

/** Collapsible accordion on mobile (keeps the footer short), always open on tablet/desktop. */
export default function FooterColumn({ title, children }: FooterColumnProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-ivory/10 md:border-0">
      <h3 className="md:mb-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold text-ivory md:pointer-events-none md:cursor-default md:py-0"
        >
          {title}
          <ChevronDown
            size={16}
            className={`text-gold-soft transition-transform md:hidden ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </h3>
      <div id={panelId} className={`${open ? 'block' : 'hidden'} pb-2.5 md:block md:pb-0`}>
        {children}
      </div>
    </div>
  );
}