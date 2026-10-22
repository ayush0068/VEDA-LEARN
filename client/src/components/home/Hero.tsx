import { ArrowRight, Award, GraduationCap, MonitorPlay, PlayCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import IntroModal from '@/components/common/IntroModal';
import { HERO_IMAGE_SRC } from '@/constants/assets';

const BENEFITS: { icon: LucideIcon; label: string }[] = [
  { icon: MonitorPlay, label: 'Live & Recorded Classes' },
  { icon: GraduationCap, label: 'Learn from Vedic Experts' },
  { icon: Award, label: 'Certificate on Completion' },
];

// Cream fade so text stays readable on top of the photo (left side solid, right side clear)
const FADE_DESKTOP =
  'linear-gradient(to right, rgba(255,250,240,0.96) 0%, rgba(255,250,240,0.85) 30%, rgba(255,250,240,0.35) 55%, rgba(255,250,240,0) 75%)';
const FADE_MOBILE = 'linear-gradient(to bottom, rgba(255,250,240,0.88) 0%, rgba(255,250,240,0.78) 100%)';

export default function Hero() {
  const [introOpen, setIntroOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-cream lg:min-h-[640px]"
      aria-labelledby="hero-heading"
    >
      {/* Full-width background image (public/images/hero-banner.jpg) */}
      {!imageFailed && (
        <img
          src={HERO_IMAGE_SRC}
          alt=""
          aria-hidden
          fetchPriority="high"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[75%_center] lg:object-center"
        />
      )}

      {/* Readability overlays */}
      <div className="absolute inset-0 -z-10 lg:hidden" style={{ backgroundImage: FADE_MOBILE }} aria-hidden />
      <div
        className="absolute inset-0 -z-10 hidden lg:block"
        style={{ backgroundImage: FADE_DESKTOP }}
        aria-hidden
      />

      {/* Text content on top of the image */}
      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-xl animate-rise-in">
          <p className="text-xs font-medium tracking-[0.22em] text-veda-muted">
            LEARN · PRACTICE · LIVE VEDIC WISDOM
          </p>

          <h1
            id="hero-heading"
            className="mt-5 font-display text-[2.5rem] font-semibold leading-[1.12] text-veda-bark sm:text-5xl lg:text-[3.4rem]"
          >
            Timeless Knowledge for a Meaningful Life
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-veda-text sm:text-[1.05rem]">
            Explore authentic Vedic courses, attend live classes, and learn from experienced teachers — all in one
            place.
          </p>


          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 transition-all duration-200 hover:-translate-y-0.5"
            >
              Explore Courses
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              className="btn-outline inline-flex items-center gap-2 rounded-full bg-ivory/60 px-6 py-3 transition-all duration-200 hover:-translate-y-0.5"
            >
              <PlayCircle size={17} aria-hidden="true" />
              Watch Intro
            </button>
          </div>


          <ul className="mt-10 grid max-w-md grid-cols-1 gap-4 sm:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold/45 bg-ivory/85 text-saffron">
                  <Icon size={21} strokeWidth={1.6} aria-hidden />
                </span>
                <span className="text-[0.72rem] leading-snug text-veda-text">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <IntroModal open={introOpen} onClose={() => setIntroOpen(false)} />
    </section>
  );
}