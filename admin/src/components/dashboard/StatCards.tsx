import { ArrowUp } from 'lucide-react';
import { STATS } from '@/data/dashboard';

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {STATS.map(({ label, value, delta, icon: Icon }, i) => (
        <article
          key={label}
          style={{ animationDelay: `${i * 60}ms` }}
          className={`animate-rise-in flex items-center gap-3.5 rounded-2xl border border-line bg-card/90 p-4 shadow-card transition duration-300 hover:-translate-y-0.5 ${
            i === STATS.length - 1 ? 'min-[480px]:col-span-2 md:col-span-1' : ''
          }`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-peach text-[#C77A2B]">
            <Icon size={24} strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="whitespace-nowrap font-display text-[1.4rem] font-bold leading-none text-veda-bark">{value}</p>
            <p className="mt-1.5 text-[0.82rem] leading-tight text-veda-bark/90">{label}</p>
            <p className="mt-1 flex items-center gap-1 text-[0.82rem] font-bold text-ok">
              <ArrowUp size={14} strokeWidth={2.6} aria-hidden />
              {delta}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}