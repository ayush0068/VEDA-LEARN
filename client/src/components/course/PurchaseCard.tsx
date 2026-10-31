import { ArrowRight, CircleCheck, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course } from '@/types';
import { discountPercent, formatPrice } from '@/utils/format';

export const BENEFITS = [
  'Lifetime access to recorded videos',
  'Live doubt solving sessions',
  'Downloadable study material',
  'Certificate of completion',
  'Access on mobile, tablet and desktop',
  '30-day money back guarantee',
];

interface PurchaseCardProps {
  course: Course;
  inCart: boolean;
  onEnroll: () => void;
  onAddToCart: () => void;
}

/** Price + Enroll Now / Add to Cart + what you get. */
export default function PurchaseCard({ course, inCart, onEnroll, onAddToCart }: PurchaseCardProps) {
  const off = discountPercent(course.price, course.originalPrice);

  return (
    <section
      aria-label="Enroll in this course"
      className="rounded-2xl border border-gold/25 bg-ivory p-5 shadow-[0_24px_50px_-28px_rgba(90,45,15,0.5)] sm:p-6"
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-display text-[2rem] font-bold leading-none text-veda-bark">{formatPrice(course.price)}</span>
        {off > 0 && course.originalPrice && (
          <span className="text-[1rem] text-veda-muted line-through">{formatPrice(course.originalPrice)}</span>
        )}
        {off > 0 && (
          <span className="rounded-lg bg-gold-pale px-3 py-1 text-[0.8rem] font-semibold tracking-wide text-saffron">{off}% OFF</span>
        )}
      </p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={onEnroll}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#7a4015] to-veda-brown text-[1rem] font-semibold text-ivory shadow-[0_10px_22px_-10px_rgba(62,31,11,0.7)] transition hover:from-veda-brown hover:to-veda-bark"
        >
          Enroll Now <ArrowRight size={17} aria-hidden />
        </button>

        {inCart ? (
          <Link
            to="/cart"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-700/40 bg-emerald-50/70 text-[0.98rem] font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            <CircleCheck size={19} aria-hidden /> In Your Cart &middot; View Cart
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAddToCart}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-veda-brown/60 text-[0.98rem] font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory"
          >
            <ShoppingCart size={19} aria-hidden /> Add to Cart
          </button>
        )}
      </div>

      <ul className="mt-5 grid gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-1">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-[0.86rem] text-veda-text">
            <CircleCheck size={17} className="mt-0.5 shrink-0 text-saffron" aria-hidden />
            {benefit}
          </li>
        ))}
      </ul>
    </section>
  );
}