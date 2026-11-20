import { useEffect, useState } from 'react';
import Field from '@/components/courses/Field';
import Modal from '@/components/common/Modal';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import type { CurriculumModule, ModuleInput } from '@/types/curriculum';

interface Props {
  /** 'new' to create, a module to edit, null = closed */
  target: 'new' | CurriculumModule | null;
  onClose: () => void;
  onSave: (input: ModuleInput) => Promise<void>;
}

const EMPTY: ModuleInput = { title: '', description: '', weeks: 1, status: 'published' };

export default function ModuleModal({ target, onClose, onSave }: Props) {
  const [form, setForm] = useState<ModuleInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    setError('');
    setForm(target === 'new' ? EMPTY : { title: target.title, description: target.description, weeks: target.weeks, status: target.status });
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Module name is required');
    setBusy(true);
    setError('');
    try {
      await onSave({ ...form, title: form.title.trim(), description: form.description.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the module');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      busy={busy}
      title={target === 'new' ? 'Add Module' : 'Edit Module'}
      subtitle="A module is a chapter of the course. Lessons live inside it."
      width="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="module-form" disabled={busy} className={btnPrimary}>
            {busy && <Spinner />} {target === 'new' ? 'Add Module' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form id="module-form" onSubmit={submit} className="space-y-4">
        <Field label="Module name">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="e.g. Foundations of Ayurveda" className={inputClass} />
        </Field>
        <Field label="Description" optional>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} rows={3} placeholder="What will students learn in this module?" className={inputClass} />
        </Field>
        <Field label="Duration (weeks)" hint="Shown on the course page curriculum.">
          <input type="number" min={1} max={52} value={form.weeks} onChange={(e) => setForm({ ...form, weeks: Math.min(52, Math.max(1, Number(e.target.value) || 1)) })} className={`${inputClass} sm:w-32`} />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/60 px-3.5 py-3">
          <div>
            <p className="text-[0.85rem] font-semibold text-veda-bark">{form.status === 'published' ? 'Published' : 'Draft'}</p>
            <p className="text-[0.74rem] text-veda-muted">Only published modules appear on the website.</p>
          </div>
          <Switch label="Published" checked={form.status === 'published'} onChange={(on) => setForm({ ...form, status: on ? 'published' : 'draft' })} />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}