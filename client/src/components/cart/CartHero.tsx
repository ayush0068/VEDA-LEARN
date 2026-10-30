import { ChevronRight, House } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import { CART_BANNER_SRC } from '@/constants/assets';

/** Cart banner: photo from public/images/cart-banner.png (falls back to a sunset gradient) + Sanskrit quote. */
export default function CartHero() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#f9d9a2] via-[#f6e0b8] to-[#fbf1dd] pb-24 sm:pb-28 lg:pb-32"
      aria-labelledby="cart-heading"
    >
      {!imageFailed && (
        <img
          src={CART_BANNER_SRC}
          alt=""
          aria-hidden
          onError={() => setImageFailed(true)}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[75%_center]"
        />
      )}

      {/* keeps the text readable on top of the photo */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ivory/95 via-ivory/70 to-ivory/10 sm:from-ivory/90 sm:via-ivory/55"
        aria-hidden
      />

      {/* the photo melts into the page background, so the cards below overlap a soft edge (not a hard cut) */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent via-ivory/70 to-ivory sm:h-36" aria-hidden />

      <div className="pointer-events-none absolute -left-24 top-1/2 -z-10 h-64 w-64 -translate-y-1/2 sm:h-80 sm:w-80" aria-hidden>
        <Mandala className="h-full w-full animate-spin-slow text-gold/25 [stroke-width:0.5] motion-reduce:animate-none" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[0.82rem] text-veda-text">
          <House size={14} className="text-veda-muted" aria-hidden />
          <Link to="/" className="hover:text-saffron">
            Home
          </Link>
          <ChevronRight size={13} className="text-veda-muted" aria-hidden />
          <span aria-current="page" className="font-medium text-veda-bark">
            Cart
          </span>
        </nav>

        <div className="mt-4 max-w-[34rem] animate-rise-in sm:mt-5 lg:ml-[14rem]">
          <h1 id="cart-heading" className="font-display text-[2.3rem] font-bold leading-none text-veda-bark sm:text-[3rem]">
            Your Cart
          </h1>
          <p className="mt-2.5 text-[1.02rem] text-veda-bark/90 sm:text-[1.2rem]">Take a step closer to timeless wisdom</p>

          <p className="mt-3.5 font-deva text-[1.15rem] text-saffron sm:text-[1.3rem]">&ldquo;विद्या ददाति विनयम्&rdquo;</p>
          <div className="mt-1 flex w-40 items-center gap-2 text-gold" aria-hidden>
            <span className="h-px flex-1 bg-gold/60" />
            <span className="text-[0.7rem]">ॐ</span>
            <span className="h-px flex-1 bg-gold/60" />
          </div>
          <p className="mt-1.5 text-[0.85rem] text-veda-text">Knowledge gives humility.</p>
        </div>
      </div>
    </section>
  );
}