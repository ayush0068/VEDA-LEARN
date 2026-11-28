import { ArrowLeft, BarChart3, Plus, Save, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import Field from '@/components/courses/Field';
import QuestionEditor from '@/components/assessments/QuestionEditor';
import { QUESTION_TYPES, StatusBadge, blankQuestion, fromLocalInput, newKey, toLocalInput } from '@/components/assessments/assessUtils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as api from '@/services/assessments.service';
import type { AssessStatus, CourseOption, QuestionDraft, QuizFull, QuizInput, ShowAnswers } from '@/types/assessments';

interface Form {
  courseSlug: string;
  title: string;
  description: string;
  status: AssessStatus;
  timeLimitMin: number;
  passPercent: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswers: ShowAnswers;
  from: string;
  until: string;
  questions: QuestionDraft[];
}

const toForm = (quiz: QuizFull | null, course: string): Form => ({
  courseSlug: quiz?.courseSlug ?? course,
  title: quiz?.title ?? '',
  description: quiz?.description ?? '',
  status: quiz?.status ?? 'draft',
  timeLimitMin: quiz?.timeLimitMin ?? 0,
  passPercent: quiz?.passPercent ?? 60,
  maxAttempts: quiz?.maxAttempts ?? 0,
  shuffleQuestions: quiz?.shuffleQuestions ?? false,
  shuffleOptions: quiz?.shuffleOptions ?? false,
  showAnswers: quiz?.showAnswers ?? 'after_submit',
  from: toLocalInput(quiz?.availableFrom ?? null),
  until: toLocalInput(quiz?.availableUntil ?? null),
  questions: (quiz?.questions ?? []).map((q) => ({ ...q, key: newKey() })),
});

export default function QuizBuilder() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const [search] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const readOnly = !can('assessments', 'edit');

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const listEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listCourses().then(setCourses).catch(() => undefined);
  }, []);

  useEffect(() => {
    let live = true;
    setLoadError('');
    if (isNew) {
      const f = toForm(null, search.get('course') ?? '');
      setForm(f);
      setSaved(JSON.stringify(f, (k, v) => (k === 'key' ? undefined : v)));
      return;
    }
    api
      .getQuiz(id)
      .then((quiz) => {
        if (!live) return;
        const f = toForm(quiz, '');
        setForm(f);
        setSaved(JSON.stringify(f, (k, v) => (k === 'key' ? undefined : v)));
      })
      .catch((err: unknown) => live && setLoadError(err instanceof Error ? err.message : 'Could not load the quiz'));
    return () => {
      live = false;
    };
  }, [id, isNew, search]);

  useEffect(() => {
    if (isNew && form && !form.courseSlug && courses[0]) setForm({ ...form, courseSlug: courses[0].slug });
  }, [courses, form, isNew]);

  const dirty = useMemo(() => Boolean(form) && JSON.stringify(form, (k, v) => (k === 'key' ? undefined : v)) !== saved, [form, saved]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loadError)
    return (
      <Card className="p-8 text-center">
        <p role="alert" className="text-red-700">
          {loadError}
        </p>
        <Link to="/quizzes-assignments" className={`${btnSecondary} mt-4`}>
          Back to Quizzes &amp; Assignments
        </Link>
      </Card>
    );
  if (!form)
    return (
      <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted">
        <Spinner /> Loading quiz…
      </Card>
    );

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const totalMarks = form.questions.reduce((s, q) => s + (q.points || 0), 0);

  const setQuestion = (key: string, next: QuestionDraft) => set({ questions: form.questions.map((q) => (q.key === key ? next : q)) });
  const addQuestion = (type: QuestionDraft['type']) => {
    const q = blankQuestion(type);
    set({ questions: [...form.questions, q] });
    setOpen(q.key);
    window.setTimeout(() => listEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };
  const move = (i: number, dir: -1 | 1) => {
    const list = [...form.questions];
    [list[i], list[i + dir]] = [list[i + dir], list[i]];
    set({ questions: list });
  };

  const save = async (status: AssessStatus) => {
    setError('');
    if (!form.title.trim()) return setError('Give the quiz a title');
    if (!form.courseSlug) return setError('Choose a course');
    if (status === 'published' && form.questions.length === 0) return setError('Add at least one question before publishing');
    setBusy(true);
    try {
      const input: QuizInput = {
        courseSlug: form.courseSlug,
        title: form.title,
        description: form.description,
        status,
        timeLimitMin: form.timeLimitMin,
        passPercent: form.passPercent,
        maxAttempts: form.maxAttempts,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        showAnswers: form.showAnswers,
        availableFrom: fromLocalInput(form.from),
        availableUntil: fromLocalInput(form.until),
        // blank extra options (the empty "Option 3" boxes) are left out
        questions: form.questions.map(({ key: _key, ...q }) => ({
          ...q,
          options: q.type === 'single' || q.type === 'multiple' ? q.options.filter((o) => o.text.trim()) : q.options,
          acceptedAnswers: q.type === 'short' ? q.acceptedAnswers.filter((a) => a.trim()) : [],
        })),
      };
      const result = isNew ? await api.createQuiz(input) : await api.updateQuiz(id, input);
      const next = toForm(result, '');
      setForm(next);
      setSaved(JSON.stringify(next, (k, v) => (k === 'key' ? undefined : v)));
      toast.success(status === 'published' && form.status !== 'published' ? 'Quiz published — students can take it now' : status === 'draft' && form.status === 'published' ? 'Quiz unpublished — saved as a draft' : 'Quiz saved');
      if (isNew) nav(`/quizzes-assignments/quiz/${result.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3.5 pb-24 sm:space-y-4">
      <Link to="/quizzes-assignments" onClick={(e) => dirty && !window.confirm('You have unsaved changes. Leave anyway?') && e.preventDefault()} className="inline-flex items-center gap-1.5 text-[0.84rem] font-medium text-veda-muted hover:text-saffron">
        <ArrowLeft size={15} aria-hidden /> Quizzes &amp; Assignments
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <StatusBadge status={form.status} />
            {dirty && <span className="text-[0.72rem] font-semibold text-saffron">Unsaved changes</span>}
          </div>
          <h1 className="font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">{isNew ? 'New quiz' : form.title || 'Quiz'}</h1>
          <p className="text-[0.86rem] text-veda-muted">
            {form.questions.length} questions · {totalMarks} marks
          </p>
        </div>
        {!isNew && (
          <Link to={`/quizzes-assignments/quiz/${id}/results`} className={btnSecondary}>
            <BarChart3 size={16} aria-hidden /> Results
          </Link>
        )}
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[22rem_1fr]">
        <Card className="space-y-3.5 p-4 xl:sticky xl:top-20">
          <fieldset disabled={readOnly} className="space-y-3.5">
            <Field label="Course">
              <select value={form.courseSlug} onChange={(e) => set({ courseSlug: e.target.value })} className={inputClass}>
                <option value="">Choose a course…</option>
                {courses.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={140} placeholder="e.g. Navagraha Basics" className={inputClass} />
            </Field>
            <Field label="Description" optional hint="Shown to students before they begin.">
              <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={3} maxLength={1000} className={inputClass} />
            </Field>
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Minutes" hint="0 = no limit">
                <input type="number" min={0} max={600} value={form.timeLimitMin} onChange={(e) => set({ timeLimitMin: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Pass %">
                <input type="number" min={0} max={100} value={form.passPercent} onChange={(e) => set({ passPercent: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Attempts" hint="0 = unlimited">
                <input type="number" min={0} max={50} value={form.maxAttempts} onChange={(e) => set({ maxAttempts: Number(e.target.value) })} className={inputClass} />
              </Field>
            </div>

            {(
              [
                ['shuffleQuestions', 'Shuffle questions', 'Every student sees a different order'],
                ['shuffleOptions', 'Shuffle options', 'Choices appear in random order'],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/60 px-3 py-2.5">
                <div>
                  <p className="text-[0.84rem] font-semibold text-veda-bark">{label}</p>
                  <p className="text-[0.72rem] text-veda-muted">{hint}</p>
                </div>
                <Switch checked={form[key]} onChange={(v) => set({ [key]: v } as Partial<Form>)} label={label} />
              </div>
            ))}

            <Field label="Show right answers">
              <select value={form.showAnswers} onChange={(e) => set({ showAnswers: e.target.value as ShowAnswers })} className={inputClass}>
                <option value="after_submit">After every attempt</option>
                <option value="after_pass">Only after the student passes</option>
                <option value="never">Never</option>
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-2.5">
              <Field label="Opens on" optional>
                <input type="datetime-local" value={form.from} onChange={(e) => set({ from: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Closes on" optional>
                <input type="datetime-local" value={form.until} onChange={(e) => set({ until: e.target.value })} className={inputClass} />
              </Field>
            </div>
          </fieldset>
        </Card>

        <div className="space-y-3">
          {form.questions.length === 0 && (
            <Card className="animate-rise-in p-8 text-center">
              <p className="font-display text-[1.2rem] font-bold text-veda-bark">No questions yet</p>
              <p className="mt-1 text-[0.88rem] text-veda-muted">Pick a type below to add your first question.</p>
            </Card>
          )}
          {form.questions.map((q, i) => (
            <div key={q.key} className="animate-rise-in">
              <QuestionEditor
                index={i}
                total={form.questions.length}
                value={q}
                open={open === q.key}
                readOnly={readOnly}
                onToggle={() => setOpen(open === q.key ? null : q.key)}
                onChange={(next) => setQuestion(q.key, next)}
                onMove={(dir) => move(i, dir)}
                onDuplicate={() => {
                  const copy = { ...q, key: newKey(), id: undefined, options: q.options.map((o) => ({ ...o, id: undefined })) };
                  const list = [...form.questions];
                  list.splice(i + 1, 0, copy);
                  set({ questions: list });
                  setOpen(copy.key);
                }}
                onDelete={() => set({ questions: form.questions.filter((x) => x.key !== q.key) })}
              />
            </div>
          ))}
          <div ref={listEnd} />
          {!readOnly && (
            <div className="rounded-2xl border-2 border-dashed border-gold/50 bg-cream/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[0.8rem] font-semibold text-veda-bark">
                <Plus size={14} aria-hidden /> Add a question
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUESTION_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => addQuestion(t.value)} className="flex flex-col items-start gap-1 rounded-xl border border-line bg-white/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-gold hover:shadow-card">
                    <t.Icon size={18} className="text-saffron" aria-hidden />
                    <span className="text-[0.82rem] font-semibold text-veda-bark">{t.label}</span>
                    <span className="text-[0.68rem] leading-tight text-veda-muted">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:left-[var(--sidebar-w,0px)]">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
            <p role="alert" className="min-w-0 flex-1 text-[0.82rem] text-red-700">
              {error}
            </p>
            <button type="button" disabled={busy || !dirty} onClick={() => save(form.status === 'published' ? 'published' : 'draft')} className={btnSecondary}>
              {busy ? <Spinner /> : <Save size={16} aria-hidden />} Save{form.status === 'published' ? '' : ' draft'}
            </button>
            {form.status !== 'published' && (
              <button type="button" disabled={busy} onClick={() => save('published')} className={btnPrimary}>
                <Send size={16} aria-hidden /> Publish
              </button>
            )}
            {form.status === 'published' && (
              <button type="button" disabled={busy} onClick={() => save('draft')} className={btnSecondary}>
                Unpublish
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}