import { ArrowLeft, BadgeCheck, CalendarClock, ChevronDown, Download, ExternalLink, FileText, Pencil, RotateCcw, UserX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Card';
import StatCard from '@/components/common/StatCard';
import { Avatar, Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import AssignmentDrawer from '@/components/assessments/AssignmentDrawer';
import { StatusBadge, dueText } from '@/components/assessments/assessUtils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as api from '@/services/assessments.service';
import type { AssignmentFull, CourseOption, SubmissionList, SubmissionRow } from '@/types/assessments';
import { timeAgo } from '@/utils/format';

type Filter = 'all' | 'submitted' | 'graded' | 'returned';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'To grade' },
  { value: 'graded', label: 'Graded' },
  { value: 'returned', label: 'Returned' },
];

const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function GradeForm({ sub, max, canEdit, onDone }: { sub: SubmissionRow; max: number; canEdit: boolean; onDone: () => void }) {
  const toast = useToast();
  const [grade, setGrade] = useState(sub.grade == null ? '' : String(sub.grade));
  const [feedback, setFeedback] = useState(sub.feedback);
  const [busy, setBusy] = useState<'' | 'graded' | 'returned'>('');
  const [error, setError] = useState('');

  const go = async (status: 'graded' | 'returned') => {
    setError('');
    setBusy(status);
    try {
      await api.gradeSubmission(sub.id, { grade: status === 'graded' ? Number(grade) : null, feedback, status });
      toast.success(status === 'graded' ? `Graded ${sub.student}` : `Returned to ${sub.student} for changes`);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy('');
    }
  };

  return (
    <fieldset disabled={!canEdit || Boolean(busy)} className="space-y-3 rounded-xl border border-line bg-white/60 p-3.5">
      <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Marks (out of {max})</span>
          <input type="number" min={0} max={max} step="0.5" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Feedback</span>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} maxLength={3000} placeholder="What went well? What can be better?" className={inputClass} />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-[0.8rem] text-red-700">
          {error}
        </p>
      )}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => go('graded')} className={btnPrimary}>
            {busy === 'graded' ? <Spinner /> : <BadgeCheck size={16} aria-hidden />} {sub.status === 'graded' ? 'Update grade' : 'Save grade'}
          </button>
          <button type="button" onClick={() => go('returned')} className={btnSecondary}>
            {busy === 'returned' ? <Spinner /> : <RotateCcw size={15} aria-hidden />} Ask to redo
          </button>
        </div>
      )}
    </fieldset>
  );
}

