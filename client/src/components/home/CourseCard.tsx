import { Check, ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import { getIcon } from '@/constants/icons';
import { useCart } from '@/context/CartContext';
import type { Course } from '@/types';
import { formatCount, formatPrice } from '@/utils/format';

const FALLBACK_BG = [
  'from-veda-bark to-veda-brown',
  'from-gold-soft to-saffron',
  'from-veda-brown to-saffron',
  'from-saffron to-gold',
];

interface CourseCardProps {
  course: Course;
  index: number;
}

export default function CourseCard({ course, index }: CourseCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { has, toggle } = useCart();
  const Icon = getIcon(course.icon);
  const inCart = has(course.slug);
  const showImage = Boolean(course.image) && !imageFailed;
  const href = `/courses/${course.slug}`;

  return (
    <article className="group flex h-full flex-col rounded-xl border border-gold/20 bg-ivory p-2 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold/50">
      <Link to={href} className="relative block aspect-[4/3] overflow-hidden rounded-lg" aria-label={course.title} tabIndex={-1}>
        {showImage ? (
          <img
            src={course.image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${FALLBACK_BG[index % FALLBACK_BG.length]}`}
          >
            <Mandala className="absolute inset-0 m-auto h-[130%] w-[130%] text-ivory/20" />
            <Icon size={46} strokeWidth={1.3} className="relative text-ivory" aria-hidden />
          </div>
        )}

        {course.badge && (
          <span className="absolute left-2 top-2 rounded-md bg-[#D9455F] px-2 py-0.5 text-[0.7rem] font-semibold text-white shadow">
            {course.badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
        <h3 className="font-display text-[1.05rem] font-semibold leading-snug text-veda-bark">
          <Link to={href} className="hover:text-saffron">
            {course.title}
          </Link>
        </h3>

        <p className="mt-2 flex items-center gap-1 text-xs text-veda-muted">
          <Star size={13} className="fill-gold text-gold" aria-hidden />
          <span className="font-semibold text-veda-text">{course.rating.toFixed(1)}</span>
          <span>({formatCount(course.studentsCount)} students)</span>
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-veda-bark">{formatPrice(course.price)}</span>
            {course.originalPrice && course.originalPrice > course.price && (
              <span className="text-xs text-veda-muted line-through">{formatPrice(course.originalPrice)}</span>
            )}
          </p>

          <button
            type="button"
            onClick={() => toggle(course.slug)}
            aria-pressed={inCart}
            aria-label={inCart ? `Remove ${course.title} from cart` : `Add ${course.title} to cart`}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
              inCart ? 'bg-emerald-700 text-white' : 'bg-veda-brown text-ivory hover:bg-veda-bark'
            }`}
          >
            {inCart ? <Check size={17} aria-hidden /> : <ShoppingCart size={17} aria-hidden />}
          </button>
        </div>
      </div>
    </article>
  );
}