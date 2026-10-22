import { ArrowRight, Award, MessagesSquare, Smartphone, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROOTS_BANNER_SRC } from '@/constants/assets';

const HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: Video, label: 'Live Interactive Classes' },
  { icon: Smartphone, label: 'Access on Any Device' },
  { icon: Award, label: 'Certificate Programs' },
  { icon: MessagesSquare, label: 'Doubt Support & Community' },
];

// Keeps the text readable over the photo: clear on the left, soft cream behind the text
const FADE_DESKTOP =
  'linear-gradient(to right, rgba(255,250,240,0) 0%, rgba(255,250,240,0.55) 32%, rgba(255,250,240,0.82) 55%, rgba(255,250,240,0.9) 100%)';
const FADE_MOBILE = 'linear-gradient(to bottom, rgba(255,250,240,0.8) 0%, rgba(255,250,240,0.9) 100%)';

export default function RootsBanner() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-r from-gold-soft via-[#F6D79A] to-cream"
      aria-labelledby="roots-heading"
    >
      {/* Background image (public/images/roots-banner.jpg) - falls back to the gradient above */}
      {!imageFailed && (
        <img
          src={ROOTS_BANNER_SRC}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-left"
        />
      )}
      <div className="absolute inset-0 -z-10 lg:hidden" style={{ backgroundImage: FADE_MOBILE }} aria-hidden />
      <div className="absolute inset-0 -z-10 hidden lg:block" style={{ backgroundImage: FADE_DESKTOP }} aria-hidden />


      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.3fr_0.9fr] lg:gap-6 lg:px-8 lg:py-14">
        {/* empty column so the photo stays visible on the left (desktop) */}
        <div className="hidden lg:block" aria-hidden />

        <div className="text-center">
          <h2 id="roots-heading" className="font-display text-[1.7rem] font-semibold leading-snug text-veda-bark sm:text-3xl">
            Learn from Anywhere,
            <br />
            Stay Connected to Your Roots
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-veda-text">
            Live classes, recorded sessions and a supportive community — all in one platform.
          </p>
          <Link to="/register" className="btn-primary mt-6 px-6 py-3">
            Join VedaLearn <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <ul className="mx-auto grid w-full max-w-md grid-cols-2 gap-4 lg:mx-0 lg:max-w-none lg:grid-cols-1 lg:gap-3.5">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold/50 bg-ivory/80 text-veda-brown">
                <Icon size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="text-[0.8rem] font-medium leading-snug text-veda-bark">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}