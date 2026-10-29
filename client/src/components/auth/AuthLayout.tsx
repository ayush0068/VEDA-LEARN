import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LotusMark } from '@/components/common/Logo';
import Mandala from '@/components/common/Mandala';
import { AUTH_BG_SRC } from '@/constants/assets';

interface AuthLayoutProps {
  /** browser tab title, e.g. "Sign In" */
  title: string;
  /** top-right helper text + button, e.g. "New here?" + "Create Account" */
  switchPrompt: string;
  switchLabel: string;
  switchTo: string;
  /** card width: "sm" for login, "md" for the longer register form */
  size?: 'sm' | 'md';
  children: ReactNode;
}

/** Full-screen sunrise-ghat background + logo header + centred card, shared by Login and Register. */
export default function AuthLayout({ title, switchPrompt, switchLabel, switchTo, size = 'sm', children }: AuthLayoutProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | VedaLearn`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-[#f8d79b] via-[#eba75e] to-[#a6672c]">
      {!imageFailed && (
        <img
          src={AUTH_BG_SRC}
          alt=""
          aria-hidden
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[30%_center] sm:object-center"
        />
      )}

      {/* warm glow behind the card */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: 'radial-gradient(ellipse 55% 60% at 50% 45%, rgba(255,236,200,0.35) 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* gold Om mandala on the right edge */}
      <div
        className="pointer-events-none absolute -right-28 top-1/2 -z-10 h-[300px] w-[300px] -translate-y-1/2 sm:h-[400px] sm:w-[400px] lg:-right-24 lg:h-[520px] lg:w-[520px]"
        aria-hidden
      >
        <Mandala className="h-full w-full animate-spin-slow text-[#f6dcab]/75 [stroke-width:0.5] motion-reduce:animate-none" />
        <span className="absolute inset-0 flex items-center justify-center font-deva text-[3.2rem] font-bold text-[#d9a24c]/80 sm:text-[4.4rem] lg:text-[5.6rem]">
          ॐ
        </span>
      </div>

      <header className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-10 sm:pt-7 lg:px-12">
        <Link to="/" className="flex items-center gap-2 sm:gap-3" aria-label="VedaLearn home">
          <LotusMark className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />
          <span className="leading-none">
            <span className="block font-display text-[1.7rem] font-medium text-veda-bark sm:text-[2.25rem]">VedaLearn</span>
            <span className="mt-1 block text-[0.62rem] tracking-wide text-veda-text sm:text-[0.74rem]">Learn • Practice • Grow</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden text-[0.92rem] text-veda-text sm:inline">{switchPrompt}</span>
          <Link
            to={switchTo}
            className="inline-flex h-10 items-center rounded-full border border-veda-brown/70 bg-ivory/30 px-5 text-[0.88rem] font-semibold text-veda-brown backdrop-blur-sm transition-colors hover:bg-veda-brown hover:text-ivory sm:h-11 sm:px-6 sm:text-[0.92rem]"
          >
            {switchLabel}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-10">
        <section
          className={`w-full animate-rise-in rounded-[1.75rem] border border-white/40 bg-[#fbf3e3]/95 px-6 py-8 shadow-[0_30px_80px_-30px_rgba(62,31,11,0.6)] backdrop-blur-sm sm:px-9 sm:py-10 ${
            size === 'md' ? 'max-w-[29.5rem]' : 'max-w-[27rem]'
          }`}
        >
          {children}
        </section>
      </main>
    </div>
  );
}