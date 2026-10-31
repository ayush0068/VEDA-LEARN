import { BookOpen, Flower2, House, Orbit, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Mandala from '@/components/common/Mandala';

const FALLBACK_BG = [
  'from-veda-bark to-veda-brown',
  'from-gold-soft to-saffron',
  'from-veda-brown to-saffron',
  'from-saffron to-gold',
];

const CATEGORY_ICON: Record<string, LucideIcon> = {
  'yoga-meditation': Flower2,
  'vedic-astrology': Orbit,
  'bhagavad-gita': BookOpen,
  'mantra-science-healing': Sparkles,
  'vastu-shastra': House,
};

/** Class photo that falls back to a warm gradient + mandala when the image file is missing. */
export function LiveThumb({ src, category, seed = 0, className = '' }: { src: string; category: string; seed?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICON[category] ?? Sparkles;

  return failed ? (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${FALLBACK_BG[seed % FALLBACK_BG.length]} ${className}`}>
      <Mandala className="absolute inset-0 m-auto h-[130%] w-[130%] text-ivory/20" />
      <Icon size={40} strokeWidth={1.3} className="relative text-ivory" />
    </div>
  ) : (
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}

/** Round teacher photo with an initials fallback. */
export function TeacherAvatar({ src, name, className = 'h-6 w-6', text = 'text-[0.65rem]' }: { src: string; name: string; className?: string; text?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .replace(/^(Acharya|Dr\.|Smt\.)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return failed ? (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gold-pale font-semibold text-veda-brown ${text} ${className}`} aria-hidden>
      {initials}
    </span>
  ) : (
    <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={`shrink-0 rounded-full object-cover ${className}`} />
  );
}

/** Small toast (bottom centre). `show(message)` from useLiveToast triggers it. */
export function useLiveToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number>();

  const show = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 3200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { message, show };
}

export function LiveToast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8">
      {message && (
        <p className="animate-fade-in max-w-md rounded-xl bg-veda-bark px-4 py-3 text-center text-sm text-ivory shadow-lg">{message}</p>
      )}
    </div>
  );
}