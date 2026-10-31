import { CircleHelp, UsersRound, Video, Presentation } from 'lucide-react';
import { useState } from 'react';
import Mandala from '@/components/common/Mandala';
import { LIVE_BANNER_SRC } from '@/constants/liveClasses';

const FEATURES = [
  { label: 'Live Interaction', Icon: Presentation },
  { label: 'Ask Questions', Icon: CircleHelp },
  { label: 'Practice Together', Icon: UsersRound },
  { label: 'Recorded Access', Icon: Video },
];

/** Banner: photo from public/images/live-classes-banner.png (falls back to a sunset gradient) + gold Om mandala. */
export default function LiveHero() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#f7cf8f] via-[#f2b56c] to-[#e59d55]"
      aria-labelledby="live-heading"
    >
      {!imageFailed && (
        <img
          src={LIVE_BANNER_SRC}
          alt=""
          aria-hidden
          fetchPriority="high"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[72%_center] lg:object-center"
        />
      )}

      {/* soft light behind the text so it stays readable on the photo */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 90% at 28% 40%, rgba(255,236,200,0.55) 0%, rgba(255,236,200,0.2) 55%, transparent 80%)',
        }}
        aria-hidden
      />

      {/* mobile: gold Om mandala on the right */}
      <div className="pointer-events-none absolute -right-8 top-6 -z-10 h-[170px] w-[170px] sm:h-[210px] sm:w-[210px] lg:hidden" aria-hidden>
        <Mandala className="h-full w-full animate-spin-slow text-[#c98a2b]/55 [stroke-width:0.5] motion-reduce:animate-none" />
        <span className="absolute inset-0 flex items-center justify-center font-deva text-[2.3rem] font-bold text-[#c98a2b]/85">ॐ</span>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
        <div className="grid items-start lg:grid-cols-[1fr_320px] lg:gap-10">
          <div className="animate-rise-in max-w-[84%] sm:max-w-[70%] lg:max-w-none">
            <h1
              id="live-heading"
              className="font-display text-[2.3rem] font-bold leading-[1.08] text-veda-bark sm:text-[2.8rem] lg:text-[3.4rem]"
            >
              Live Classes
            </h1>
            <p className="mt-2 font-display text-[1.02rem] font-semibold leading-snug text-veda-bark sm:text-lg lg:mt-2.5 lg:text-[1.35rem]">
              <span className="lg:hidden">Learn Directly from Authentic Teachers, Anytime, Anywhere</span>
              <span className="hidden lg:inline">Learn in Real-Time, from Authentic Teachers</span>
            </p>
            <p className="mt-2.5 max-w-[19rem] text-[0.78rem] leading-relaxed text-veda-text sm:max-w-md sm:text-sm lg:mt-3 lg:max-w-sm lg:text-[0.9rem]">
              Join interactive live sessions, ask questions, get guidance and experience the wisdom of the Vedas
              <span className="lg:hidden"> in real time</span>
              <span className="hidden lg:inline"> with expert teachers</span>.
            </p>
          </div>

          {/* desktop: Sanskrit quote + Om mandala */}
          <div className="relative hidden h-[190px] lg:block" aria-hidden>
            <div className="absolute -right-14 -top-4 h-[210px] w-[210px]">
              <Mandala className="h-full w-full animate-spin-slow text-[#c98a2b]/55 [stroke-width:0.5] motion-reduce:animate-none" />
              <span className="absolute inset-0 flex items-center justify-center font-deva text-[4.2rem] font-bold text-[#c98a2b]/85">ॐ</span>
            </div>
            <blockquote className="absolute left-0 top-9 text-center text-veda-bark">
              <p className="font-deva text-[1.3rem] font-semibold">“ज्ञानं परं बलम्”</p>
              <p className="mt-1 text-[0.72rem] text-veda-text">Knowledge is the Highest Strength</p>
              <span className="mx-auto mt-2 block h-px w-24 bg-gold/70" />
            </blockquote>
          </div>
        </div>

        {/* desktop: feature icons */}
        <ul className="mt-5 hidden max-w-xl grid-cols-4 gap-4 lg:grid">
          {FEATURES.map(({ label, Icon }) => (
            <li key={label} className="flex flex-col items-center gap-1.5 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-ivory/90 text-veda-brown shadow-sm">
                <Icon size={19} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="text-[0.72rem] font-medium text-veda-bark">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}