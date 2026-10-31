import { useState } from 'react';
import Mandala from '@/components/common/Mandala';
import { Ornament } from '@/components/about/AboutHero';
import { CONTACT_BANNER_SRC } from '@/constants/contact';
import { OmDivider } from './ContactOrnaments';

/** Banner: photo from public/images/contact-banner.png (falls back to a sunrise gradient) + wavy bottom edge. */
export default function ContactHero() {
  const [failed, setFailed] = useState(false);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#fbe7c4] via-[#f6cf93] to-[#e9a867]"
      aria-labelledby="contact-heading"
    >
      {!failed && (
        <img
          src={CONTACT_BANNER_SRC}
          alt=""
          aria-hidden
          fetchPriority="high"
          onError={() => setFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[78%_center]"
        />
      )}
      {/* keeps the text readable on the photo */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fdf3e1]/95 via-[#fdf3e1]/70 to-transparent sm:via-[#fdf3e1]/45 lg:from-[#fdf3e1]/85 lg:via-[#fdf3e1]/25"
        aria-hidden
      />

      <div className="pointer-events-none absolute -left-28 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 sm:h-80 sm:w-80" aria-hidden>
        <Mandala className="h-full w-full animate-spin-slow text-gold/30 [stroke-width:0.45] motion-reduce:animate-none" />
      </div>

      <div className="relative mx-auto flex min-h-[330px] max-w-7xl items-center px-4 pb-20 pt-10 sm:min-h-[360px] sm:px-6 sm:pb-24 lg:min-h-[385px] lg:px-8">
        <div className="max-w-[34rem] animate-rise-in">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#f6d9a4]/90 px-3.5 py-1.5 text-[0.85rem] font-medium text-veda-bark">
            <Ornament className="h-3.5 w-3.5" /> Contact Us
          </span>
          <h1
            id="contact-heading"
            className="mt-4 font-display text-[2.4rem] font-bold leading-[1.1] text-veda-bark sm:text-[3rem] lg:text-[3.4rem]"
          >
            We’re Here to Help
          </h1>
          <p className="mt-4 max-w-[28rem] text-[0.95rem] leading-relaxed text-veda-bark/90 sm:text-[1.05rem]">
            Have a question, need guidance, or want to know more about our courses? Reach out to us anytime — we’ll be glad to assist you.
          </p>
          <OmDivider className="mt-5" />
        </div>
      </div>

      {/* wavy edge: the banner melts into the content below */}
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[-1px] -z-0 h-12 w-full text-ivory sm:h-16 lg:h-20"
        aria-hidden
      >
        <path d="M0 80V52C240 10 460 6 720 30c250 22 470 26 720-14v64Z" fill="currentColor" />
      </svg>
    </section>
  );
}