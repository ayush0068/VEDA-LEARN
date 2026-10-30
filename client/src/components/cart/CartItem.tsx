import { ChartNoAxesColumn, Clock, FileText, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Course } from '@/types';
import { discountPercent, formatPrice } from '@/utils/format';
import CourseThumb, { InstructorBadge } from './CourseThumb';

interface CartItemProps {
  course: Course;
  index: number;
  onRemove: (slug: string) => void;
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1.5 text-[0.78rem] text-veda-text sm:text-[0.84rem]">
      <span className="text-veda-muted">{icon}</span>
      {children}
    </li>
  );
}

export default function CartItem({ course, index, onRemove }: CartItemProps) {
  const href = `/courses/${course.slug}`;
  const off = discountPercent(course.price, course.originalPrice);

  return (
    <li className="group grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 rounded-xl border border-gold/15 bg-ivory p-2.5 shadow-sm sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4 sm:p-3 lg:grid-cols-[11.5rem_minmax(0,1fr)]">
      <Link to={href} aria-label={course.title} tabIndex={-1} className="block self-start">
        <CourseThumb course={course} index={index} className="aspect-[4/3] rounded-lg sm:aspect-[16/10]" />
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-[1.02rem] font-semibold leading-snug text-veda-bark sm:text-[1.2rem]">
              <Link to={href} className="hover:text-saffron">
                {course.title}
              </Link>
            </h3>
            <p className="mt-1.5 flex items-center gap-2 text-[0.82rem] text-veda-text sm:mt-2 sm:text-[0.9rem]">
              <InstructorBadge name={course.instructor || 'VedaLearn Faculty'} />
              <span className="truncate">{course.instructor || 'VedaLearn Faculty'}</span>
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="flex flex-wrap items-baseline gap-x-2 sm:justify-end">
              <span className="text-[1.1rem] font-bold text-veda-bark sm:text-[1.3rem]">{formatPrice(course.price)}</span>
              {off > 0 && course.originalPrice && (
                <span className="text-[0.82rem] text-veda-muted line-through sm:text-[0.9rem]">{formatPrice(course.originalPrice)}</span>
              )}
              {off > 0 && (
                <span className="rounded-md bg-gold-pale px-2 py-0.5 text-[0.68rem] font-semibold text-saffron sm:hidden">{off}% OFF</span>
              )}
            </p>
            {off > 0 && (
              <p className="mt-1.5 hidden sm:block">
                <span className="rounded-md bg-gold-pale px-2.5 py-1 text-[0.74rem] font-semibold text-saffron">{off}% OFF</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {course.lessons != null && <Meta icon={<FileText size={15} aria-hidden />}>{course.lessons} Lessons</Meta>}
            {course.level && <Meta icon={<ChartNoAxesColumn size={15} aria-hidden />}>{course.level}</Meta>}
            {course.weeks != null && <Meta icon={<Clock size={15} aria-hidden />}>{course.weeks} Weeks</Meta>}
          </ul>

          <button
            type="button"
            onClick={() => onRemove(course.slug)}
            aria-label={`Remove ${course.title} from cart`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.82rem] text-veda-text transition-colors hover:bg-gold-pale hover:text-saffron"
          >
            <Trash2 size={15} aria-hidden />
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}