import { Headset, ShieldCheck, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { CONTACT_PROMISES } from '@/constants/contact';

const ICONS: Record<string, ReactNode> = {
  response: <Headset size={34} strokeWidth={1.4} aria-hidden />,
  privacy: <ShieldCheck size={34} strokeWidth={1.4} aria-hidden />,
  support: <UsersRound size={34} strokeWidth={1.4} aria-hidden />,
};

/** Three reassurance blocks in one rounded strip (stacked on mobile, divided columns on desktop). */
export default function ContactPromises() {
  return (
    <ul className="grid gap-5 rounded-2xl border border-gold/25 bg-cream/80 px-5 py-5 shadow-soft sm:px-7 md:grid-cols-3 md:gap-0 md:py-4">
      {CONTACT_PROMISES.map((p, i) => (
        <li key={p.key} className={`flex items-center gap-4 md:px-6 ${i > 0 ? 'md:border-l md:border-gold/30' : 'md:pl-0'}`}>
          <span className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gold-pale/70 text-saffron">{ICONS[p.key]}</span>
          <div>
            <h3 className="font-display text-[1.15rem] font-bold leading-tight text-veda-bark">{p.title}</h3>
            <p className="mt-0.5 max-w-[15rem] text-[0.9rem] leading-snug text-veda-text">{p.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}