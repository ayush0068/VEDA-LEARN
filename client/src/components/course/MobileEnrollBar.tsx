import { ArrowRight } from 'lucide-react';
import type { Course } from '@/types';
import { discountPercent, formatPrice } from '@/utils/format';

/** Price + Enroll Now that stays at the bottom of the screen on phones / tablets (stops above the footer). */
export default function MobileEnrollBar({ course, onEnroll }: { course: Course; onEnroll: () => void }) {
  const off = discountPercent(course.price, course.originalPrice);

  return (
    <div className="sticky bottom-0 z-40 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-gold/30 bg-ivory/95 px-4 py-3 shadow-[0_-10px_30px_-18px_rgba(62,31,11,0.45)] backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="font-display text-[1.4rem] font-bold leading-none text-veda-bark">{formatPrice(course.price)}</span>
        {off > 0 && course.originalPrice && <span className="text-[0.82rem] text-veda-muted line-through">{formatPrice(course.originalPrice)}</span>}
        {off > 0 && <span className="rounded-md bg-gold-pale px-2 py-0.5 text-[0.7rem] font-semibold text-saffron">{off}% OFF</span>}
      </p>
      <button
        type="button"
        onClick={onEnroll}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#7a4015] to-veda-brown px-6 text-[0.95rem] font-semibold text-ivory shadow-[0_10px_22px_-10px_rgba(62,31,11,0.7)]"
      >
        Enroll Now <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );
}