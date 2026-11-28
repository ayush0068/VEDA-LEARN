import { Archive, BadgeCheck, BarChart3, ClipboardCheck, ClipboardList, Clock, Copy, Eye, EyeOff, FileQuestion, HelpCircle, Inbox, Pencil, Plus, Search, Target, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import AssignmentDrawer from '@/components/assessments/AssignmentDrawer';
import { GrowBar, StatusBadge, dueText } from '@/components/assessments/assessUtils';
import ConfirmDialog from '@/components/students/ConfirmDialog';
import RowMenu from '@/components/students/RowMenu';
import type { MenuItem } from '@/components/students/RowMenu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useDebounced } from '@/hooks/useDebounced';
import * as api from '@/services/assessments.service';
import type { AssessStatus, AssignmentFull, AssignmentRow, CourseOption, Overview, QuizRow } from '@/types/assessments';
import { timeAgo } from '@/utils/format';

type Tab = 'quizzes' | 'assignments';

export default function QuizzesAssignments() {
  const toast = useToast();
  const nav = useNavigate();
  const { can } = useAuth();
  const canEdit = can('assessments', 'edit');
  const canDelete = can('assessments', 'full');
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'assignments' ? 'assignments' : 'quizzes';

  const [overview, setOverview] = useState<Overview | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[] | null>(null);
  const [error, setError] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);

  const [drawer, setDrawer] = useState<'new' | AssignmentFull | null>(null);
  const [del, setDel] = useState<{ kind: Tab; id: string; title: string } | null>(null);

  const load = useCallback(async () => {
    setError('');
    const filters = { courseSlug: course, status, q: dq };
    try {
      const [o, qs, as] = await Promise.all([api.getOverview(), api.listQuizzes(filters), api.listAssignments(filters)]);
      setOverview(o);
      setQuizzes(qs);
      setAssignments(as);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load');
    }
  }, [course, status, dq]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api.listCourses().then(setCourses).catch(() => undefined);
  }, []);

  const setTab = (t: Tab) => setParams(t === 'quizzes' ? {} : { tab: t }, { replace: true });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const quizMenu = (x: QuizRow): MenuItem[] => {
    if (!canEdit) return [];
    const items: MenuItem[] = [
      { label: 'Duplicate', icon: Copy, onClick: () => run(() => api.duplicateQuiz(x.id), 'Quiz duplicated as a draft') },
      x.status === 'published' ? { label: 'Unpublish (make draft)', icon: EyeOff, onClick: () => run(() => api.updateQuiz(x.id, { status: 'draft' }), 'Quiz is now a draft') } : { label: 'Publish', icon: Eye, onClick: () => run(() => api.updateQuiz(x.id, { status: 'published' }), 'Quiz published') },
    ];
    if (x.status !== 'archived') items.push({ label: 'Archive', icon: Archive, onClick: () => run(() => api.updateQuiz(x.id, { status: 'archived' }), 'Quiz archived') });
    if (canDelete) items.push({ label: 'Delete', icon: Trash2, danger: true, onClick: () => setDel({ kind: 'quizzes', id: x.id, title: x.title }) });
    return items;
  };

  const assignmentMenu = (x: AssignmentRow): MenuItem[] => {
    if (!canEdit) return [];
    const setStatusTo = (s: AssessStatus, msg: string) => run(() => api.updateAssignment(x.id, { status: s }), msg);
    const items: MenuItem[] = [
      { label: 'Duplicate', icon: Copy, onClick: () => run(() => api.duplicateAssignment(x.id), 'Assignment duplicated as a draft') },
      x.status === 'published' ? { label: 'Unpublish (make draft)', icon: EyeOff, onClick: () => setStatusTo('draft', 'Assignment is now a draft') } : { label: 'Publish', icon: Eye, onClick: () => setStatusTo('published', 'Assignment published') },
    ];
    if (x.status !== 'archived') items.push({ label: 'Archive', icon: Archive, onClick: () => setStatusTo('archived', 'Assignment archived') });
    if (canDelete) items.push({ label: 'Delete', icon: Trash2, danger: true, onClick: () => setDel({ kind: 'assignments', id: x.id, title: x.title }) });
    return items;
  };

  const list = tab === 'quizzes' ? quizzes : assignments;
  const filtered = Boolean(course || status || dq);
  const courseForNew = course || courses[0]?.slug || '';

  const saveAssignment = async (input: Parameters<typeof api.createAssignment>[0]) => {
    if (drawer === 'new') await api.createAssignment(input);
    else if (drawer) await api.updateAssignment(drawer.id, input);
    toast.success(drawer === 'new' ? 'Assignment created' : 'Assignment saved');
    setDrawer(null);
    await load();
  };

  const openEdit = async (id: string) => {
    try {
      setDrawer(await api.getAssignment(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open');
    }
  };

  const pending = useMemo(() => overview?.needsGrading ?? 0, [overview]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">Quizzes &amp; Assignments</h1>
          <p className="text-[0.88rem] text-veda-muted">Test what students learnt, set work, and give feedback — all in one place.</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => nav(`/quizzes-assignments/quiz/new${course ? `?course=${encodeURIComponent(course)}` : ''}`)} className={btnPrimary}>
              <Plus size={16} aria-hidden /> New quiz
            </button>
            <button type="button" onClick={() => setDrawer('new')} className={btnSecondary}>
              <Plus size={16} aria-hidden /> New assignment
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={FileQuestion} label="Quizzes" value={overview?.quizzes.total} hint={overview ? `${overview.quizzes.published} published` : undefined} selected={tab === 'quizzes'} onClick={() => setTab('quizzes')} />
        <StatCard icon={ClipboardList} label="Assignments" value={overview?.assignments.total} hint={overview ? `${overview.assignments.published} published` : undefined} selected={tab === 'assignments'} onClick={() => setTab('assignments')} />
        <StatCard icon={Target} label="Average quiz score" value={overview?.attempts.avgPercent} hint={overview ? `${overview.attempts.total} attempts · ${overview.attempts.passRate}% pass` : undefined} />
        <StatCard icon={Inbox} label="Waiting for grading" value={overview?.needsGrading} hint="hand-ins to review" onClick={() => setTab('assignments')} />
      </div>

      {pending > 0 && overview && tab === 'assignments' && (
        <Card className="animate-rise-in p-3.5 sm:p-4">
          <h2 className="mb-2 flex items-center gap-2 font-display text-[1.05rem] font-bold text-veda-bark">
            <BadgeCheck size={18} className="text-saffron" aria-hidden /> Latest hand-ins to review
          </h2>
          <ul className="divide-y divide-line/70">
            {overview.recentSubmissions.map((s) => (
              <li key={s.id}>
                <Link to={`/quizzes-assignments/assignment/${s.assignmentId}`} className="flex items-center justify-between gap-3 py-2 text-[0.85rem] hover:text-saffron">
                  <span className="min-w-0 truncate">
                    <strong className="font-semibold text-veda-bark">{s.student}</strong> · {s.assignmentTitle}
                  </span>
                  <span className="shrink-0 text-[0.75rem] text-veda-muted">
                    {s.late && <span className="mr-2 rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-red-700">Late</span>}
                    {timeAgo(s.submittedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-3.5 sm:p-4">
        <div role="tablist" aria-label="Type" className="mb-3 inline-flex rounded-xl bg-cream p-1">
          {(['quizzes', 'assignments'] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-[0.84rem] font-semibold capitalize transition ${tab === t ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted hover:text-veda-bark'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-[1fr_14rem_10rem]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-veda-muted" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}…`} aria-label={`Search ${tab}`} className={`${inputClass} !pl-10`} />
          </div>
          <select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Filter by course" className={inputClass}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className={inputClass}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
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
      ) : !list ? (
        <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted">
          <Spinner /> Loading…
        </Card>
      ) : list.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-peach text-saffron">{tab === 'quizzes' ? <HelpCircle size={26} /> : <ClipboardCheck size={26} />}</span>
          <p className="font-display text-[1.2rem] font-bold text-veda-bark">{filtered ? `No ${tab} match your filters` : `No ${tab} yet`}</p>
          <p className="max-w-sm text-[0.88rem] text-veda-muted">{filtered ? 'Try another course, status or search.' : tab === 'quizzes' ? 'Create your first quiz — add questions, a timer and a pass mark.' : 'Create your first assignment and set a due date.'}</p>
          {canEdit && !filtered && (
            <button type="button" className={`${btnPrimary} mt-2`} onClick={() => (tab === 'quizzes' ? nav(`/quizzes-assignments/quiz/new`) : setDrawer('new'))}>
              <Plus size={16} /> {tab === 'quizzes' ? 'Create a quiz' : 'Create an assignment'}
            </button>
          )}
        </Card>
      ) : tab === 'quizzes' ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {(list as QuizRow[]).map((x, i) => (
            <article key={x.id} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }} className="group animate-rise-in rounded-2xl border border-line bg-card/90 p-4 shadow-card transition hover:-translate-y-0.5 hover:border-gold/70">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge status={x.status} />
                    <span className="truncate text-[0.72rem] text-veda-muted">{x.courseTitle}</span>
                  </div>
                  <Link to={`/quizzes-assignments/quiz/${x.id}`} className="block font-display text-[1.1rem] font-bold leading-snug text-veda-bark hover:text-saffron">
                    {x.title}
                  </Link>
                </div>
                {quizMenu(x).length > 0 && <RowMenu items={quizMenu(x)} label={`Actions for ${x.title}`} />}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-veda-muted">
                <span>{x.questionCount} questions</span>
                <span>{x.totalPoints} marks</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden /> {x.timeLimitMin ? `${x.timeLimitMin} min` : 'No time limit'}
                </span>
                <span>Pass {x.passPercent}%</span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[0.76rem]">
                  <span className="text-veda-muted">
                    <Users size={12} className="mr-1 inline" aria-hidden />
                    {x.students} students · {x.attempts} attempts
                  </span>
                  <span className="font-semibold text-veda-bark">{x.attempts ? `${x.avgPercent}% avg · ${x.passRate}% pass` : 'No attempts'}</span>
                </div>
                <GrowBar percent={x.attempts ? x.avgPercent : 0} delay={i * 40} />
              </div>
              <div className="mt-3.5 flex gap-2">
                <Link to={`/quizzes-assignments/quiz/${x.id}`} className={`${btnSecondary} !px-3 !py-1.5 !text-[0.8rem]`}>
                  <Pencil size={14} aria-hidden /> {canEdit ? 'Edit' : 'View'}
                </Link>
                <Link to={`/quizzes-assignments/quiz/${x.id}/results`} className={`${btnSecondary} !px-3 !py-1.5 !text-[0.8rem]`}>
                  <BarChart3 size={14} aria-hidden /> Results
                </Link>
              </div>
              <p className="mt-2.5 text-[0.7rem] text-veda-muted">Updated {timeAgo(x.updatedAt)}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {(list as AssignmentRow[]).map((x, i) => {
            const overdue = x.dueAt && new Date(x.dueAt) < new Date();
            return (
              <article key={x.id} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }} className="animate-rise-in rounded-2xl border border-line bg-card/90 p-4 shadow-card transition hover:-translate-y-0.5 hover:border-gold/70">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge status={x.status} />
                      <span className="truncate text-[0.72rem] text-veda-muted">{x.courseTitle}</span>
                    </div>
                    <Link to={`/quizzes-assignments/assignment/${x.id}`} className="block font-display text-[1.1rem] font-bold leading-snug text-veda-bark hover:text-saffron">
                      {x.title}
                    </Link>
                  </div>
                  {assignmentMenu(x).length > 0 && <RowMenu items={assignmentMenu(x)} label={`Actions for ${x.title}`} />}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-veda-muted">
                  <span className={`inline-flex items-center gap-1 ${overdue ? 'font-semibold text-red-700' : ''}`}>
                    <Clock size={12} aria-hidden /> {overdue ? 'Was due ' : 'Due '}
                    {dueText(x.dueAt)}
                  </span>
                  <span>{x.maxPoints} marks</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Handed in', x.submitted],
                    ['To grade', x.pending],
                    ['Graded', x.graded],
                  ].map(([label, n]) => (
                    <div key={label as string} className={`rounded-xl px-2 py-2 ${label === 'To grade' && (n as number) > 0 ? 'bg-peach' : 'bg-cream/70'}`}>
                      <div className="font-display text-[1.2rem] font-bold leading-none text-veda-bark">{n}</div>
                      <div className="mt-1 text-[0.68rem] text-veda-muted">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3.5 flex gap-2">
                  <Link to={`/quizzes-assignments/assignment/${x.id}`} className={`${btnPrimary} !px-3 !py-1.5 !text-[0.8rem]`}>
                    <BadgeCheck size={14} aria-hidden /> Review &amp; grade
                  </Link>
                  <button type="button" onClick={() => openEdit(x.id)} className={`${btnSecondary} !px-3 !py-1.5 !text-[0.8rem]`}>
                    <Pencil size={14} aria-hidden /> {canEdit ? 'Edit' : 'View'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AssignmentDrawer target={drawer} courses={courses} defaultCourse={courseForNew} readOnly={!canEdit} onClose={() => setDrawer(null)} onSave={saveAssignment} />

      <ConfirmDialog
        open={Boolean(del)}
        title={del?.kind === 'quizzes' ? 'Delete this quiz?' : 'Delete this assignment?'}
        confirmLabel="Delete"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          if (del.kind === 'quizzes') await api.deleteQuiz(del.id);
          else await api.deleteAssignment(del.id);
          toast.success('Deleted');
          setDel(null);
          await load();
        }}
      >
        <p className="text-[0.9rem] text-veda-text">
          “{del?.title}” and {del?.kind === 'quizzes' ? 'every student attempt' : 'every hand-in and grade'} will be removed for good. To keep the records, archive it instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}