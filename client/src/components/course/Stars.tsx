import { Star, StarHalf } from 'lucide-react';

/** 5 gold stars filled up to `value` (halves are rounded to the nearest half star). */
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        if (value >= i + 0.75) return <Star key={i} size={size} className="fill-gold text-gold" aria-hidden />;
        if (value >= i + 0.25) {
          return (
            <span key={i} className="relative inline-flex" aria-hidden>
              <Star size={size} className="text-gold/30" />
              <StarHalf size={size} className="absolute inset-0 fill-gold text-gold" />
            </span>
          );
        }
        return <Star key={i} size={size} className="text-gold/30" aria-hidden />;
      })}
    </span>
  );
}