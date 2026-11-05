import { ArrowUpRight, Clock, Flame, SearchX, Sparkles, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import CourseThumb from '@/components/cart/CourseThumb';
import { COURSE_TABS } from '@/constants/courseCatalog';
import type { Course } from '@/types';
import { formatPrice } from '@/utils/format';
import { highlightSegments } from '@/utils/search';

const GLASS = 'border border-white/70 bg-white/45 backdrop-blur-md shadow-[0_8px_30px_-14px_rgba(90,45,15,0.35)]';

const categoryLabel = (slug: string): string =>
  COURSE_TABS.find((t) => t.slug === slug)?.label ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Title with the typed words highlighted. */
function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSegments(text, query).map((seg, i) =>
        seg.hit ? (
          <mark key={i} className="rounded bg-gold/30 px-0.5 text-inherit">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function SectionTitle({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-veda-muted">
        <span className="text-saffron">{icon}</span>
        {children}
      </h3>
      {action}
    </div>
  );
}

interface RowProps {
  course: Course;
  index: number;
  query: string;
  active?: boolean;
  onPick: () => void;
}

function ResultRow({ course, index, query, active, onPick }: RowProps) {
  return (
    <Link
      id={`search-result-${index}`}
      to={`/courses/${course.slug}`}
      onClick={onPick}
      className={`group flex items-center gap-3 rounded-2xl p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white/70 ${GLASS} ${
        active ? '!border-gold/60 !bg-white/80 ring-2 ring-gold/30' : ''
      }`}
    >
      <CourseThumb course={course} index={index} className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[1.02rem] font-semibold text-veda-bark">
          <Highlight text={course.title} query={query} />
        </p>
        <p className="truncate text-xs text-veda-muted">
          {categoryLabel(course.category)}
          {course.instructor ? ` · ${course.instructor}` : ''}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-veda-text">
            <Star size={12} className="fill-gold text-gold" aria-hidden />
            {course.rating.toFixed(1)}
          </span>
          <span className="font-semibold text-veda-brown">{formatPrice(course.price)}</span>
        </p>
      </div>

      <ArrowUpRight size={18} className="shrink-0 text-veda-muted transition group-hover:text-saffron" aria-hidden />
    </Link>
  );
}

/** What's shown before anything is typed: recent, trending, suggested, topics. */
export function IdlePanel({
  recent,
  trending,
  suggested,
  onTerm,
  onClearRecent,
  onPick,
  onTopic,
}: {
  recent: string[];
  trending: string[];
  suggested: Course[];
  onTerm: (term: string) => void;
  onClearRecent: () => void;
  onPick: () => void;
  onTopic: () => void;
}) {
  return (
    <div className="space-y-7">
      {recent.length > 0 && (
        <section style={{ animationDelay: '120ms' }} className="animate-rise-in">
          <SectionTitle
            icon={<Clock size={14} aria-hidden />}
            action={
              <button type="button" onClick={onClearRecent} className="text-xs font-medium text-saffron hover:underline">
                Clear
              </button>
            }
          >
            Recent
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            {recent.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onTerm(term)}
                className={`rounded-full px-3.5 py-1.5 text-sm text-veda-text transition hover:bg-white/75 ${GLASS}`}
              >
                {term}
              </button>
            ))}
          </div>
        </section>
      )}

      <section style={{ animationDelay: '170ms' }} className="animate-rise-in">
        <SectionTitle icon={<Flame size={14} aria-hidden />}>Trending searches</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {trending.map((term, i) => (
            <li key={term}>
              <button
                type="button"
                onClick={() => onTerm(term)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition hover:-translate-y-0.5 hover:bg-white/75 ${GLASS}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-veda-brown">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-[0.95rem] font-medium text-veda-bark">{term}</span>
                <TrendingUp size={16} className="shrink-0 text-saffron/80" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ animationDelay: '220ms' }} className="animate-rise-in">
        <SectionTitle icon={<Sparkles size={14} aria-hidden />}>Suggested for you</SectionTitle>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {suggested.map((course, i) => (
            <ResultRow key={course.slug} course={course} index={i} query="" onPick={onPick} />
          ))}
        </div>
      </section>

      <section style={{ animationDelay: '270ms' }} className="animate-rise-in">
        <SectionTitle icon={<Sparkles size={14} aria-hidden />}>Browse by topic</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {COURSE_TABS.filter((t) => t.slug !== 'all').map((tab) => (
            <Link
              key={tab.slug}
              to={`/courses?category=${tab.slug}`}
              onClick={onTopic}
              className={`rounded-full px-3.5 py-1.5 text-sm text-veda-text transition hover:bg-white/75 hover:text-saffron ${GLASS}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Live results for what is typed. */
export function ResultsPanel({
  query,
  results,
  loading,
  activeIndex,
  trending,
  onTerm,
  onPick,
  onSeeAll,
}: {
  query: string;
  results: Course[] | null;
  loading: boolean;
  activeIndex: number;
  trending: string[];
  onTerm: (term: string) => void;
  onPick: () => void;
  onSeeAll: () => void;
}) {
  // first search: skeleton rows while waiting
  if (results === null) {
    return (
      <div className="space-y-2.5" aria-busy="true" aria-label="Searching">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flex animate-pulse items-center gap-3 rounded-2xl p-2.5 ${GLASS}`}>
            <div className="h-14 w-14 rounded-xl bg-gold/20" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 rounded bg-gold/20" />
              <div className="h-3 w-1/3 rounded bg-gold/15" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className={`flex flex-col items-center rounded-3xl px-6 py-10 text-center ${GLASS}`}>
          <SearchX size={34} strokeWidth={1.3} className="text-saffron" aria-hidden />
          <h3 className="mt-3 font-display text-xl font-semibold text-veda-bark">
            {loading ? 'Searching…' : `No courses found for “${query}”`}
          </h3>
          <p className="mt-1 text-sm text-veda-muted">Check the spelling or try one of these popular topics.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {trending.slice(0, 5).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onTerm(term)}
                className="rounded-full bg-veda-brown px-3.5 py-1.5 text-sm text-ivory transition hover:bg-veda-bark"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`animate-fade-in transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
      <p className="mb-2.5 text-xs font-medium text-veda-muted" aria-live="polite">
        {results.length} {results.length === 1 ? 'result' : 'results'} for “{query}”
      </p>

      <div className="space-y-2.5">
        {results.map((course, i) => (
          <ResultRow key={course.slug} course={course} index={i} query={query} active={i === activeIndex} onPick={onPick} />
        ))}
      </div>

      <Link
        to={`/courses?q=${encodeURIComponent(query)}`}
        onClick={onSeeAll}
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-veda-brown/90 px-4 py-3 text-sm font-medium text-ivory transition hover:bg-veda-bark"
      >
        See all results for “{query}”
        <ArrowUpRight size={16} aria-hidden />
      </Link>
    </div>
  );
}