export default function AssignmentSubmissions() {
  const { id = '' } = useParams();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can('assessments', 'edit');
  const [data, setData] = useState<SubmissionList | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<AssignmentFull | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const load = useCallback(async () => {
    try {
      setData(await api.listSubmissions(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load');
    }
  }, [id]);
  useEffect(() => {
    load();
    api.listCourses().then(setCourses).catch(() => undefined);
  }, [load]);

  if (error)
    return (
      <Card className="p-8 text-center">
        <p role="alert" className="text-red-700">
          {error}
        </p>
        <Link to="/quizzes-assignments?tab=assignments" className={`${btnSecondary} mt-4`}>
          Back
        </Link>
      </Card>
    );
  if (!data)
    return (
      <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted">
        <Spinner /> Loading hand-ins…
      </Card>
    );

  const { assignment: a, summary } = data;
  const rows = data.submissions.filter((s) => filter === 'all' || s.status === filter);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <Link to="/quizzes-assignments?tab=assignments" className="inline-flex items-center gap-1.5 text-[0.84rem] font-medium text-veda-muted hover:text-saffron">
        <ArrowLeft size={15} aria-hidden /> Quizzes &amp; Assignments
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <StatusBadge status={a.status} />
            <span className="text-[0.78rem] text-veda-muted">{a.courseTitle}</span>
          </div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">{a.title}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[0.86rem] text-veda-muted">
            <CalendarClock size={14} aria-hidden /> Due {dueText(a.dueAt)} · {a.maxPoints} marks
          </p>
        </div>
        <button type="button" onClick={() => setDrawer(a)} className={btnSecondary}>
          <Pencil size={15} aria-hidden /> {canEdit ? 'Edit assignment' : 'View details'}
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={FileText} label="Handed in" value={summary.submitted} hint={`of ${summary.enrolled} enrolled`} />
        <StatCard icon={BadgeCheck} label="To grade" value={summary.pending} selected={filter === 'submitted'} onClick={() => setFilter(filter === 'submitted' ? 'all' : 'submitted')} />
        <StatCard icon={BadgeCheck} label="Graded" value={summary.graded} hint={summary.graded ? `avg ${summary.avgGrade}/${a.maxPoints}` : undefined} selected={filter === 'graded'} onClick={() => setFilter(filter === 'graded' ? 'all' : 'graded')} />
        <StatCard icon={UserX} label="Late" value={summary.late} />
      </div>

      <Card className="p-3.5 sm:p-4">
        <div role="tablist" aria-label="Filter hand-ins" className="mb-3 inline-flex flex-wrap rounded-xl bg-cream p-1">
          {FILTERS.map((f) => (
            <button key={f.value} role="tab" aria-selected={filter === f.value} type="button" onClick={() => setFilter(f.value)} className={`rounded-lg px-3.5 py-1.5 text-[0.82rem] font-semibold transition ${filter === f.value ? 'bg-white text-veda-bark shadow-sm' : 'text-veda-muted hover:text-veda-bark'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-[0.88rem] text-veda-muted">{data.submissions.length ? 'Nothing in this filter.' : 'No hand-ins yet.'}</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((s) => (
              <li key={s.id} className="animate-rise-in overflow-hidden rounded-2xl border border-line bg-white/50">
                <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id} className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-cream/60">
                  <Avatar name={s.student} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9rem] font-semibold text-veda-bark">{s.student}</span>
                    <span className="block truncate text-[0.74rem] text-veda-muted">
                      {timeAgo(s.submittedAt)}
                      {s.version > 1 && ` · version ${s.version}`}
                    </span>
                  </span>
                  {s.late && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.64rem] font-bold uppercase text-red-700">Late</span>}
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${s.status === 'graded' ? 'bg-ok/15 text-ok' : s.status === 'returned' ? 'bg-[#eadfd0] text-[#8a6f55]' : 'bg-peach text-saffron'}`}>
                    {s.status === 'graded' ? `${s.grade}/${a.maxPoints}` : s.status === 'returned' ? 'Returned' : 'To grade'}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-veda-muted transition-transform ${open === s.id ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {open === s.id && (
                  <div className="animate-fade-in space-y-3 border-t border-line/70 p-3.5">
                    {s.text && <p className="whitespace-pre-wrap rounded-xl bg-cream/50 p-3 text-[0.88rem] leading-relaxed text-veda-text">{s.text}</p>}
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-saffron hover:underline">
                        <ExternalLink size={14} aria-hidden /> {s.link}
                      </a>
                    )}
                    {s.files.length > 0 && (
                      <ul className="space-y-1.5">
                        {s.files.map((f) => (
                          <li key={f.url}>
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line bg-white/70 px-3 py-1.5 text-[0.82rem] font-medium text-veda-bark hover:border-gold">
                              <Download size={14} aria-hidden /> {f.name} <span className="text-veda-muted">{size(f.size)}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!s.text && !s.link && !s.files.length && <p className="text-[0.85rem] text-veda-muted">Empty hand-in.</p>}
                    <GradeForm key={`${s.id}-${s.status}-${s.version}`} sub={s} max={a.maxPoints} canEdit={canEdit} onDone={load} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data.notSubmitted.length > 0 && (
        <Card className="p-4">
          <CardHeader icon={UserX} title={`Not handed in (${data.notSubmitted.length})`} />
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.notSubmitted.map((n) => (
              <li key={n.studentId} className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 py-1 pl-1 pr-3 text-[0.8rem] text-veda-bark" title={n.email}>
                <Avatar name={n.student} className="h-6 w-6 text-[0.6rem]" /> {n.student}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AssignmentDrawer
        target={drawer}
        courses={courses}
        readOnly={!canEdit}
        onClose={() => setDrawer(null)}
        onSave={async (input) => {
          await api.updateAssignment(id, input);
          toast.success('Assignment saved');
          setDrawer(null);
          await load();
        }}
      />
    </div>
  );
}