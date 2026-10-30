import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import Mandala from '@/components/common/Mandala';
import { AUTH_BG_SRC } from '@/constants/assets';

interface AuthLayoutProps {
  /** browser tab title, e.g. "Sign In" */
  title: string;
  /** top-right helper text + button, e.g. "New here?" + "Create Account" */
  switchPrompt: string;
  switchLabel: string;
  /** shorter label used on phones so the button stays on one line, e.g. "Sign Up" */
  switchLabelShort?: string;
  switchTo: string;
  /** card width: "sm" for login, "md" for the longer register form */
  size?: 'sm' | 'md';
  children: ReactNode;
}

/** Full-screen sunrise-ghat background + logo header + centred card, shared by Login and Register. */
export default function AuthLayout({ title, switchPrompt, switchLabel, switchLabelShort, switchTo, size = 'sm', children }: AuthLayoutProps) {
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

      {/* frosted-glass pill header (blurs the photo behind it) */}
      <header className="px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 rounded-full border border-white/60 bg-gradient-to-b from-white/50 to-white/30 px-3 shadow-[0_8px_32px_rgba(62,31,11,0.18)] ring-1 ring-inset ring-white/40 backdrop-blur-2xl backdrop-saturate-150 sm:px-6 lg:px-8">
          {/* logo never wraps; on very narrow phones the tagline is hidden so everything fits on one line */}
          <div className="shrink-0 max-[359px]:[&_.mt-1]:hidden [&_.mt-1]:text-veda-text">
            <Logo />
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <span className="hidden text-[0.92rem] font-medium text-veda-bark sm:inline">{switchPrompt}</span>
            <Link
              to={switchTo}
              className="btn-outline whitespace-nowrap rounded-full px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 sm:px-5"
            >
              {switchLabelShort ? (
                <>
                  <span className="sm:hidden">{switchLabelShort}</span>
                  <span className="hidden sm:inline">{switchLabel}</span>
                </>
              ) : (
                switchLabel
              )}
            </Link>
          </div>
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