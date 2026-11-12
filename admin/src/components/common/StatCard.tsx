import type { LucideIcon } from 'lucide-react';

/** Small number card; when `onClick` is given it works as a filter button. */
export default function StatCard({ icon: Icon, label, value, hint, selected, onClick }: { icon: LucideIcon; label: string; value: number | undefined; hint?: string; selected?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach text-[#C77A2B]">
        <Icon size={21} strokeWidth={1.6} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[1.45rem] font-bold leading-none text-veda-bark">{value === undefined ? '–' : new Intl.NumberFormat('en-IN').format(value)}</span>
        <span className="mt-1 block text-[0.8rem] leading-tight text-veda-bark/90">{label}</span>
        {hint && <span className="block text-[0.7rem] leading-tight text-veda-muted">{hint}</span>}
      </span>
    </>
  );

  const base = 'flex items-center gap-3 rounded-2xl border p-3.5 text-left shadow-card';
  if (!onClick) return <div className={`${base} border-line bg-card/90`}>{body}</div>;

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`${base} transition duration-200 hover:-translate-y-0.5 ${selected ? 'border-gold bg-white ring-2 ring-gold/30' : 'border-line bg-card/90'}`}>
      {body}
    </button>
  );
}