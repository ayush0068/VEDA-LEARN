import { ArrowLeft, ArrowRight, SearchX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BenefitsStrip from '@/components/courses/BenefitsStrip';
import CatalogCard from '@/components/courses/CatalogCard';
import CategoryTabs from '@/components/courses/CategoryTabs';
import CoursesHero from '@/components/courses/CoursesHero';
import FilterBar, { EMPTY_FILTERS, SortSelect } from '@/components/courses/FilterBar';
import type { Filters } from '@/components/courses/FilterBar';
import { CATALOG_PAGE_SIZE, CATEGORY_ALIASES, COURSE_TABS } from '@/constants/courseCatalog';
import { useCourseCatalog } from '@/hooks/useCourseCatalog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Course } from '@/types';

const matchesDuration = (weeks: number | undefined, bucket: string) => {
  if (weeks == null) return true;
  if (bucket === 'short') return weeks <= 8;
  if (bucket === 'medium') return weeks >= 9 && weeks <= 12;
  return weeks >= 13;
};

const matchesPrice = (price: number, bucket: string) => {
  if (bucket === 'low') return price < 1500;
  if (bucket === 'mid') return price >= 1500 && price <= 2500;
  return price > 2500;
};

const sortCourses = (list: Course[], sort: string): Course[] => {
  const byOrder = (a: Course, b: Course) => (a.order ?? 999) - (b.order ?? 999);
  const copy = [...list];
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || b.studentsCount - a.studentsCount);
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'newest':
      return copy.sort((a, b) =>
        a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : byOrder(b, a),
      );
    default:
      return copy.sort(byOrder);
  }
};

export default function Courses() {
  const { courses } = useCourseCatalog();
  const [params, setParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // category + search live in the URL (home page category cards and the navbar search link here)
  const rawCategory = params.get('category') ?? 'all';
  const category = COURSE_TABS.some((t) => t.slug === rawCategory) ? rawCategory : (CATEGORY_ALIASES[rawCategory] ?? 'all');

  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, query: params.get('q') ?? '' });
  const [page, setPage] = useState(0);

  // navbar search while already on this page
  const urlQuery = params.get('q');
  useEffect(() => {
    if (urlQuery !== null) setFilters((f) => ({ ...f, query: urlQuery }));
  }, [urlQuery]);

  const patchFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(params);
    if (slug === 'all') next.delete('category');
    else next.set('category', slug);
    setParams(next, { replace: true });
    setPage(0);
  };

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const filtered = courses.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (q && !`${c.title} ${c.description ?? ''}`.toLowerCase().includes(q)) return false;
      if (filters.level && c.level !== filters.level) return false;
      if (filters.language && c.language && c.language !== filters.language) return false;
      if (filters.duration && !matchesDuration(c.weeks, filters.duration)) return false;
      if (filters.price && !matchesPrice(c.price, filters.price)) return false;
      return true;
    });
    return sortCourses(filtered, filters.sort);
  }, [courses, category, filters]);

  const pageCount = Math.max(1, Math.ceil(results.length / CATALOG_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = results.slice(safePage * CATALOG_PAGE_SIZE, (safePage + 1) * CATALOG_PAGE_SIZE);

  const resetAll = () => {
    setFilters({ ...EMPTY_FILTERS });
    setCategory('all');
  };

  const grid = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4';

  return (
    <>
      <CoursesHero />
      <CategoryTabs active={category} onChange={setCategory} />

      <section className="pb-8 pt-3 lg:pb-10 lg:pt-4" aria-label="Browse courses">
        <FilterBar filters={filters} onChange={patchFilters} />

        <div id="all-courses" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
          {results.length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-gold/25 bg-ivory/80 px-6 py-14 text-center">
              <SearchX size={36} strokeWidth={1.3} className="text-saffron" aria-hidden />
              <h2 className="mt-3 font-display text-2xl font-semibold text-veda-bark">No courses found</h2>
              <p className="mt-1 text-sm text-veda-muted">Try a different search or clear the filters.</p>
              <button type="button" onClick={resetAll} className="btn-primary mt-5 px-6 py-2.5">
                Clear all filters
              </button>
            </div>
          ) : isDesktop ? (
            /* desktop: one "Featured Courses" grid, 8 per page */
            <>
              <div className="mt-8 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-[1.9rem] font-semibold leading-tight text-veda-bark">Featured Courses</h2>
                  <p className="mt-1 text-sm text-veda-text">Begin your journey with our most popular courses</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPage(0)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-veda-brown hover:text-saffron"
                  >
                    View All <ArrowRight size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(0, safePage - 1))}
                    disabled={safePage === 0}
                    aria-label="Previous courses"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-ivory text-veda-brown transition-colors enabled:hover:bg-veda-brown enabled:hover:text-ivory disabled:opacity-40"
                  >
                    <ArrowLeft size={17} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                    disabled={safePage >= pageCount - 1}
                    aria-label="Next courses"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-ivory text-veda-brown transition-colors enabled:hover:bg-veda-brown enabled:hover:text-ivory disabled:opacity-40"
                  >
                    <ArrowRight size={17} aria-hidden />
                  </button>
                </div>
              </div>

              <ul className={`mt-5 ${grid}`}>
                {pageItems.map((course, i) => (
                  <li key={course.slug}>
                    <CatalogCard course={course} index={i} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            /* mobile / tablet: "Popular Courses" (first two) then "All Courses (n)" with sort */
            <>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-[1.6rem] font-semibold leading-tight text-veda-bark">Popular Courses</h2>
                  <p className="mt-1 text-sm text-veda-text">Begin your journey with our most popular courses</p>
                </div>
                <a href="#all-courses-list" className="inline-flex shrink-0 items-center gap-1 pb-1 text-sm font-medium text-veda-brown">
                  View All <ArrowRight size={15} aria-hidden />
                </a>
              </div>

              <ul className={`mt-4 ${grid}`}>
                {results.slice(0, 2).map((course, i) => (
                  <li key={course.slug}>
                    <CatalogCard course={course} index={i} />
                  </li>
                ))}
              </ul>

              {results.length > 2 && (
                <>
                  <div id="all-courses-list" className="mt-9 flex scroll-mt-24 items-center justify-between gap-4">
                    <h2 className="font-display text-[1.45rem] font-semibold text-veda-bark">
                      All Courses <span className="text-[1.1rem] font-normal text-veda-muted">({results.length})</span>
                    </h2>
                    <SortSelect value={filters.sort} onChange={(sort) => patchFilters({ sort })} />
                  </div>

                  <ul className={`mt-4 ${grid}`}>
                    {results.slice(2).map((course, i) => (
                      <li key={course.slug}>
                        <CatalogCard course={course} index={i + 2} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <BenefitsStrip />
    </>
  );
}