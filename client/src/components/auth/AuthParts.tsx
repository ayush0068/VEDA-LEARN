import { ArrowRight, CircleAlert, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-[2rem] font-bold leading-tight text-veda-bark sm:text-[2.2rem]">{title}</h1>
      <p className="mx-auto mt-2 max-w-[22rem] text-[0.95rem] leading-snug text-veda-muted">{subtitle}</p>
    </div>
  );
}

/** Red banner for errors that come back from the server (wrong password, email already used...). */
export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300/70 bg-red-50/80 px-3.5 py-2.5 text-[0.85rem] text-red-800">
      <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

/** Dark brown pill button with an arrow ("Sign In →"). */
export function AuthSubmit({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-[3.1rem] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#6a3715] to-[#4a230b] text-[0.98rem] font-semibold text-ivory shadow-[0_12px_24px_-10px_rgba(62,31,11,0.75)] transition hover:from-[#5a2d0f] hover:to-[#3e1f0b] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
      {children}
      {!loading && <ArrowRight size={17} aria-hidden />}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-4 text-[0.78rem] tracking-wider text-veda-muted" aria-hidden>
      <span className="h-px flex-1 bg-gold/30" />
      OR
      <span className="h-px flex-1 bg-gold/30" />
    </div>
  );
}