import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePopularCourses } from '@/hooks/usePopularCourses';
import CourseCard from './CourseCard';

export default function PopularCourses() {
  const { courses } = usePopularCourses(4);

  return (
    <section className="bg-ivory py-14 sm:py-20" aria-labelledby="popular-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="popular-heading" className="font-display text-3xl font-semibold text-veda-bark sm:text-4xl">
              Popular Courses
            </h2>
            <p className="mt-2 text-sm text-veda-muted sm:text-base">Most loved courses by our learners</p>
          </div>

          <Link
            to="/courses"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-veda-brown hover:text-saffron"
          >
            View All <span className="hidden sm:inline">Courses</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        {/* mobile: swipeable row, tablet: 2 columns, desktop: 4 columns */}
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {courses.map((course, index) => (
            <li key={course.slug} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <CourseCard course={course} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}