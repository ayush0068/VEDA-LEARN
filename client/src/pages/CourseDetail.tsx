import { ChartNoAxesColumn, ChevronRight, CircleCheck, Clock, FileText, House, Star, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Curriculum from '@/components/course/Curriculum';
import CourseMedia from '@/components/course/CourseMedia';
import CourseTabs from '@/components/course/CourseTabs';
import type { TabSection } from '@/components/course/CourseTabs';
import Faq from '@/components/course/Faq';
import Highlights from '@/components/course/Highlights';
import MobileEnrollBar from '@/components/course/MobileEnrollBar';
import PreviewModal from '@/components/course/PreviewModal';
import PromoBand from '@/components/course/PromoBand';
import PurchaseCard from '@/components/course/PurchaseCard';
import RelatedCourses from '@/components/course/RelatedCourses';
import Reviews from '@/components/course/Reviews';
import { AudienceCard, IncludesCard, InstructorCard } from '@/components/course/SideCards';
import Mandala from '@/components/common/Mandala';
import { useCart } from '@/context/CartContext';
import { useCourseDetail } from '@/hooks/useCourseDetail';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSavedCourses } from '@/hooks/useSavedCourses';
import { formatCount } from '@/utils/format';

const SECTIONS: TabSection[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'instructor', label: 'Instructor' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'faqs', label: 'FAQs' },
];

const BADGE_STYLE: Record<string, string> = {
  Bestseller: 'bg-[#F4C04E] text-veda-bark',
  Popular: 'bg-gold-pale text-veda-bark',
  New: 'bg-gold-pale text-veda-bark',
};

function Stat({ icon, value, label, className = '' }: { icon: React.ReactNode; value: string; label: string; className?: string }) {
  return (
    <li className={`flex flex-col items-center gap-1.5 text-center ${className}`}>
      <span className="text-saffron">{icon}</span>
      <span className="text-[0.88rem] font-semibold leading-tight text-veda-bark">{value}</span>
      <span className="text-[0.74rem] leading-tight text-veda-muted">{label}</span>
    </li>
  );
}

function Breadcrumb({ title }: { title?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[0.82rem] text-veda-text">
      <House size={14} className="shrink-0 text-veda-muted" aria-hidden />
      <Link to="/" className="shrink-0 hover:text-saffron">
        Home
      </Link>
      <ChevronRight size={13} className="shrink-0 text-veda-muted" aria-hidden />
      <Link to="/courses" className="shrink-0 hover:text-saffron">
        Courses
      </Link>
      {title && (
        <>
          <ChevronRight size={13} className="shrink-0 text-veda-muted" aria-hidden />
          <span aria-current="page" className="truncate font-medium text-veda-bark">
            {title}
          </span>
        </>
      )}
    </nav>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading course">
      <div className="h-4 w-56 animate-pulse rounded bg-gold-pale/60" />
      <div className="mt-6 grid gap-6 md:grid-cols-[22rem_1fr]">
        <div className="aspect-[16/10] animate-pulse rounded-2xl bg-gold-pale/50" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-gold-pale/60" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-gold-pale/40" />
          <div className="h-24 animate-pulse rounded bg-gold-pale/30" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb />
      <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-gold/25 bg-ivory px-6 py-12 text-center shadow-soft">
        <p className="font-display text-[2rem] font-bold text-veda-bark">Course not found</p>
        <p className="mt-2 text-[0.95rem] text-veda-muted">This course may have been moved or is no longer available.</p>
        <Link
          to="/courses"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-veda-brown px-7 text-[0.92rem] font-medium text-ivory transition-colors hover:bg-veda-bark"
        >
          Explore Courses
        </Link>
      </div>
    </div>
  );
}

