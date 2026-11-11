import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** The soft cream card used for every dashboard block. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-card/90 shadow-card ${className}`}>{children}</section>
  );
}

/** Peach icon tile + serif title (+ optional action on the right). */
export function CardHeader({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-peach text-saffron">
          <Icon size={18} strokeWidth={1.8} aria-hidden />
        </span>
        <h2 className="min-w-0 truncate font-display text-[1.12rem] font-bold text-veda-bark">{title}</h2>
      </div>
      <div className="shrink-0">{action}</div>
    </header>
  );
}