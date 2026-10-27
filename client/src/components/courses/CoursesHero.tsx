import { useState } from 'react';
import Mandala from '@/components/common/Mandala';
import { COURSES_BANNER_SRC } from '@/constants/assets';

/** Banner: photo from public/images/courses-banner.png (falls back to a sunset gradient) + gold Om mandala. */
export default function CoursesHero() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#f7cf8f] via-[#f2b56c] to-[#e59d55]"
      aria-labelledby="courses-heading"
    >
      {!imageFailed && (
        <img
          src={COURSES_BANNER_SRC}
          alt=""
          aria-hidden
          fetchPriority="high"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[28%_center] lg:object-center"
        />
      )}

      {/* soft light behind the text so it stays readable on the photo */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 85% at 50% 38%, rgba(255,236,200,0.55) 0%, rgba(255,236,200,0.18) 55%, transparent 80%)',
        }}
        aria-hidden
      />

      {/* gold Om mandala on the right */}
      <div
        className="pointer-events-none absolute -right-10 top-1/2 -z-10 h-[210px] w-[210px] -translate-y-[58%] sm:h-[250px] sm:w-[250px] lg:-right-14 lg:h-[330px] lg:w-[330px]"
        aria-hidden
      >
        <Mandala className="h-full w-full animate-spin-slow text-[#c98a2b]/55 [stroke-width:0.5] motion-reduce:animate-none" />
        <span className="absolute inset-0 flex items-center justify-center font-deva text-[2.6rem] font-bold text-[#c98a2b]/85 lg:text-[4.4rem]">
          ॐ
        </span>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-6 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-12 lg:text-center">
        <div className="max-w-[62%] animate-rise-in sm:max-w-[70%] lg:mx-auto lg:max-w-2xl">
          <h1
            id="courses-heading"
            className="font-display text-[2rem] font-bold leading-[1.1] text-veda-bark sm:text-[2.6rem] lg:text-[3.1rem]"
          >
            Explore Our Courses
          </h1>
          <p className="mt-2.5 text-[0.98rem] font-medium text-veda-bark/90 sm:text-lg lg:mt-3">
            Ancient Wisdom for a Modern Life
          </p>
          <p className="mt-3 text-[0.78rem] leading-relaxed text-veda-text sm:text-sm lg:mx-auto lg:mt-4 lg:max-w-lg">
            Learn at your own pace or join live classes with expert teachers. Discover courses on Vedic knowledge,
            spirituality, healing, astrology, Vastu and more.
          </p>
        </div>
      </div>
    </section>
  );
}