function CourseDetailView({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const { has, add } = useCart();
  const { isSaved, toggleSaved } = useSavedCourses();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { course, detail, related, loaded } = useCourseDetail(slug);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, []);

  useEffect(() => {
    if (!course) return;
    const previous = document.title;
    document.title = `${course.title} | VedaLearn`;
    return () => {
      document.title = previous;
    };
  }, [course]);

  if (!course || !detail) return loaded ? <NotFound /> : <LoadingSkeleton />;

  const inCart = has(course.slug);
  const instructorName = course.instructor || 'VedaLearn Faculty';
  const lessons = course.lessons ?? detail.curriculum.reduce((sum, m) => sum + m.lessons, 0);
  const weeks = course.weeks ?? detail.curriculum.reduce((sum, m) => sum + m.weeks, 0);

  const enroll = () => {
    if (!inCart) add(course.slug);
    navigate('/cart');
  };
  const addToCart = () => add(course.slug);

  return (
    <div className="relative isolate">
      {/* warm wash behind the top of the page + mandala on the right edge */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-gradient-to-b from-[#f8e3bd]/70 via-[#fbefd6]/45 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -right-40 top-10 -z-10 hidden h-[30rem] w-[30rem] lg:block" aria-hidden>
        <Mandala className="h-full w-full text-gold/15 [stroke-width:0.5]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-0 pt-5 sm:px-6 lg:px-8">
        <Breadcrumb title={course.title} />

        <div className="mt-5 grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          {/* ===================== hero: picture + key facts ===================== */}
          <section aria-labelledby="course-title" className="lg:col-start-1 lg:row-start-1">
            <div className="grid gap-5 md:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] md:gap-7 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]">
              <CourseMedia course={course} saved={isSaved(course.slug)} onToggleSaved={() => toggleSaved(course.slug)} onPreview={() => setPreviewOpen(true)} />

              <div className="min-w-0">
                {course.badge && (
                  <span className={`hidden rounded-md px-3 py-1 text-[0.74rem] font-semibold md:inline-block ${BADGE_STYLE[course.badge] ?? 'bg-gold-pale text-veda-bark'}`}>
                    {course.badge}
                  </span>
                )}
                <h1 id="course-title" className="font-display text-[1.9rem] font-bold leading-[1.1] text-veda-bark sm:text-[2.3rem] md:mt-3 lg:text-[2.6rem]">
                  {course.title}
                </h1>
                <p className="mt-2.5 max-w-lg text-[1rem] leading-snug text-veda-text sm:text-[1.08rem]">{detail.tagline}</p>

                {/* phones: rating + badge under the title */}
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 md:hidden">
                  <span className="inline-flex items-center gap-1.5 text-[0.95rem] text-veda-bark">
                    <Star size={20} className="fill-gold text-gold" aria-hidden />
                    <span className="font-semibold">{course.rating.toFixed(1)}</span>
                    <span className="text-veda-muted">({formatCount(detail.ratingCount)} reviews)</span>
                  </span>
                  {course.badge && (
                    <span className={`rounded-md px-3 py-1 text-[0.74rem] font-semibold ${BADGE_STYLE[course.badge] ?? 'bg-gold-pale text-veda-bark'}`}>{course.badge}</span>
                  )}
                </p>

                <ul className="mt-5 grid grid-cols-4 gap-2 border-y border-gold/20 py-4">
                  <Stat icon={<Clock size={26} strokeWidth={1.3} aria-hidden />} value={`${weeks} Weeks`} label="Duration" />
                  <Stat icon={<FileText size={26} strokeWidth={1.3} aria-hidden />} value={`${lessons} Lessons`} label="Video Content" />
                  <Stat icon={<ChartNoAxesColumn size={26} strokeWidth={1.3} aria-hidden />} value={course.level ?? 'All Levels'} label="Level" />
                  <Stat
                    className="md:hidden"
                    icon={<UsersRound size={26} strokeWidth={1.3} aria-hidden />}
                    value={`${formatCount(course.studentsCount)}+`}
                    label="Students"
                  />
                  <Stat
                    className="hidden md:flex"
                    icon={<Star size={26} strokeWidth={1.3} aria-hidden />}
                    value={`${course.rating.toFixed(1)} (${formatCount(detail.ratingCount)})`}
                    label="Ratings"
                  />
                </ul>

                <p className="mt-4 hidden text-[0.84rem] leading-relaxed text-veda-text md:block">{detail.about}</p>

                <ul className="mt-4 hidden flex-wrap gap-2 md:flex" aria-label="Topics">
                  {detail.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-gold/35 bg-cream px-3 py-1 text-[0.74rem] text-veda-text">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ===================== right column: buy box + extras ===================== */}
          <aside className="space-y-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <PurchaseCard course={course} inCart={inCart} onEnroll={enroll} onAddToCart={addToCart} />
            <div className="hidden lg:block">
              <IncludesCard course={{ ...course, lessons, weeks }} />
            </div>
            <div className="hidden lg:block">
              <AudienceCard items={detail.audience} />
            </div>
            {isDesktop && (
              <div id="instructor" className="scroll-mt-36">
                <InstructorCard name={instructorName} info={detail.instructor} />
              </div>
            )}
          </aside>

          {/* ===================== main content ===================== */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <div className="mb-5 lg:hidden">
              <PromoBand>{detail.bannerTitle}</PromoBand>
            </div>

            <CourseTabs sections={SECTIONS} />

            <div className="space-y-12 pt-8">
              <section id="overview" aria-labelledby="about-heading" className="scroll-mt-36">
                <h2 id="about-heading" className="font-display text-[1.5rem] font-semibold text-veda-bark sm:text-[1.7rem]">
                  About This Course
                </h2>
                <p className="mt-3 text-[0.96rem] leading-relaxed text-veda-text">{detail.about}</p>

                <Highlights items={detail.highlights} />

                <h3 className="mt-9 font-display text-[1.3rem] font-semibold text-veda-bark sm:text-[1.45rem]">What You Will Learn</h3>
                <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {detail.learn.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[0.9rem] leading-snug text-veda-text">
                      <CircleCheck size={18} className="mt-0.5 shrink-0 fill-veda-brown text-ivory" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 lg:hidden">
                  <AudienceCard items={detail.audience} />
                </div>
              </section>

              <section id="curriculum" aria-labelledby="curriculum-heading" className="scroll-mt-36">
                <Curriculum courseSlug={course.slug} modules={detail.curriculum} lessons={lessons} weeks={weeks} />
              </section>

              {!isDesktop && (
                <section id="instructor" aria-label="Instructor" className="scroll-mt-36">
                  <InstructorCard name={instructorName} info={detail.instructor} />
                </section>
              )}

              <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
                <Reviews reviews={detail.reviews} rating={course.rating} ratingCount={detail.ratingCount} />
              </section>

              <section id="faqs" aria-labelledby="faqs-heading" className="scroll-mt-36">
                <Faq items={detail.faqs} />
              </section>

              <div className="lg:hidden">
                <PromoBand>Not Just a Course, A Journey Within</PromoBand>
              </div>
            </div>
          </div>
        </div>

        <RelatedCourses courses={related} />

        <div className="pb-0">
          <MobileEnrollBar course={course} onEnroll={enroll} />
        </div>
        <div className="h-10 lg:h-14" aria-hidden />
      </div>

      <PreviewModal open={previewOpen} courseSlug={course.slug} title={course.title} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

export default function CourseDetail() {
  const { slug = '' } = useParams();
  // key = a fresh page (scroll, open sections, modal...) whenever another course is opened
  return <CourseDetailView key={slug} slug={slug} />;
}