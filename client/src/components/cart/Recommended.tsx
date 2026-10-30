import { ArrowRight, ChartNoAxesColumn, FileText, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LotusMark } from '@/components/common/Logo';
import Mandala from '@/components/common/Mandala';
import type { Course } from '@/types';
import { discountPercent, formatPrice } from '@/utils/format';
import CourseThumb, { InstructorBadge } from './CourseThumb';

function SuggestionCard({ course, index, onAdd }: { course: Course; index: number; onAdd: (slug: string) => void }) {
  const href = `/courses/${course.slug}`;
  const off = discountPercent(course.price, course.originalPrice);

  return (
    <li className="group flex flex-col rounded-xl border border-gold/20 bg-ivory p-2 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-gold/50">
      <Link to={href} aria-label={course.title} tabIndex={-1} className="block">
        <CourseThumb course={course} index={index} className="aspect-[16/9] rounded-lg" />
      </Link>

      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
        <h3 className="font-display text-[0.98rem] font-semibold leading-snug text-veda-bark">
          <Link to={href} className="hover:text-saffron">
            {course.title}
          </Link>
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-[0.78rem] text-veda-text">
          <InstructorBadge name={course.instructor || 'VedaLearn Faculty'} size="sm" />
          <span className="truncate">{course.instructor || 'VedaLearn Faculty'}</span>
        </p>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-veda-muted">
          {course.lessons != null && (
            <span className="inline-flex items-center gap-1">
              <FileText size={13} aria-hidden /> {course.lessons} Lessons
            </span>
          )}
          {course.level && (
            <span className="inline-flex items-center gap-1">
              <ChartNoAxesColumn size={13} aria-hidden /> {course.level}
            </span>
          )}
        </p>

        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-3">
          <span className="text-[1.05rem] font-bold text-veda-bark">{formatPrice(course.price)}</span>
          {off > 0 && course.originalPrice && (
            <span className="text-[0.75rem] text-veda-muted line-through">{formatPrice(course.originalPrice)}</span>
          )}
          {off > 0 && <span className="rounded-md bg-gold-pale px-1.5 py-0.5 text-[0.66rem] font-semibold text-saffron">{off}% OFF</span>}
        </p>

        <button
          type="button"
          onClick={() => onAdd(course.slug)}
          aria-label={`Add ${course.title} to cart`}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-veda-brown/60 text-[0.84rem] font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory"
        >
          <ShoppingCart size={16} aria-hidden /> Add to Cart
        </button>
      </div>
    </li>
  );
}

/** "You May Also Like" suggestions + the Sanskrit quote card. */
export default function Recommended({ courses, onAdd }: { courses: Course[]; onAdd: (slug: string) => void }) {
  return (
    <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_23.5rem] lg:items-start">
      {courses.length > 0 && (
        <section aria-labelledby="recommended-heading">
          <div className="flex items-end justify-between gap-4">
            <h2 id="recommended-heading" className="font-display text-[1.5rem] font-semibold text-veda-bark sm:text-[1.7rem]">
              You May Also Like
            </h2>
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-veda-brown hover:text-saffron">
              View All <ArrowRight size={15} aria-hidden />
            </Link>
          </div>

          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {courses.map((course, i) => (
              <SuggestionCard key={course.slug} course={course} index={i} onAdd={onAdd} />
            ))}
          </ul>
        </section>
      )}

      <aside
        className={`relative isolate overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-cream via-[#f6e2bd] to-[#efc98c] p-6 text-center shadow-soft sm:p-8 lg:min-h-[17rem] ${
          courses.length === 0 ? 'lg:col-start-2' : ''
        }`}
        aria-label="Quote"
      >
        <div className="pointer-events-none absolute -bottom-16 -right-16 -z-10 h-56 w-56" aria-hidden>
          <Mandala className="h-full w-full animate-spin-slow text-gold/30 [stroke-width:0.5] motion-reduce:animate-none" />
        </div>
        <LotusMark className="pointer-events-none absolute -bottom-3 right-4 -z-10 h-24 w-24 opacity-70" />

        <p className="font-deva text-[1.5rem] text-saffron">&ldquo;ज्ञानं परमं बलम्&rdquo;</p>
        <p className="mt-2 text-[0.95rem] text-veda-text">Knowledge is the Highest Strength.</p>
        <div className="mx-auto mt-3 flex w-40 items-center gap-2 text-gold" aria-hidden>
          <span className="h-px flex-1 bg-gold/60" />
          <span className="text-[0.7rem]">ॐ</span>
          <span className="h-px flex-1 bg-gold/60" />
        </div>
      </aside>
    </div>
  );
}