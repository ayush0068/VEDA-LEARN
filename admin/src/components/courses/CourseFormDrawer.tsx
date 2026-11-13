import { RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Modal from '@/components/common/Modal';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import { createCourse, getCourse, updateCourse } from '@/services/courses.service';
import type { CourseOptions } from '@/types/course';
import { rupees } from '@/utils/format';
import CourseContentTab from './CourseContentTab';
import Field from './Field';
import MediaField from './MediaField';
import { discountOf, emptyForm, priceFromDiscount, toForm, toPayload, validate } from './courseForm';
import type { CourseForm } from './courseForm';

type Tab = 'basic' | 'price' | 'page';
const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: 'Basic info' },
  { key: 'price', label: 'Price & media' },
  { key: 'page', label: 'Course page' },
];

interface Props {
  /** null = closed, 'new' = add a course, otherwise the slug of the course being edited */
  target: string | null;
  options: CourseOptions | null;
  onClose: () => void;
  /** called after a successful save with a message for the toast */
  onSaved: (message: string) => void;
}

export default function CourseFormDrawer({ target, ...rest }: Props) {
  if (!target) return null;
  return <Form key={target} target={target} {...rest} />;
}

const digits = (s: string) => s.replace(/\D/g, '');

function Form({ target, options, onClose, onSaved }: Omit<Props, 'target'> & { target: string }) {
  const creating = target === 'new';
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [tab, setTab] = useState<Tab>('basic');
  const [loading, setLoading] = useState(!creating);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    getCourse(target)
      .then(({ course, content }) => setForm(toForm(course, content)))
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Could not load this course'))
      .finally(() => setLoading(false));
  }, [target]);

  useEffect(() => {
    if (!creating) load();
  }, [creating, load]);

  const patch = (p: Partial<CourseForm>) => setForm((f) => ({ ...f, ...p }));
  const text = (key: keyof CourseForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => patch({ [key]: e.target.value } as Partial<CourseForm>);
  const num = (key: keyof CourseForm) => (e: ChangeEvent<HTMLInputElement>) => patch({ [key]: digits(e.target.value) } as Partial<CourseForm>);

  // the three price boxes stay in sync: discount -> selling price; original / selling price -> discount
  const setOriginal = (v: string) => setForm((f) => ({ ...f, originalPrice: v, discount: discountOf(f.price, v) }));
  const setDiscount = (v: string) => setForm((f) => ({ ...f, discount: v, price: f.originalPrice && v !== '' ? priceFromDiscount(f.originalPrice, v) || f.price : f.price }));
  const setPrice = (v: string) => setForm((f) => ({ ...f, price: v, discount: discountOf(v, f.originalPrice) }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = validate(form);
    if (problem) {
      setTab(problem.tab);
      return setError(problem.message);
    }

    setBusy(true);
    setError('');
    try {
      const saved = await (creating ? createCourse(toPayload(form, { create: true })) : updateCourse(target, toPayload(form, { create: false })));
      onSaved(creating ? `“${saved.course.title}” was added` : `“${saved.course.title}” was updated`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  const off = Number(discountOf(form.price, form.originalPrice));
  const ready = !loading && !loadError;

  return (
    <Modal
      open
      variant="drawer"
      drawerWidth="max-w-[720px]"
      onClose={onClose}
      busy={busy}
      title={creating ? 'Add course' : 'Edit course'}
      subtitle={creating ? 'Everything here appears on the website' : form.slug ? `/courses/${form.slug}` : undefined}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {error && ready && (
            <p role="alert" className="flex-1 text-[0.8rem] text-red-700">
              {error}
            </p>
          )}
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="course-form" disabled={busy || !ready} className={btnPrimary}>
            {busy ? <Spinner /> : <Save size={16} aria-hidden />}
            {busy ? 'Saving…' : creating ? 'Add course' : 'Save changes'}
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Loading course">
          <Spinner className="h-6 w-6 text-saffron" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <p className="font-display text-lg font-bold text-veda-bark">Could not load this course</p>
          <p className="mt-1 max-w-sm text-[0.85rem] text-veda-muted">{loadError}</p>
          <button type="button" onClick={load} className={`${btnSecondary} mt-4`}>
            <RefreshCw size={15} aria-hidden /> Try again
          </button>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Course sections" className="sticky -top-4 z-10 -mx-5 mb-4 flex gap-1 border-b border-line/70 bg-ivory px-5 pb-2 pt-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-3.5 py-2 text-[0.84rem] font-semibold transition ${tab === t.key ? 'bg-peach text-veda-bark' : 'text-veda-muted hover:text-veda-bark'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form id="course-form" onSubmit={submit} noValidate>
            {tab === 'basic' && (
              <div className="space-y-4">
                <Field label="Course name" hint="Shown on the course card and page.">
                  <input value={form.title} onChange={text('title')} placeholder="e.g. Vedic Astrology for Beginners" maxLength={120} autoComplete="off" className={inputClass} />
                </Field>

                {creating ? (
                  <Field label="URL name" optional hint="Leave empty to create it from the course name. It cannot be changed later.">
                    <input value={form.slug} onChange={(e) => patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="vedic-astrology-for-beginners" maxLength={100} className={inputClass} />
                  </Field>
                ) : (
                  <p className="text-[0.76rem] text-veda-muted">
                    URL name: <code className="rounded bg-cream px-1.5 py-0.5">{form.slug}</code> (cannot be changed)
                  </p>
                )}

                <Field label="Short description" hint={`${form.description.length}/300 · shown on the course card`}>
                  <textarea value={form.description} onChange={text('description')} maxLength={300} className={`${inputClass} min-h-[5.5rem] resize-y`} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category" hint="The chip it appears under on the Courses page.">
                    <select value={form.category} onChange={text('category')} className={`${inputClass} cursor-pointer`}>
                      <option value="">Choose a category…</option>
                      {(options?.categories ?? []).map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Instructor" optional hint="Shown in the cart and on the course page.">
                    <input value={form.instructor} onChange={text('instructor')} list="course-instructors" maxLength={60} className={inputClass} />
                    <datalist id="course-instructors">
                      {(options?.instructors ?? []).map((n) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Level">
                    <select value={form.level} onChange={text('level')} className={`${inputClass} cursor-pointer`}>
                      {(options?.levels ?? ['Beginner', 'Intermediate', 'Advanced', 'All Levels']).map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Language">
                    <select value={form.language} onChange={text('language')} className={`${inputClass} cursor-pointer`}>
                      {[...new Set([...(options?.languages ?? ['English', 'Hindi']), form.language])].map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Duration (weeks)" optional>
                    <input inputMode="numeric" value={form.weeks} onChange={num('weeks')} placeholder="e.g. 10" className={inputClass} />
                  </Field>
                  <Field label="Lessons" optional>
                    <input inputMode="numeric" value={form.lessons} onChange={num('lessons')} placeholder="e.g. 32" className={inputClass} />
                  </Field>
                </div>

                <Field label="Badge" optional hint="Small label on the card, e.g. Bestseller.">
                  <input value={form.badge} onChange={text('badge')} list="course-badges" maxLength={24} className={inputClass} />
                  <datalist id="course-badges">
                    {(options?.badges ?? []).map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Field>

                <div className="divide-y divide-line/70 rounded-xl border border-line bg-white/60">
                  <div className="flex items-center justify-between gap-4 px-3.5 py-3">
                    <div>
                      <p className="text-[0.86rem] font-semibold text-veda-bark">Visible on website</p>
                      <p className="text-[0.76rem] text-veda-muted">Turn off to hide the course without deleting it.</p>
                    </div>
                    <Switch checked={form.isActive} onChange={(v) => patch({ isActive: v })} label="Visible on website" />
                  </div>
                  <div className="flex items-center justify-between gap-4 px-3.5 py-3">
                    <div>
                      <p className="text-[0.86rem] font-semibold text-veda-bark">Show in “Popular Courses”</p>
                      <p className="text-[0.76rem] text-veda-muted">Homepage section. The website shows 4, so keep it to 4 courses.</p>
                    </div>
                    <Switch checked={form.isPopular} onChange={(v) => patch({ isPopular: v })} label="Show on homepage" />
                  </div>
                </div>
              </div>
            )}

            {tab === 'price' && (
              <div className="space-y-5">
                <section className="space-y-3">
                  <h3 className="font-display text-[1.05rem] font-bold text-veda-bark">Price & discount</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Original price (₹)" optional hint="Struck-through price.">
                      <input inputMode="numeric" value={form.originalPrice} onChange={(e) => setOriginal(digits(e.target.value))} placeholder="2499" className={inputClass} />
                    </Field>
                    <Field label="Discount (%)" hint="Fills the selling price.">
                      <input inputMode="numeric" value={form.discount} onChange={(e) => setDiscount(digits(e.target.value).slice(0, 3))} disabled={!form.originalPrice} placeholder="40" className={inputClass} />
                    </Field>
                    <Field label="Selling price (₹)" hint="What the student pays.">
                      <input inputMode="numeric" value={form.price} onChange={(e) => setPrice(digits(e.target.value))} placeholder="1499" className={inputClass} />
                    </Field>
                  </div>
                  <p className="flex flex-wrap items-baseline gap-x-2.5 rounded-xl bg-cream/70 px-3.5 py-2.5 text-[0.85rem] text-veda-text">
                    <span className="text-veda-muted">Website shows:</span>
                    <b className="text-[1.15rem] text-veda-bark">{form.price === '' ? '—' : Number(form.price) === 0 ? 'Free' : rupees(Number(form.price))}</b>
                    {off > 0 && form.originalPrice && <span className="text-veda-muted line-through">{rupees(Number(form.originalPrice))}</span>}
                    {off > 0 && <span className="rounded-md bg-gold-pale px-2 py-0.5 text-[0.72rem] font-semibold text-saffron">{off}% OFF</span>}
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="font-display text-[1.05rem] font-bold text-veda-bark">Pictures & files</h3>
                  <MediaField label="Course card image" kind="image" value={form.image} onChange={(image) => patch({ image })} hint="Shown on every course card and at the top of the course page. A landscape picture (16:10) looks best." placeholder="or paste a link / path like /images/courses/name.png" />
                  <MediaField label="Preview video" kind="video" value={form.previewVideo} onChange={(previewVideo) => patch({ previewVideo })} hint="Plays when students tap “Preview Course”. YouTube links also work." />
                  <MediaField label="Syllabus PDF" kind="document" value={form.syllabus} onChange={(syllabus) => patch({ syllabus })} hint="Used by the “Download Syllabus” button." />
                </section>

                <section className="space-y-3">
                  <h3 className="font-display text-[1.05rem] font-bold text-veda-bark">Numbers on the card</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Rating (0-5)" optional>
                      <input inputMode="decimal" value={form.rating} onChange={(e) => patch({ rating: e.target.value.replace(/[^\d.]/g, '') })} placeholder="4.8" className={inputClass} />
                    </Field>
                    <Field label="Students" optional>
                      <input inputMode="numeric" value={form.studentsCount} onChange={num('studentsCount')} placeholder="1200" className={inputClass} />
                    </Field>
                    <Field label="Display order" optional hint="Smaller number = earlier.">
                      <input inputMode="numeric" value={form.order} onChange={num('order')} placeholder="auto" className={inputClass} />
                    </Field>
                  </div>
                </section>
              </div>
            )}

            {tab === 'page' && <CourseContentTab value={form.content} options={options} onChange={(p) => patch({ content: { ...form.content, ...p } })} />}
          </form>
        </>
      )}
    </Modal>
  );
}