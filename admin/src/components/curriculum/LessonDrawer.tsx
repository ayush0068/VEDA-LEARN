import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import Field from '@/components/courses/Field';
import MediaField from '@/components/courses/MediaField';
import type { CurriculumLesson, LessonInput, LessonType } from '@/types/curriculum';
import { LESSON_TYPES } from './curriculumUtils';

export interface LessonTarget {
  moduleId: string;
  moduleTitle: string;
  lesson: CurriculumLesson | null;
}

const EMPTY: LessonInput = { title: '', description: '', type: 'video', mediaUrl: '', content: '', durationMin: 0, resources: [], isPreview: false, status: 'published' };

export default function LessonDrawer({ target, onClose, onSave }: { target: LessonTarget | null; onClose: () => void; onSave: (moduleId: string, lessonId: string | null, input: LessonInput) => Promise<void> }) {
  const [form, setForm] = useState<LessonInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) return;
    setError('');
    const l = target.lesson;
    setForm(
      l
        ? { title: l.title, description: l.description, type: l.type, mediaUrl: l.mediaUrl, content: l.content, durationMin: l.durationMin, resources: l.resources.map((r) => ({ ...r })), isPreview: l.isPreview, status: l.status }
        : EMPTY,
    );
  }, [target]);

  const set = <K extends keyof LessonInput>(key: K, value: LessonInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    if (!form.title.trim()) return setError('Lesson title is required');
    if (form.status === 'published') {
      if (form.type !== 'article' && !form.mediaUrl.trim()) return setError('Add the video / PDF (upload or link) before publishing, or save it as a draft.');
      if (form.type === 'article' && !form.content.trim()) return setError('Write the article text before publishing, or save it as a draft.');
    }
    const resources = form.resources.filter((r) => r.title.trim() && r.url.trim()).map((r) => ({ title: r.title.trim(), url: r.url.trim() }));

    setBusy(true);
    setError('');
    try {
      await onSave(target.moduleId, target.lesson?.id ?? null, { ...form, title: form.title.trim(), description: form.description.trim(), mediaUrl: form.type === 'article' ? '' : form.mediaUrl.trim(), resources });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the lesson');
    } finally {
      setBusy(false);
    }
  };

  const updateResource = (i: number, key: 'title' | 'url', value: string) => set('resources', form.resources.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      busy={busy}
      variant="drawer"
      drawerWidth="max-w-[640px]"
      title={target?.lesson ? 'Edit Lesson' : 'Add Lesson'}
      subtitle={target ? `In module: ${target.moduleTitle}` : undefined}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="lesson-form" disabled={busy} className={btnPrimary}>
            {busy && <Spinner />} {target?.lesson ? 'Save Changes' : 'Add Lesson'}
          </button>
        </div>
      }
    >
      <form id="lesson-form" onSubmit={submit} className="space-y-4">
        <Field label="Lesson title">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} placeholder="e.g. Understanding the three Doshas" className={inputClass} />
        </Field>

        <div>
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Lesson type</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Lesson type">
            {LESSON_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={form.type === value}
                onClick={() => set('type', value as LessonType)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[0.8rem] font-semibold transition ${form.type === value ? 'border-gold bg-white text-veda-bark ring-2 ring-gold/30' : 'border-line bg-white/50 text-veda-muted hover:border-gold/60'}`}
              >
                <Icon size={20} strokeWidth={1.6} aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>

        {form.type === 'video' && <MediaField label="Video" kind="video" value={form.mediaUrl} onChange={(v) => set('mediaUrl', v)} hint="Students watch this in the lesson player." placeholder="or paste a YouTube / Vimeo / https link" />}
        {form.type === 'document' && <MediaField label="PDF / notes" kind="document" value={form.mediaUrl} onChange={(v) => set('mediaUrl', v)} hint="Students can read or download this file." />}
        {form.type === 'article' && (
          <Field label="Article text" hint="Plain text; line breaks are kept.">
            <textarea value={form.content} onChange={(e) => set('content', e.target.value)} maxLength={20000} rows={10} className={inputClass} />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field label="Short description" optional>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={500} rows={2} className={inputClass} />
          </Field>
          <Field label="Duration (min)">
            <input type="number" min={0} max={1000} value={form.durationMin} onChange={(e) => set('durationMin', Math.min(1000, Math.max(0, Number(e.target.value) || 0)))} className={inputClass} />
          </Field>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[0.8rem] font-semibold text-veda-bark">
              Extra resources <span className="font-normal text-veda-muted">(optional, max 10)</span>
            </span>
            {form.resources.length < 10 && (
              <button type="button" onClick={() => set('resources', [...form.resources, { title: '', url: '' }])} className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-saffron hover:underline">
                <Plus size={14} aria-hidden /> Add link
              </button>
            )}
          </div>
          <div className="space-y-2">
            {form.resources.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input value={r.title} onChange={(e) => updateResource(i, 'title', e.target.value)} placeholder="Title" maxLength={120} aria-label={`Resource ${i + 1} title`} className={`${inputClass} !py-2 w-2/5`} />
                <input value={r.url} onChange={(e) => updateResource(i, 'url', e.target.value)} placeholder="https://…" maxLength={500} aria-label={`Resource ${i + 1} link`} className={`${inputClass} !py-2`} />
                <button type="button" onClick={() => set('resources', form.resources.filter((_, idx) => idx !== i))} aria-label={`Remove resource ${i + 1}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-700 hover:bg-red-50">
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-line bg-white/60 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.85rem] font-semibold text-veda-bark">Free preview</p>
              <p className="text-[0.74rem] text-veda-muted">Visitors can watch this lesson before buying.</p>
            </div>
            <Switch label="Free preview" checked={form.isPreview} onChange={(v) => set('isPreview', v)} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-2">
            <div>
              <p className="text-[0.85rem] font-semibold text-veda-bark">{form.status === 'published' ? 'Published' : 'Draft'}</p>
              <p className="text-[0.74rem] text-veda-muted">Drafts are hidden from the website and lesson count.</p>
            </div>
            <Switch label="Published" checked={form.status === 'published'} onChange={(v) => set('status', v ? 'published' : 'draft')} />
          </div>
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