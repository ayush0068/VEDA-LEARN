import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Diya, LeafCluster } from '@/components/common/CtaOrnaments';
import Mandala from '@/components/common/Mandala';

// Subtle paper grain, generated as an inline SVG (no image file needed)
const PAPER_GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.12  0 0 0 0.32 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

const PARCHMENT = `${PAPER_GRAIN}, radial-gradient(ellipse at 50% 40%, #F7E9C9 0%, #EFD9A9 70%, #E4C78C 100%)`;

export default function JourneyCta() {
  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-b from-ivory to-cream pb-12 pt-10 sm:pb-16 sm:pt-14"
      aria-labelledby="journey-heading"
    >
      <div className="relative mx-auto max-w-6xl px-5 sm:px-10">
        {/* banana leaves peeking out from behind the scroll */}
        <LeafCluster className="pointer-events-none absolute -left-4 bottom-0 z-0 h-40 w-auto sm:-left-2 sm:h-56 lg:h-[17rem]" />
        <LeafCluster className="pointer-events-none absolute -right-4 bottom-0 z-0 h-40 w-auto -scale-x-100 sm:-right-2 sm:h-56 lg:h-[17rem]" />

        {/* parchment scroll */}
        <div
          className="relative z-10 mx-auto max-w-5xl overflow-hidden rounded-2xl text-center shadow-[0_18px_40px_-18px_rgba(90,45,15,0.55)] ring-1 ring-[#B98C45]/40"
          style={{ backgroundImage: PARCHMENT, boxShadow: 'inset 0 0 46px rgba(139,94,43,0.28), 0 18px 40px -18px rgba(90,45,15,0.55)' }}
        >
          {/* rolled paper edges */}
          <span
            className="absolute inset-y-0 left-0 w-3 sm:w-5"
            style={{ backgroundImage: 'linear-gradient(to right, #B98C45, #E9D3A0 45%, #CDA765)' }}
            aria-hidden
          />
          <span
            className="absolute inset-y-0 right-0 w-3 sm:w-5"
            style={{ backgroundImage: 'linear-gradient(to left, #B98C45, #E9D3A0 45%, #CDA765)' }}
            aria-hidden
          />

          {/* mandala line art on both ends */}
          <Mandala className="pointer-events-none absolute -left-36 top-1/2 h-72 w-72 -translate-y-1/2 text-[#8A5A24]/35 sm:-left-44 sm:h-[24rem] sm:w-[24rem]" />
          <Mandala className="pointer-events-none absolute -left-28 top-1/2 h-56 w-56 -translate-y-1/2 rotate-[15deg] text-[#8A5A24]/25 sm:-left-36 sm:h-[18rem] sm:w-[18rem]" />
          <Mandala className="pointer-events-none absolute -right-36 top-1/2 h-72 w-72 -translate-y-1/2 text-[#8A5A24]/35 sm:-right-44 sm:h-[24rem] sm:w-[24rem]" />
          <Mandala className="pointer-events-none absolute -right-28 top-1/2 h-56 w-56 -translate-y-1/2 rotate-[15deg] text-[#8A5A24]/25 sm:-right-36 sm:h-[18rem] sm:w-[18rem]" />

          <span
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(ellipse 62% 78% at 50% 50%, rgba(247,236,208,0.95) 35%, rgba(247,236,208,0) 100%)' }}
            aria-hidden
          />

          <div className="relative px-9 py-10 sm:px-24 sm:py-12">
            <h2
              id="journey-heading"
              className="font-display text-[1.45rem] font-semibold leading-snug text-veda-bark sm:text-[1.9rem]"
            >
              Begin Your Vedic Learning Journey Today
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-xs leading-relaxed text-veda-text sm:text-sm">
              Join thousands of learners and experience the wisdom that has guided generations.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/courses" className="btn-primary px-4 py-2.5 sm:px-6">
                Explore Courses <ArrowRight size={15} aria-hidden />
              </Link>
              <Link to="/register" className="btn-outline bg-ivory/40 px-4 py-2.5 sm:px-6">
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* diyas in front, at the bottom corners */}
        <Diya className="pointer-events-none absolute -bottom-3 left-1 z-20 hidden h-20 w-20 sm:block lg:left-3 lg:h-24 lg:w-24" />
        <Diya className="pointer-events-none absolute -bottom-3 right-1 z-20 hidden h-20 w-20 sm:block lg:right-3 lg:h-24 lg:w-24" />
      </div>
    </section>
  );
}