import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ReviewItem } from '@/constants/courseDetails';
import { formatCount } from '@/utils/format';
import { reviewerPhoto } from '@/utils/courseFormat';
import Avatar from './Avatar';
import Stars from './Stars';

const INITIAL_COUNT = 3;

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <article className="h-full rounded-xl border border-gold/20 bg-ivory p-4 shadow-sm">
      <header className="flex items-center gap-3">
        <Avatar name={review.name} src={reviewerPhoto(review.name)} className="h-10 w-10" textClass="text-[0.78rem]" />
        <div className="min-w-0">
          <p className="truncate text-[0.92rem] font-semibold text-veda-bark">{review.name}</p>
          <p className="flex items-center gap-2 text-[0.75rem] text-veda-muted">
            <Stars value={review.rating} size={13} /> {review.ago}
          </p>
        </div>
      </header>
      <p className="mt-3 text-[0.88rem] leading-relaxed text-veda-text">{review.text}</p>
    </article>
  );
}

interface ReviewsProps {
  reviews: ReviewItem[];
  rating: number;
  ratingCount: number;
}

export default function Reviews({ reviews, rating, ratingCount }: ReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const [index, setIndex] = useState(0);
  const shown = showAll ? reviews : reviews.slice(0, INITIAL_COUNT);
  const current = reviews[index] ?? reviews[0];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h2 id="reviews-heading" className="font-display text-[1.5rem] font-semibold text-veda-bark sm:text-[1.7rem]">
            Student Reviews
          </h2>
          <p className="flex items-center gap-2 text-[0.84rem] text-veda-text">
            <span>{rating.toFixed(1)} out of 5</span>
            <Stars value={rating} size={15} />
            <span className="text-veda-muted">({formatCount(ratingCount)} reviews)</span>
          </p>
        </div>

        {reviews.length > INITIAL_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="hidden items-center gap-1.5 rounded-full border border-veda-brown/60 px-4 py-1.5 text-[0.84rem] font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory md:inline-flex"
          >
            {showAll ? 'Show Less' : 'View All Reviews'} <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </div>

      {/* tablet / desktop: cards in a grid */}
      <ul className="mt-4 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
        {shown.map((r) => (
          <li key={r.name + r.ago}>
            <ReviewCard review={r} />
          </li>
        ))}
      </ul>

      {/* phone: one card at a time with arrows + dots */}
      <div className="mt-4 md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + reviews.length) % reviews.length)}
            aria-label="Previous review"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-ivory text-veda-brown shadow-sm"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <div className="min-w-0 flex-1" aria-live="polite">
            <ReviewCard review={current} />
          </div>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % reviews.length)}
            aria-label="Next review"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-ivory text-veda-brown shadow-sm"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {reviews.map((r, i) => (
            <span key={r.name + r.ago} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-saffron' : 'w-1.5 bg-gold/40'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}