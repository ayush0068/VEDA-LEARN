import { Ban, BookOpen, ChevronLeft, ChevronRight, CircleCheck, EyeOff, Plus, RefreshCw, Search, Star, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import CourseCard from '@/components/courses/CourseCard';
import CourseFormDrawer from '@/components/courses/CourseFormDrawer';
import ConfirmDialog from '@/components/students/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { useDebounced } from '@/hooks/useDebounced';
import { deleteCourse, getCourseOptions, listCourses, updateCourse } from '@/services/courses.service';
import type { AdminCourse, CourseList, CourseOptions, CourseSortKey, CourseStatusFilter } from '@/types/course';

const PAGE_SIZE = 9;

const SORTS: { value: CourseSortKey; label: string }[] = [
  { value: 'order', label: 'Website order' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Name A–Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export default function Courses({ startWithAdd = false }: { startWithAdd?: boolean }) {
  const toast = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 350);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<CourseStatusFilter>('all');
  const [sort, setSort] = useState<CourseSortKey>('order');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<CourseList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const [options, setOptions] = useState<CourseOptions | null>(null);
  // null = closed, 'new' = add, otherwise the slug being edited
  const [editing, setEditing] = useState<string | null>(startWithAdd ? 'new' : null);
  const [deleting, setDeleting] = useState<AdminCourse | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    getCourseOptions()
      .then(setOptions)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Could not load categories'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');

    listCourses({ q, category, status, sort, page, limit: PAGE_SIZE })
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        if (result.pagination.page !== page) setPage(result.pagination.page);
      })
      .catch((err: unknown) => {
        if (id === requestId.current) setError(err instanceof Error ? err.message : 'Could not load courses');
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [q, category, status, sort, page, reloadKey]);

  const courses = data?.courses ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;
  const filtering = Boolean(q) || Boolean(category) || status !== 'all';
  const labelOf = (slug: string) => options?.categories.find((c) => c.value === slug)?.label ?? slug;

  const pickStatus = (next: CourseStatusFilter) => {
    setStatus((cur) => (cur === next ? 'all' : next));
    setPage(1);
  };

  const clearFilters = () => {
    setStatus('all');
    setCategory('');
    setSearch('');
    setPage(1);
  };

  const closeForm = () => {
    setEditing(null);
    if (startWithAdd) navigate('/courses', { replace: true });
  };

  const saved = (message: string) => {
    closeForm();
    toast.success(message);
    reload();
  };

  const toggle = async (c: AdminCourse) => {
    try {
      await updateCourse(c.slug, { isActive: !c.isActive });
      toast.success(c.isActive ? `“${c.title}” is hidden from the website` : `“${c.title}” is visible on the website`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the course');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await deleteCourse(deleting.slug);
    toast.success(`“${deleting.title}” was deleted`);
    setDeleting(null);
    reload();
  };

  const actions = { onEdit: (c: AdminCourse) => setEditing(c.slug), onToggle: toggle, onDelete: (c: AdminCourse) => setDeleting(c) };

  const firstItem = pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const lastItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">Courses</h1>
          <p className="text-[0.88rem] text-veda-muted">Add and edit courses: pictures, video, price, discount and the course page. Changes go live on the website instantly.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button type="button" onClick={reload} disabled={loading} aria-label="Refresh" className={`${btnSecondary} !px-3`}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden />
          </button>
          <button type="button" onClick={() => setEditing('new')} className={`${btnPrimary} flex-1 sm:flex-none`}>
            <Plus size={17} aria-hidden /> Add Course
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Total courses" value={stats?.total} selected={status === 'all'} onClick={() => pickStatus('all')} />
        <StatCard icon={CircleCheck} label="Visible" hint="Shown on the website" value={stats?.active} selected={status === 'active'} onClick={() => pickStatus('active')} />
        <StatCard icon={EyeOff} label="Hidden" value={stats?.hidden} selected={status === 'hidden'} onClick={() => pickStatus('hidden')} />
        <StatCard icon={Star} label="On homepage" hint="Popular Courses" value={stats?.popular} selected={status === 'popular'} onClick={() => pickStatus('popular')} />
      </div>

      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search course, instructor or description…"
              aria-label="Search courses"
              className={`${inputClass} pl-10 pr-9`}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-veda-muted hover:bg-cream hover:text-veda-bark">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:flex">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
              className={`${inputClass} cursor-pointer lg:w-52`}
            >
              <option value="">All categories</option>
              {(options?.categories ?? []).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as CourseSortKey);
                setPage(1);
              }}
              aria-label="Sort courses"
              className={`${inputClass} cursor-pointer lg:w-48`}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtering && (
          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-veda-muted">
            Showing
            {status !== 'all' && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">{status === 'popular' ? 'on homepage' : status}</span>}
            {category && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">{labelOf(category)}</span>}
            {q && <span className="rounded-full bg-peach px-2.5 py-0.5 font-semibold text-veda-bark">“{q}”</span>}
            <button type="button" onClick={clearFilters} className="font-semibold text-saffron hover:underline">
              Clear filters
            </button>
          </p>
        )}

        <div className={`mt-3 transition-opacity duration-200 ${loading && data ? 'opacity-60' : 'opacity-100'}`} aria-busy={loading}>
          {error && !data ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <Ban size={32} strokeWidth={1.4} className="text-saffron" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold text-veda-bark">Could not load courses</p>
              <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{error}</p>
              <button type="button" onClick={reload} className={`${btnSecondary} mt-4`}>
                <RefreshCw size={15} aria-hidden /> Try again
              </button>
            </div>
          ) : !data ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading courses">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-gold/10" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <BookOpen size={34} strokeWidth={1.3} className="text-saffron" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold text-veda-bark">{filtering ? 'No courses match your search' : 'No courses yet'}</p>
              <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{filtering ? 'Try a different word or filter.' : 'Add your first course. It appears on the website as soon as you save it.'}</p>
              {!filtering && (
                <button type="button" onClick={() => setEditing('new')} className={`${btnPrimary} mt-4`}>
                  <Plus size={16} aria-hidden /> Add Course
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c.slug} course={c} categoryLabel={labelOf(c.category)} actions={actions} />
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.total > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-3 text-[0.8rem] text-veda-muted">
            <p>
              Showing <b className="text-veda-bark">{firstItem}–{lastItem}</b> of <b className="text-veda-bark">{pagination.total}</b>
            </p>
            <div className="flex items-center gap-2">
              {loading && <Spinner className="h-4 w-4 text-saffron" />}
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1 || loading} aria-label="Previous page" className={`${btnSecondary} !p-2`}>
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[5.5rem] text-center">
                Page <b className="text-veda-bark">{pagination.page}</b> of {pagination.pages}
              </span>
              <button type="button" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages || loading} aria-label="Next page" className={`${btnSecondary} !p-2`}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <CourseFormDrawer target={editing} options={options} onClose={closeForm} onSaved={saved} />

      <ConfirmDialog open={deleting !== null} title="Delete this course?" confirmLabel="Delete permanently" danger onClose={() => setDeleting(null)} onConfirm={confirmDelete}>
        <p>
          <b>{deleting?.title}</b> and its page content will be removed permanently, including the uploaded picture, video and PDF. It also disappears from carts and instructor assignments.
        </p>
        <p className="flex items-start gap-2 text-[0.8rem] text-veda-muted">
          <CircleCheck size={15} className="mt-0.5 shrink-0 text-ok" aria-hidden /> To only remove it from the website for now, use “Hide from website” instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}