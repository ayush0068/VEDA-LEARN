import { Infinity as InfinityIcon, ShieldCheck, Zap } from 'lucide-react';

const POINTS = [
  { icon: ShieldCheck, title: 'Secure Payment', sub: '100% Safe & Secure' },
  { icon: Zap, title: 'Instant Access', sub: 'Start Learning Now' },
  { icon: InfinityIcon, title: 'Lifetime Access', sub: 'Learn at Your Pace' },
];

export default function TrustStrip() {
  return (
    <ul className="grid grid-cols-3 gap-2 rounded-2xl border border-gold/20 bg-cream/70 p-3 shadow-soft sm:p-4">
      {POINTS.map(({ icon: Icon, title, sub }) => (
        <li key={title} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2.5 sm:text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 text-saffron">
            <Icon size={18} strokeWidth={1.5} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-[0.72rem] font-semibold text-veda-bark sm:text-[0.76rem]">{title}</span>
            <span className="mt-0.5 block text-[0.64rem] text-veda-muted sm:text-[0.66rem]">{sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}