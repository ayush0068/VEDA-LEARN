import { BookOpen, HandHeart, Leaf, MonitorPlay, Scale, Sun, Target, UsersRound, Flower2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import Mandala from '@/components/common/Mandala';
import { LotusMark } from '@/components/common/Logo';
import { ABOUT_DIFFERENT, ABOUT_LANDSCAPE_SRC, ABOUT_PURPOSE, ABOUT_QUOTE_SRC, ABOUT_VALUES } from '@/constants/about';
import { Ornament } from './AboutHero';

function Heading({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 sm:gap-4 ${className}`}>
      <span className="h-px w-8 bg-saffron/50 sm:w-24" aria-hidden />
      <Ornament />
      <h2 id={id} className="text-center font-display text-[1.65rem] font-bold text-veda-bark sm:text-[2rem]">
        {children}
      </h2>
      <Ornament />
      <span className="h-px w-8 bg-saffron/50 sm:w-24" aria-hidden />
    </div>
  );
}

/** faint corner mandalas (desktop only) */
function CornerMandalas() {
  return (
    <>
      <Mandala className="pointer-events-none absolute -left-24 top-2 hidden h-64 w-64 animate-spin-slow text-gold/25 [stroke-width:0.4] motion-reduce:animate-none lg:block" />
      <Mandala className="pointer-events-none absolute -right-24 top-2 hidden h-64 w-64 animate-spin-slow text-gold/25 [stroke-width:0.4] motion-reduce:animate-none lg:block" />
    </>
  );
}

export function Purpose() {
  const icons: Record<string, ReactNode> = {
    mission: <Target size={44} strokeWidth={1.4} className="text-saffron" aria-hidden />,
    vision: <LotusMark className="h-12 w-12" />,
  };

  return (
    <section className="relative overflow-hidden py-10 lg:py-12" aria-labelledby="purpose-heading">
      <CornerMandalas />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Heading id="purpose-heading">Our Purpose</Heading>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-6">
          {ABOUT_PURPOSE.map((p) => (
            <article key={p.key} className="flex items-center gap-4 rounded-2xl border border-gold/30 bg-ivory/80 p-5 shadow-soft sm:gap-5">
              <span className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full bg-gold-pale/70">{icons[p.key]}</span>
              <div>
                <h3 className="font-display text-[1.3rem] font-bold text-veda-bark">{p.title}</h3>
                <p className="mt-1 text-[0.92rem] leading-relaxed text-veda-text">{p.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const DIFF_ICONS: Record<string, ReactNode> = {
  knowledge: <BookOpen size={40} strokeWidth={1.3} aria-hidden />,
  flexible: <MonitorPlay size={40} strokeWidth={1.3} aria-hidden />,
  practical: <Flower2 size={40} strokeWidth={1.3} aria-hidden />,
  community: <UsersRound size={40} strokeWidth={1.3} aria-hidden />,
};

export function Different() {
  return (
    <section className="py-8 lg:py-10" aria-labelledby="different-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Heading id="different-heading">What Makes VedaLearn Different?</Heading>
        <ul className="mt-9 grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
          {ABOUT_DIFFERENT.map((d, i) => (
            <li key={d.key} className={`flex flex-col items-center px-3 text-center sm:px-5 ${i > 0 ? 'lg:border-l lg:border-gold/30' : ''}`}>
              {/* scalloped badge */}
              <span className="relative flex h-[100px] w-[100px] items-center justify-center text-saffron">
                <span className="absolute inset-[10px] rotate-0 rounded-[1.6rem] bg-gold-pale/60" />
                <span className="absolute inset-[10px] rotate-45 rounded-[1.6rem] bg-gold-pale/60" />
                <span className="relative">{DIFF_ICONS[d.key]}</span>
              </span>
              <h3 className="mt-3 font-display text-[1.12rem] font-bold text-veda-bark">{d.title}</h3>
              <p className="mt-1 max-w-[13rem] text-[0.88rem] leading-snug text-veda-text">{d.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function QuoteBanner() {
  const [failed, setFailed] = useState(false);
  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8" aria-label="Quote">
      <div className="relative isolate mx-auto flex min-h-[170px] max-w-[1180px] items-center justify-end overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-r from-[#e8b56d] via-[#f6d9a4] to-[#fbe6bd] shadow-soft sm:min-h-[200px]">
        {!failed && (
          <img src={ABOUT_QUOTE_SRC} alt="" aria-hidden loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 -z-10 h-full w-full object-cover object-left" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#fbe6bd]/80 via-[#fbe6bd]/40 to-transparent sm:via-transparent" aria-hidden />
        <blockquote className="w-full px-5 py-7 text-center sm:w-[62%] sm:px-8">
          <p className="flex items-center justify-center gap-3 font-deva text-[1.7rem] font-semibold leading-snug text-veda-brown sm:text-[2.4rem]">
            <span className="hidden h-px w-8 bg-saffron/60 md:block" aria-hidden />
            सा विद्या या विमुक्तये ॥
            <span className="hidden h-px w-8 bg-saffron/60 md:block" aria-hidden />
          </p>
          <p className="mt-2 font-display text-[1.05rem] italic text-veda-brown sm:text-[1.3rem]">“True knowledge is that which liberates.”</p>
        </blockquote>
      </div>
    </section>
  );
}

const VALUE_ICONS: Record<string, ReactNode> = {
  tradition: <Leaf size={38} strokeWidth={1.3} aria-hidden />,
  integrity: <Scale size={38} strokeWidth={1.3} aria-hidden />,
  service: <HandHeart size={38} strokeWidth={1.3} aria-hidden />,
  growth: <Sun size={38} strokeWidth={1.3} aria-hidden />,
};

export function Values() {
  return (
    <section className="relative overflow-hidden pb-10 pt-8 lg:pb-12" aria-labelledby="values-heading">
      <CornerMandalas />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Heading id="values-heading">Our Values</Heading>
        <ul className="mt-8 grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
          {ABOUT_VALUES.map((v, i) => (
            <li key={v.key} className={`flex flex-col items-center px-3 text-center sm:px-6 ${i > 0 ? 'lg:border-l lg:border-gold/30' : ''}`}>
              <span className="text-saffron">{VALUE_ICONS[v.key]}</span>
              <h3 className="mt-2.5 font-display text-[1.15rem] font-bold text-veda-bark">{v.title}</h3>
              <p className="mt-1 max-w-[12rem] text-[0.86rem] leading-snug text-veda-text">{v.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Landscape strip at the bottom: its top edge fades into the page so it blends with the section above. */
const FADE_MASK = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 14%, #000 48%)';

export function Landscape() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="pointer-events-none relative -mt-6 h-36 overflow-hidden sm:-mt-10 sm:h-48 lg:-mt-14 lg:h-60" aria-hidden>
      <div className="absolute inset-0" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }}>
        {failed ? (
          <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d="M0 110 C200 60 360 120 560 90 C760 60 940 110 1200 70 V160 H0Z" fill="#f3d9a6" opacity=".7" />
            <path d="M0 135 C260 100 420 150 640 125 C860 100 1000 140 1200 118 V160 H0Z" fill="#e9bd78" opacity=".55" />
          </svg>
        ) : (
          <img src={ABOUT_LANDSCAPE_SRC} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover object-bottom" />
        )}
      </div>
    </div>
  );
}