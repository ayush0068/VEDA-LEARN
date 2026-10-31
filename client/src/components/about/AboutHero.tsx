import { useState } from 'react';
import { ABOUT_BANNER_SRC } from '@/constants/about';

/** Ornament: line - small flower - line */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 text-saffron ${className}`} fill="currentColor" aria-hidden>
      <path d="M8 1.5l1.6 3.4 3.4-1.6-1.6 3.4L14.8 8l-3.4 1.6 1.6 3.4-3.4-1.6L8 14.5l-1.6-3.1L3 13l1.6-3.4L1.2 8l3.4-1.6L3 3l3.4 1.6z" opacity=".85" />
      <circle cx="8" cy="8" r="1.7" fill="#fffaf0" />
    </svg>
  );
}

/** Banner: photo from public/images/about-banner.png (falls back to a sunrise gradient). */
export default function AboutHero() {
  const [failed, setFailed] = useState(false);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#fbe7c4] via-[#f6cf93] to-[#e9a867]"
      aria-labelledby="about-heading"
    >
      {!failed && (
        <img
          src={ABOUT_BANNER_SRC}
          alt=""
          aria-hidden
          fetchPriority="high"
          onError={() => setFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[72%_center]"
        />
      )}
      {/* keeps the text readable on the photo */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fdf0d6]/95 via-[#fdf0d6]/70 to-transparent sm:via-[#fdf0d6]/45 lg:from-[#fdf0d6]/60 lg:via-[#fdf0d6]/20"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[320px] max-w-7xl items-center px-4 py-12 sm:min-h-[360px] sm:px-6 lg:min-h-[372px] lg:px-8">
        <div className="max-w-[34rem] animate-rise-in">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#f6d9a4]/90 px-3.5 py-1.5 text-[0.85rem] font-medium text-veda-bark">
            <Ornament className="h-3.5 w-3.5" /> About VedaLearn
          </span>
          <h1
            id="about-heading"
            className="mt-4 font-display text-[2.25rem] font-bold leading-[1.1] text-veda-bark sm:text-[2.8rem] lg:text-[3.15rem]"
          >
            Reviving Vedic Wisdom for Modern Life
          </h1>
          <p className="mt-4 max-w-[30rem] text-[0.95rem] leading-relaxed text-veda-bark/90 sm:text-base">
            VedaLearn is a digital learning platform dedicated to preserving, teaching, and spreading the timeless knowledge of
            Sanatan Dharma in a simple, practical, and accessible way.
          </p>
          <div className="mt-5 flex items-center gap-3 text-saffron" aria-hidden>
            <span className="h-px w-[72px] bg-saffron/60" />
            <span className="font-deva text-xl font-semibold">ॐ</span>
            <span className="h-px w-[72px] bg-saffron/60" />
          </div>
        </div>
      </div>
    </section>
  );
}