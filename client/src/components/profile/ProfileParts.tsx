import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { CARD } from '@/components/dashboard/DashParts';

export { CARD };

/** round gold icon used in front of every row / card title */
export function IconBadge({ Icon, className = 'h-12 w-12', size = 22 }: { Icon: LucideIcon; className?: string; size?: number }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gold-pale/60 text-saffron ${className}`}>
      <Icon size={size} strokeWidth={1.5} aria-hidden />
    </span>
  );
}

/** white-ish card with an icon + serif title, as in the design */
export function SectionCard({
  Icon,
  title,
  subtitle,
  children,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`${CARD} overflow-hidden`} aria-label={title}>
      <header className="flex items-center gap-3 border-b border-gold/20 px-5 py-3.5 sm:px-6">
        <IconBadge Icon={Icon} className="h-11 w-11" size={21} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[1.45rem] font-bold leading-tight text-veda-bark">{title}</h2>
          {subtitle && <p className="text-[0.82rem] text-veda-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export const inputCls =
  'w-full rounded-xl border border-gold/35 bg-white/70 px-3.5 py-2.5 text-[0.92rem] text-veda-bark placeholder:text-veda-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 disabled:opacity-60';

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.85rem] font-semibold text-veda-bark">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[0.76rem] text-veda-muted">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.85rem] text-red-800">
      {message}
    </p>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${
        checked ? 'border-veda-brown bg-veda-brown' : 'border-gold/40 bg-gold-pale/70'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-[1.3rem] w-[1.3rem] rounded-full bg-ivory shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

/** one row of toggles (notification + privacy pages) */
export function ToggleRow({
  label,
  text,
  checked,
  onChange,
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[0.95rem] font-semibold text-veda-bark">{label}</p>
        <p className="text-[0.82rem] text-veda-muted">{text}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </li>
  );
}

export function ProfileSkeleton() {
  const block = 'animate-pulse rounded-2xl bg-gold-pale/50';
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading your profile">
      <div className={`${block} h-44`} />
      <div className={`${block} h-80`} />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${block} h-28`} />
        ))}
      </div>
    </div>
  );
}