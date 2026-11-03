import { useState } from 'react';
import { LotusMark } from '@/components/common/Logo';
import Mandala from '@/components/common/Mandala';
import { PROFILE_BANNER_SRC } from '@/constants/profile';

const FADE_LEFT = 'linear-gradient(to right, transparent 0%, #000 38%)';

/** "My Profile" banner: sunrise + temple picture on the right, mandala on the left. */
export default function ProfileHero() {
  const [failed, setFailed] = useState(false);

  return (
    <section className="relative isolate min-h-[150px] overflow-hidden pb-4 sm:h-[186px] sm:pb-0" aria-labelledby="profile-heading">
      {!failed && (
        <img
          src={PROFILE_BANNER_SRC}
          alt=""
          aria-hidden
          onError={() => setFailed(true)}
          style={{ WebkitMaskImage: FADE_LEFT, maskImage: FADE_LEFT }}
          className="absolute right-0 top-0 -z-10 h-full w-[min(100%,836px)] object-cover object-left opacity-60 sm:opacity-100"
        />
      )}
      {failed && <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-[#fbd8b6]/60 to-[#f3a95a]/70" aria-hidden />}

      <div className="pointer-events-none absolute -left-24 -top-16 -z-10 h-64 w-64" aria-hidden>
        <Mandala className="h-full w-full animate-spin-slow text-gold/30 [stroke-width:0.5] motion-reduce:animate-none" />
      </div>

      <div className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 sm:pt-7 lg:px-12 lg:pl-[calc(3rem+224px)]">
        <div className="flex items-center gap-3">
          <LotusMark className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
          <h1 id="profile-heading" className="font-display text-[2.1rem] font-bold leading-none text-veda-brown sm:text-[2.6rem]">
            My Profile
          </h1>
        </div>
        <p className="mt-2 text-[0.92rem] text-veda-bark sm:text-[1.02rem]">Manage your personal details, account and preferences.</p>
        <div className="mt-2.5 flex w-[260px] max-w-full items-center gap-2 text-gold" aria-hidden>
          <span className="h-px flex-1 bg-gold/60" />
          <span className="font-deva text-[1.15rem]">ॐ</span>
          <span className="h-px flex-1 bg-gold/60" />
        </div>
      </div>
    </section>
  );
}