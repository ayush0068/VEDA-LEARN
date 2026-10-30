import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';

const TOPICS = [
  { label: 'Vedic Astrology', slug: 'vedic-astrology' },
  { label: 'Vastu Shastra', slug: 'vastu-shastra' },
  { label: 'Bhagavad Gita', slug: 'bhagavad-gita' },
  { label: 'Mantra & Healing', slug: 'mantra-science-healing' },
  { label: 'Yoga & Meditation', slug: 'yoga-meditation' },
  { label: 'Ancient Texts', slug: 'ancient-texts' },
];

/** Friendly empty state, shown centred on the page (not as a half-empty list card). */
export default function EmptyCart() {
  return (
    <section
      aria-labelledby="cart-empty-heading"
      className="relative isolate mx-auto max-w-3xl overflow-hidden rounded-3xl border border-gold/25 bg-ivory px-5 pb-9 pt-10 text-center shadow-[0_24px_60px_-28px_rgba(90,45,15,0.45)] sm:px-10 sm:pb-11 sm:pt-12"
    >
      {/* soft mandala behind the content */}
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 sm:top-28" aria-hidden>
        <Mandala className="h-full w-full animate-spin-slow text-gold/20 [stroke-width:0.45] motion-reduce:animate-none" />
      </div>

      <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-gold-pale to-cream-deep ring-8 ring-gold-pale/40">
        <ShoppingBag size={38} strokeWidth={1.4} className="text-saffron" aria-hidden />
      </span>

      <h2 id="cart-empty-heading" className="mt-6 font-display text-[1.9rem] font-bold leading-tight text-veda-bark sm:text-[2.3rem]">
        Your cart is empty
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[0.98rem] leading-relaxed text-veda-muted">
        Every journey of wisdom begins with a single step. Explore our courses and add the ones that speak to you.
      </p>

      <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link
          to="/courses"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#7a4015] to-veda-brown px-8 text-[0.95rem] font-semibold text-ivory shadow-[0_10px_22px_-10px_rgba(62,31,11,0.7)] transition hover:from-veda-brown hover:to-veda-bark"
        >
          Explore Courses <ArrowRight size={17} aria-hidden />
        </Link>
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-full border border-veda-brown/60 px-8 text-[0.95rem] font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory"
        >
          Back to Home
        </Link>
      </div>

      <div className="mx-auto mt-9 flex max-w-sm items-center gap-3 text-[0.72rem] uppercase tracking-[0.18em] text-veda-muted" aria-hidden>
        <span className="h-px flex-1 bg-gold/30" />
        Start with a topic
        <span className="h-px flex-1 bg-gold/30" />
      </div>

      <ul className="mt-5 flex flex-wrap justify-center gap-2.5">
        {TOPICS.map((topic) => (
          <li key={topic.slug}>
            <Link
              to={`/courses?category=${topic.slug}`}
              className="inline-flex items-center rounded-full border border-gold/35 bg-cream px-4 py-2 text-[0.84rem] font-medium text-veda-brown transition-colors hover:border-gold hover:bg-gold-pale"
            >
              {topic.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}