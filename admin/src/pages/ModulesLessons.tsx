import { BookOpen, Layers, Library, ListVideo, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { Spinner, btnSecondary, inputClass } from '@/components/common/ui';
import CourseImage from '@/components/courses/CourseImage';
import CurriculumEditor from '@/components/curriculum/CurriculumEditor';
import { formatMinutes } from '@/components/curriculum/curriculumUtils';
import { listCurriculumCourses } from '@/services/curriculum.service';
import type { CurriculumCourseList } from '@/types/curriculum';

/** /modules-lessons = pick a course; /modules-lessons/:slug = edit that course's curriculum */
export default function ModulesLessons() {
  const { slug } = useParams();
  return slug ? <CurriculumEditor key={slug} slug={slug} /> : <CoursePicker />;
}

function CoursePicker() {
  const [data, setData] = useState<CurriculumCourseList | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const load = () => {
    setError('');
    listCurriculumCourses()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load courses'));
  };
  useEffect(load, []);

  const courses = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.courses ?? []).filter((c) => !term || `${c.title} ${c.category} ${c.instructor}`.toLowerCase().includes(term));
  }, [data, q]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <header>
        <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">Modules &amp; Lessons</h1>
        <p className="text-[0.88rem] text-veda-muted">Choose a course to build its curriculum. Published lessons update the course page on the website automatically.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Courses" value={data?.stats.courses} />
        <StatCard icon={Library} label="With curriculum" value={data?.stats.withContent} />
        <StatCard icon={Layers} label="Modules" value={data?.stats.modules} />
        <StatCard icon={ListVideo} label="Lessons" value={data?.stats.lessons} />
      </div>

      <Card className="p-3.5 sm:p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" aria-label="Search courses" className={`${inputClass} !pl-10`} />
        </div>
      </Card>

      {error ? (
        <Card className="p-6 text-center">
          <p role="alert" className="text-[0.9rem] text-red-700">
            {error}
          </p>
          <button type="button" onClick={load} className={`${btnSecondary} mt-3`}>
            Try again
          </button>
        </Card>
      ) : !data ? (
        <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted">
          <Spinner /> Loading courses…
        </Card>
      ) : courses.length === 0 ? (
        <Card className="p-10 text-center text-[0.9rem] text-veda-muted">{data.courses.length === 0 ? 'No courses yet. Create a course first, then add its modules here.' : 'No course matches your search.'}</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.slug} to={`/modules-lessons/${encodeURIComponent(c.slug)}`} className="group block rounded-2xl border border-line bg-card/90 shadow-card transition hover:-translate-y-0.5 hover:border-gold/70">
              <div className="flex gap-3 p-3.5">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-cream">
                  <CourseImage
                    value={c.image}
                    className="h-full w-full object-cover"
                    fallback={
                      <span className="flex h-full w-full items-center justify-center text-saffron">
                        <BookOpen size={26} strokeWidth={1.4} aria-hidden />
                      </span>
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-display text-[1rem] font-bold leading-snug text-veda-bark">{c.title}</h3>
                  <p className="truncate text-[0.76rem] text-veda-muted">{[c.category, c.instructor].filter(Boolean).join(' · ')}</p>
                  {!c.isActive && <span className="mt-1 inline-block rounded-full bg-cream px-2 py-0.5 text-[0.66rem] font-bold uppercase text-veda-muted">Inactive</span>}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-line/70 px-3.5 py-2.5 text-[0.78rem] text-veda-muted">
                <span>
                  <strong className="text-veda-bark">{c.modules}</strong> modules · <strong className="text-veda-bark">{c.lessons}</strong> lessons
                  {c.minutes > 0 && ` · ${formatMinutes(c.minutes)}`}
                </span>
                <span className="font-semibold text-saffron group-hover:underline">{c.modules ? 'Manage' : 'Start'} →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}