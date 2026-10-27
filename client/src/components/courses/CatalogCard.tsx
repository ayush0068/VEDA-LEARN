import { ArrowRight, Bookmark, Clock, FileText, Star, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import { getIcon } from '@/constants/icons';
import { useCart } from '@/context/CartContext';
import { useSavedCourses } from '@/hooks/useSavedCourses';
import type { Course } from '@/types';
import { discountPercent, formatCount, formatPrice } from '@/utils/format';

const FALLBACK_BG = [
  'from-veda-bark to-veda-brown',
  'from-gold-soft to-saffron',
  'from-veda-brown to-saffron',
  'from-saffron to-gold',
];

const BADGE_STYLE: Record<string, string> = {
  Bestseller: 'bg-[#F4C04E] text-veda-bark',
  Popular: 'bg-ivory text-veda-bark',
  New: 'bg-ivory text-veda-bark',
};

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-[0.86rem] text-veda-text lg:text-[0.74rem]">
      <span className="text-veda-muted">{icon}</span>
      {children}
    </li>
  );
}

interface CatalogCardProps {
  course: Course;
  index: number;
}

export default function CatalogCard({ course, index }: CatalogCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { has, toggle } = useCart();
  const { isSaved, toggleSaved } = useSavedCourses();
  const navigate = useNavigate();
  const Icon = getIcon(course.icon);
  const href = `/courses/${course.slug}`;
  const saved = isSaved(course.slug);
  const off = discountPercent(course.price, course.originalPrice);
  const showImage = Boolean(course.image) && !imageFailed;

  const enroll = () => {
    if (!has(course.slug)) toggle(course.slug);
    navigate('/cart');
  };

  return (
    <article className="group flex h-full flex-col rounded-xl border border-gold/25 bg-ivory p-2 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold/55">
      {/* image */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg lg:aspect-[4/3]">
        <Link to={href} className="block h-full w-full" aria-label={course.title} tabIndex={-1}>
          {showImage ? (
            <img
              src={course.image}
              alt=""
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${FALLBACK_BG[index % FALLBACK_BG.length]}`}>
              <Mandala className="absolute inset-0 m-auto h-[130%] w-[130%] text-ivory/20" />
              <Icon size={46} strokeWidth={1.3} className="relative text-ivory" aria-hidden />
            </div>
          )}
        </Link>

        {course.badge && (
          <span className={`absolute left-2.5 top-2.5 rounded-lg px-3 py-1 text-[0.75rem] font-semibold shadow-sm lg:text-[0.68rem] ${BADGE_STYLE[course.badge] ?? 'bg-ivory text-veda-bark'}`}>
            {course.badge}
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleSaved(course.slug)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${course.title} from saved` : `Save ${course.title}`}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-veda-bark/70 text-ivory backdrop-blur-sm transition-colors hover:bg-veda-bark lg:h-8 lg:w-8"
        >
          <Bookmark size={17} className={saved ? 'fill-gold-soft text-gold-soft' : ''} aria-hidden />
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-3.5 lg:px-2 lg:pb-2 lg:pt-3">
        <h3 className="font-display text-[1.3rem] font-semibold leading-snug text-veda-bark lg:text-[1.02rem]">
          <Link to={href} className="hover:text-saffron">
            {course.title}
          </Link>
        </h3>

        {course.description && (
          <p className="mt-1.5 line-clamp-2 text-[0.95rem] leading-snug text-veda-muted lg:text-[0.78rem]">{course.description}</p>
        )}

        <ul className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 lg:mt-3 lg:gap-y-2">
          {course.weeks != null && <Meta icon={<Clock size={16} aria-hidden />}>{course.weeks} Weeks</Meta>}
          {course.lessons != null && <Meta icon={<FileText size={16} aria-hidden />}>{course.lessons} Lessons</Meta>}
          {course.level && <Meta icon={<User size={16} aria-hidden />}>{course.level}</Meta>}
          <Meta icon={<Star size={16} className="fill-gold text-gold" aria-hidden />}>
            <span>
              <span className="font-semibold text-veda-bark">{course.rating.toFixed(1)}</span> ({formatCount(course.studentsCount)})
            </span>
          </Meta>
        </ul>

        <p className="mt-auto flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pt-4 lg:pt-3.5">
          <span className="text-[1.6rem] font-bold leading-none text-veda-bark lg:text-[1.2rem]">{formatPrice(course.price)}</span>
          {off > 0 && course.originalPrice && (
            <span className="text-[0.9rem] text-veda-muted line-through lg:text-[0.75rem]">{formatPrice(course.originalPrice)}</span>
          )}
          {off > 0 && (
            <span className="rounded-md bg-gold-pale px-2 py-0.5 text-[0.72rem] font-semibold text-saffron lg:hidden">{off}% OFF</span>
          )}
        </p>

        <button
          type="button"
          onClick={enroll}
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-veda-brown text-[0.95rem] font-medium text-ivory transition-colors hover:bg-veda-bark lg:h-10 lg:text-[0.8rem]"
        >
          Enroll Now <ArrowRight size={16} aria-hidden />
        </button>
      </div>
    </article>
  );
}