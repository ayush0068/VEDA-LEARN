import type { ReactNode } from 'react';

/** Label + control + small help text, used by every field of the course form. */
export default function Field({ label, hint, optional, children, className = '' }: { label: string; hint?: string; optional?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
        {label} {optional && <span className="font-normal text-veda-muted">(optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[0.74rem] leading-snug text-veda-muted">{hint}</span>}
    </label>
  );
}