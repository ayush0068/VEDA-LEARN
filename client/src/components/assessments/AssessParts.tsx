import { useEffect, useRef, useState } from 'react';
import './assess.css';

/** counts from 0 to `value` (instantly when the person prefers reduced motion) */
export function useCountUp(value: number, ms = 1100, delay = 150) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || value <= 0) {
      setN(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const t = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const p = Math.min(1, (now - start) / ms);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [value, ms, delay]);
  return n;
}

/** circular progress with a number in the middle; the ring fills and the number counts up */
export function ScoreRing({ percent, size = 120, stroke = 10, label, tone = 'stroke-saffron', suffix = '%', delay = 150 }: { percent: number; size?: number; stroke?: number; label?: string; tone?: string; suffix?: string; delay?: number }) {
  const shown = useCountUp(percent, 1100, delay);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'Score'} ${percent}${suffix}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-gold/20" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" className={`${tone} transition-[stroke-dashoffset] duration-[1100ms] ease-out`} strokeDasharray={c} strokeDashoffset={on ? c * (1 - Math.min(100, percent) / 100) : c} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold leading-none text-veda-bark" style={{ fontSize: size * 0.27 }}>
          {shown}
          <span style={{ fontSize: size * 0.15 }}>{suffix}</span>
        </span>
        {label && <span className="mt-1 text-[0.68rem] font-medium uppercase tracking-wide text-veda-muted">{label}</span>}
      </div>
    </div>
  );
}

/** a few seconds of falling gold / saffron pieces (canvas). Does nothing for reduced motion. */
export function Confetti({ run }: { run: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!run || !canvas || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = (canvas.width = window.innerWidth * dpr);
    const h = (canvas.height = window.innerHeight * dpr);
    const colors = ['#c58b2b', '#c26a1b', '#e3c285', '#5a2d0f', '#2e9b3e', '#f1dfb4'];
    const pieces = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.25,
      y: h * 0.32,
      vx: (Math.random() - 0.5) * 16 * dpr,
      vy: (-Math.random() * 13 - 4) * dpr,
      s: (Math.random() * 7 + 5) * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      pieces.forEach((p) => {
        p.vy += 0.38 * dpr;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - t / 3200);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (t < 3200) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[90] h-full w-full" />;
}

export const BG = 'min-h-dvh bg-gradient-to-br from-[#fff6e8] via-[#fdecd0] to-[#fbe2bb]';

export const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
};

export const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(s % 60).padStart(2, '0')}`;
};

const DATE = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
export const formatWhen = (iso: string | null) => (iso ? DATE.format(new Date(iso)) : 'No deadline');

/** "in 2 days", "3 hours left", "overdue by 1 day" */
export const dueIn = (iso: string | null, now = Date.now()) => {
  if (!iso) return { text: 'No deadline', tone: 'muted' as const };
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const text = mins < 60 ? `${Math.max(1, mins)} min` : mins < 60 * 24 ? `${Math.round(mins / 60)} hr` : `${Math.round(mins / 1440)} day${Math.round(mins / 1440) > 1 ? 's' : ''}`;
  if (diff < 0) return { text: `Overdue by ${text}`, tone: 'late' as const };
  return { text: `${text} left`, tone: diff < 86400000 ? ('soon' as const) : ('ok' as const) };
};