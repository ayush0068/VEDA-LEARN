import { ArrowRight, Bookmark, BookmarkCheck, Clock, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import { getIcon } from '@/constants/icons';
import { useSavedCourses } from '@/hooks/useSavedCourses';
import type { Course } from '@/types';
import { discountPercent, formatCount, formatPrice } from '@/utils/format';

function RelatedCard({ course }: { course: Course }) {
  const [failed, setFailed] = useState(false);
  const { isSaved, toggleSaved } = useSavedCourses();
  const saved = isSaved(course.slug);
  const Icon = getIcon(course.icon);
  const off = discountPercent(course.price, course.originalPrice);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-gold/20 bg-ivory shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gold/50">
      <Link to={`/courses/${course.slug}`} aria-label={course.title} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          {course.image && !failed ? (
            <img
              src={course.image}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-veda-bark to-saffron">
              <Mandala className="absolute inset-0 m-auto h-[130%] w-[130%] text-ivory/20" />
              <Icon size={34} strokeWidth={1.3} className="relative text-ivory" aria-hidden />
            </div>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleSaved(course.slug)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${course.title} from saved` : `Save ${course.title}`}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-ivory/90 text-veda-brown shadow-sm backdrop-blur-sm hover:bg-ivory"
      >
        {saved ? <BookmarkCheck size={16} className="fill-gold-pale text-saffron" aria-hidden /> : <Bookmark size={16} aria-hidden />}
      </button>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-[0.95rem] font-semibold leading-snug text-veda-bark">
          <Link to={`/courses/${course.slug}`} className="hover:text-saffron">
            {course.title}
          </Link>
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.76rem] text-veda-text">
          {course.weeks != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-veda-muted" aria-hidden /> {course.weeks} Weeks
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Star size={14} className="fill-gold text-gold" aria-hidden /> {course.rating.toFixed(1)}
            <span className="text-veda-muted">({formatCount(course.studentsCount)})</span>
          </span>
        </p>
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
          <span className="text-[1.1rem] font-bold text-veda-bark">{formatPrice(course.price)}</span>
          {off > 0 && course.originalPrice && <span className="text-[0.8rem] text-veda-muted line-through">{formatPrice(course.originalPrice)}</span>}
        </p>
      </div>
    </li>
  );
}

export default function RelatedCourses({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <h2 id="related-heading" className="font-display text-[1.5rem] font-semibold text-veda-bark sm:text-[1.7rem]">
          Related Courses
        </h2>
        <Link to="/courses" className="inline-flex items-center gap-1.5 text-[0.86rem] font-medium text-veda-brown hover:text-saffron">
          View All Courses <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => (
          <RelatedCard key={course.slug} course={course} />
        ))}
      </ul>
    </section>
  );
}