import { FileUp, Link2, Plus, Trash2, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import Field from '@/components/courses/Field';
import type { AssignmentFull, AssignmentInput, CourseOption, SubmissionType } from '@/types/assessments';
import { fromLocalInput, toLocalInput } from './assessUtils';

interface Props {
  /** 'new' to create, an assignment to edit, null = closed */
  target: 'new' | AssignmentFull | null;
  courses: CourseOption[];
  defaultCourse?: string;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (input: AssignmentInput) => Promise<void>;
}

const WAYS: { value: SubmissionType; label: string; Icon: typeof Type }[] = [
  { value: 'text', label: 'Written answer', Icon: Type },
  { value: 'file', label: 'File upload', Icon: FileUp },
  { value: 'link', label: 'Link', Icon: Link2 },
];

const empty = (course: string): AssignmentInput & { due: string } => ({ courseSlug: course, title: '', description: '', status: 'draft', dueAt: null, due: '', maxPoints: 100, allowLate: true, submissionTypes: ['text', 'file'], maxFiles: 3, resources: [] });

export default function AssignmentDrawer({ target, courses, defaultCourse = '', readOnly, onClose, onSave }: Props) {
  const [form, setForm] = useState(empty(defaultCourse));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    setError('');
    if (target === 'new') setForm(empty(defaultCourse || courses[0]?.slug || ''));
    else setForm({ courseSlug: target.courseSlug, title: target.title, description: target.description, status: target.status, dueAt: target.dueAt, due: toLocalInput(target.dueAt), maxPoints: target.maxPoints, allowLate: target.allowLate, submissionTypes: target.submissionTypes, maxFiles: target.maxFiles, resources: target.resources });
  }, [target, courses, defaultCourse]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const toggleWay = (w: SubmissionType) => set({ submissionTypes: form.submissionTypes.includes(w) ? form.submissionTypes.filter((x) => x !== w) : [...form.submissionTypes, w] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    if (!form.courseSlug) return setError('Choose a course');
    if (!form.submissionTypes.length) return setError('Choose at least one way to hand in');
    setBusy(true);
    setError('');
    try {
      const { due, ...rest } = form;
      await onSave({ ...rest, dueAt: fromLocalInput(due) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      busy={busy}
      variant="drawer"
      drawerWidth="max-w-[560px]"
      title={target === 'new' ? 'New assignment' : 'Edit assignment'}
      subtitle="Students see it as soon as it is published."
      footer={
        <div className="flex items-center justify-between gap-3">
          <p role="alert" className="min-w-0 flex-1 text-[0.8rem] text-red-700">
            {error}
          </p>
          <button type="button" onClick={onClose} className={btnSecondary} disabled={busy}>
            Cancel
          </button>
          {!readOnly && (
            <button type="submit" form="assignment-form" className={btnPrimary} disabled={busy}>
              {busy && <Spinner />} {target === 'new' ? 'Create' : 'Save changes'}
            </button>
          )}
        </div>
      }
    >
      <form id="assignment-form" onSubmit={submit} className="space-y-4">
        <fieldset disabled={readOnly || busy} className="space-y-4">
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
            <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={140} placeholder="e.g. Birth Chart Analysis" className={inputClass} />
          </Field>
          <Field label="Instructions" hint="What should the student do? Be as clear as possible.">
            <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={6} maxLength={5000} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date" optional>
              <input type="datetime-local" value={form.due} onChange={(e) => set({ due: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Total marks">
              <input type="number" min={1} max={1000} value={form.maxPoints} onChange={(e) => set({ maxPoints: Number(e.target.value) })} className={inputClass} />
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Students can hand in</span>
            <div className="flex flex-wrap gap-2">
              {WAYS.map(({ value, label, Icon }) => {
                const on = form.submissionTypes.includes(value);
                return (
                  <button key={value} type="button" aria-pressed={on} onClick={() => toggleWay(value)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[0.82rem] font-semibold transition ${on ? 'border-gold bg-gold-pale/60 text-veda-bark' : 'border-line bg-white/70 text-veda-muted hover:border-gold/60'}`}>
                    <Icon size={15} aria-hidden /> {label}
                  </button>
                );
              })}
            </div>
            {form.submissionTypes.includes('file') && (
              <Field label="Maximum files" className="mt-3 max-w-[10rem]">
                <input type="number" min={1} max={10} value={form.maxFiles} onChange={(e) => set({ maxFiles: Number(e.target.value) })} className={inputClass} />
              </Field>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/60 px-3.5 py-3">
            <div>
              <p className="text-[0.85rem] font-semibold text-veda-bark">Accept late hand-ins</p>
              <p className="text-[0.75rem] text-veda-muted">Late work is marked “Late” for you.</p>
            </div>
            <Switch checked={form.allowLate} onChange={(v) => set({ allowLate: v })} label="Accept late hand-ins" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[0.8rem] font-semibold text-veda-bark">Resources for students</span>
              <button type="button" onClick={() => set({ resources: [...form.resources, { title: '', url: '' }] })} disabled={form.resources.length >= 10} className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-saffron hover:underline">
                <Plus size={14} /> Add link
              </button>
            </div>
            <div className="space-y-2">
              {form.resources.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input value={r.title} onChange={(e) => set({ resources: form.resources.map((x, n) => (n === i ? { ...x, title: e.target.value } : x)) })} placeholder="Name" aria-label={`Resource ${i + 1} name`} className={`${inputClass} !w-2/5`} />
                  <input value={r.url} onChange={(e) => set({ resources: form.resources.map((x, n) => (n === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://…" aria-label={`Resource ${i + 1} link`} className={inputClass} />
                  <button type="button" onClick={() => set({ resources: form.resources.filter((_, n) => n !== i) })} aria-label={`Remove resource ${i + 1}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-700 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Status">
            <select value={form.status} onChange={(e) => set({ status: e.target.value as AssignmentInput['status'] })} className={inputClass}>
              <option value="draft">Draft — hidden from students</option>
              <option value="published">Published — visible to enrolled students</option>
              <option value="archived">Archived — hidden, kept for records</option>
            </select>
          </Field>
        </fieldset>
      </form>
    </Modal>
  );
}