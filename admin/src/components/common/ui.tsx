import { Loader2 } from 'lucide-react';
import { initials } from '@/utils/format';

/** shared class strings so every button / field in the admin looks the same */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7A3E14] to-[#9A5521] px-4 py-2.5 text-[0.85rem] font-semibold text-ivory shadow-md shadow-veda-brown/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white/70 px-4 py-2.5 text-[0.85rem] font-semibold text-veda-bark transition hover:border-gold/60 hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-[0.85rem] font-semibold text-white shadow-md shadow-red-900/20 transition hover:bg-red-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export const inputClass =
  'w-full rounded-xl border border-line bg-white/80 px-3.5 py-2.5 text-base text-veda-bark placeholder:text-veda-muted/80 transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 disabled:bg-cream disabled:text-veda-muted sm:text-[0.9rem]';

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

const TONES = ['#C9803A', '#A0522D', '#B8862B', '#8C5A3C', '#C26A1B', '#9A6B2F'];

/** Round avatar: the uploaded photo when there is one, otherwise coloured initials. */
export function Avatar({ name, src, className = 'h-9 w-9 text-[0.72rem]' }: { name: string; src?: string; className?: string }) {
  if (src) return <img src={src} alt="" className={`shrink-0 rounded-full object-cover ring-2 ring-white/80 ${className}`} />;

  const tone = TONES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white/80 ${className}`} style={{ background: tone }} aria-hidden>
      {initials(name)}
    </span>
  );
}