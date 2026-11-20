import { ArrowLeft, ArrowDown, ArrowUp, Clock, Copy, Eye, EyeOff, GripVertical, Layers, ListVideo, MoveRight, Pencil, Plus, RefreshCw, Star, Trash2, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import StatCard from '@/components/common/StatCard';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary, btnSecondary } from '@/components/common/ui';
import ConfirmDialog from '@/components/students/ConfirmDialog';
import RowMenu from '@/components/students/RowMenu';
import type { MenuItem } from '@/components/students/RowMenu';
import { useToast } from '@/context/ToastContext';
import * as api from '@/services/curriculum.service';
import type { Curriculum, CurriculumLesson, CurriculumModule, LessonInput, ModuleInput } from '@/types/curriculum';
import LessonDrawer from './LessonDrawer';
import type { LessonTarget } from './LessonDrawer';
import ModuleModal from './ModuleModal';
import { formatMinutes, shift, typeMeta } from './curriculumUtils';

const StatusBadge = ({ status }: { status: 'draft' | 'published' }) => (
  <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${status === 'published' ? 'bg-ok/15 text-ok' : 'bg-cream text-veda-muted'}`}>{status}</span>
);

export default function CurriculumEditor({ slug }: { slug: string }) {
  const toast = useToast();
  const [data, setData] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const firstLoad = useRef(true);

  const [moduleTarget, setModuleTarget] = useState<'new' | CurriculumModule | null>(null);
  const [lessonTarget, setLessonTarget] = useState<LessonTarget | null>(null);
  const [delModule, setDelModule] = useState<CurriculumModule | null>(null);
  const [delLesson, setDelLesson] = useState<CurriculumLesson | null>(null);
  const [moving, setMoving] = useState<CurriculumLesson | null>(null);
  const [drag, setDrag] = useState<{ kind: 'module' | 'lesson'; id: string; parent?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getCurriculum(slug);
      setData(result);
      if (firstLoad.current) {
        firstLoad.current = false;
        setOpen(Object.fromEntries(result.modules.slice(0, 1).map((m) => [m.id, true])));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the curriculum');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    firstLoad.current = true;
    load();
  }, [load]);

  /** runs an API call, then refreshes; shows the server's message when it fails */
  const run = async (task: () => Promise<unknown>, success?: string) => {
    try {
      await task();
      if (success) toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      await load();
    }
  };

  const modules = data?.modules ?? [];
  const stats = data?.stats;

  // ---- reordering (buttons and drag & drop share this) ----
  const applyModuleOrder = (ids: string[]) => {
    if (!data) return;
    const byId = new Map(modules.map((m) => [m.id, m]));
    setData({ ...data, modules: ids.map((id) => byId.get(id)!).filter(Boolean) });
    run(() => api.reorderModules(slug, ids));
  };
  const applyLessonOrder = (moduleId: string, ids: string[]) => {
    if (!data) return;
    setData({
      ...data,
      modules: modules.map((m) => {
        if (m.id !== moduleId) return m;
        const byId = new Map(m.lessons.map((l) => [l.id, l]));
        return { ...m, lessons: ids.map((id) => byId.get(id)!).filter(Boolean) };
      }),
    });
    run(() => api.reorderLessons(moduleId, ids));
  };

  const moveModule = (index: number, delta: number) => applyModuleOrder(shift(modules, index, delta).map((m) => m.id));
  const moveLessonBy = (m: CurriculumModule, index: number, delta: number) => applyLessonOrder(m.id, shift(m.lessons, index, delta).map((l) => l.id));

  const dropOn = (kind: 'module' | 'lesson', targetId: string, parent?: string) => {
    if (!drag || drag.kind !== kind || drag.id === targetId || drag.parent !== parent) return setDrag(null);
    if (kind === 'module') {
      const ids = modules.map((m) => m.id);
      ids.splice(ids.indexOf(drag.id), 1);
      ids.splice(ids.indexOf(targetId), 0, drag.id);
      applyModuleOrder(ids);
    } else {
      const m = modules.find((x) => x.id === parent);
      if (m) {
        const ids = m.lessons.map((l) => l.id);
        ids.splice(ids.indexOf(drag.id), 1);
        ids.splice(ids.indexOf(targetId), 0, drag.id);
        applyLessonOrder(m.id, ids);
      }
    }
    setDrag(null);
  };

  // ---- saves ----
  const saveModule = async (input: ModuleInput) => {
    if (moduleTarget === 'new') {
      const created = await api.createModule(slug, input);
      setOpen((o) => ({ ...o, [created.id]: true }));
      toast.success('Module added');
    } else if (moduleTarget) {
      await api.updateModule(moduleTarget.id, input);
      toast.success('Module updated');
    }
    setModuleTarget(null);
    await load();
  };

  const saveLesson = async (moduleId: string, lessonId: string | null, input: LessonInput) => {
    if (lessonId) await api.updateLesson(lessonId, input);
    else await api.createLesson(moduleId, input);
    toast.success(lessonId ? 'Lesson updated' : 'Lesson added');
    setOpen((o) => ({ ...o, [moduleId]: true }));
    setLessonTarget(null);
    await load();
  };

  const toggleModule = (m: CurriculumModule, on: boolean) => run(() => api.updateModule(m.id, { status: on ? 'published' : 'draft' }));
  const toggleLesson = (l: CurriculumLesson, on: boolean) => run(() => api.updateLesson(l.id, { status: on ? 'published' : 'draft' }));
  const bulk = (m: CurriculumModule, status: 'draft' | 'published') => {
    const ids = m.lessons.filter((l) => l.status !== status).map((l) => l.id);
    if (!ids.length) return toast.success(`All lessons are already ${status}`);
    run(() => api.setLessonsStatus(ids, status), status === 'published' ? 'Lessons published' : 'Lessons moved to draft');
  };

  const moduleMenu = (m: CurriculumModule, index: number): MenuItem[] => [
    { label: 'Edit module', icon: Pencil, onClick: () => setModuleTarget(m) },
    { label: 'Add lesson', icon: Plus, onClick: () => setLessonTarget({ moduleId: m.id, moduleTitle: m.title, lesson: null }) },
    { label: 'Publish all lessons', icon: Eye, onClick: () => bulk(m, 'published') },
    { label: 'Unpublish all lessons', icon: EyeOff, onClick: () => bulk(m, 'draft') },
    { label: 'Duplicate module', icon: Copy, onClick: () => run(() => api.duplicateModule(m.id), 'Module duplicated (as draft)') },
    ...(index > 0 ? [{ label: 'Move up', icon: ArrowUp, onClick: () => moveModule(index, -1) }] : []),
    ...(index < modules.length - 1 ? [{ label: 'Move down', icon: ArrowDown, onClick: () => moveModule(index, 1) }] : []),
    { label: 'Delete module', icon: Trash2, danger: true, onClick: () => setDelModule(m) },
  ];

  const lessonMenu = (m: CurriculumModule, l: CurriculumLesson, index: number): MenuItem[] => [
    { label: 'Edit lesson', icon: Pencil, onClick: () => setLessonTarget({ moduleId: m.id, moduleTitle: m.title, lesson: l }) },
    { label: 'Duplicate lesson', icon: Copy, onClick: () => run(() => api.duplicateLesson(l.id), 'Lesson duplicated (as draft)') },
    ...(modules.length > 1 ? [{ label: 'Move to another module', icon: MoveRight, onClick: () => setMoving(l) }] : []),
    ...(index > 0 ? [{ label: 'Move up', icon: ArrowUp, onClick: () => moveLessonBy(m, index, -1) }] : []),
    ...(index < m.lessons.length - 1 ? [{ label: 'Move down', icon: ArrowDown, onClick: () => moveLessonBy(m, index, 1) }] : []),
    { label: 'Delete lesson', icon: Trash2, danger: true, onClick: () => setDelLesson(l) },
  ];

  const course = data?.course;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/modules-lessons" className="mb-1 inline-flex items-center gap-1 text-[0.8rem] font-semibold text-saffron hover:underline">
            <ArrowLeft size={14} aria-hidden /> All courses
          </Link>
          <h1 className="truncate font-display text-[1.6rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">{course?.title ?? 'Modules & Lessons'}</h1>
          {course && (
            <p className="text-[0.88rem] text-veda-muted">
              {[course.category, course.instructor].filter(Boolean).join(' · ')}
              {course.lessonsOnSite > 0 && ` · ${course.lessonsOnSite} lessons shown on the website`}
            </p>
          )}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button type="button" onClick={load} disabled={loading} aria-label="Refresh" className={`${btnSecondary} !px-3`}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden />
          </button>
          <button type="button" onClick={() => setModuleTarget('new')} disabled={!data} className={`${btnPrimary} flex-1 sm:flex-none`}>
            <Plus size={17} aria-hidden /> Add Module
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={Layers} label="Modules" value={stats?.modules} />
        <StatCard icon={ListVideo} label="Lessons" value={stats?.lessons} hint={stats ? `${stats.published} published · ${stats.drafts} draft` : undefined} />
        <StatCard icon={Star} label="Free previews" value={stats?.previews} />
        <StatCard icon={Clock} label="Total minutes" value={stats?.minutes} hint={stats ? formatMinutes(stats.minutes) : undefined} />
      </div>

      {error ? (
        <Card className="p-6 text-center">
          <p role="alert" className="text-[0.9rem] text-red-700">{error}</p>
          <button type="button" onClick={load} className={`${btnSecondary} mt-3`}>Try again</button>
        </Card>
      ) : !data ? (
        <Card className="flex items-center justify-center gap-2 p-10 text-veda-muted">
          <Spinner /> Loading curriculum…
        </Card>
      ) : modules.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-peach text-saffron"><Layers size={26} strokeWidth={1.5} aria-hidden /></span>
          <h2 className="font-display text-[1.2rem] font-bold text-veda-bark">No modules yet</h2>
          <p className="max-w-sm text-[0.86rem] text-veda-muted">Add the first module, then put lessons inside it. Published lessons update this course on the website automatically.</p>
          <button type="button" onClick={() => setModuleTarget('new')} className={btnPrimary}><Plus size={17} aria-hidden /> Add Module</button>
        </Card>
      ) : (
        <div className="space-y-3">
          {modules.map((m, mi) => {
            const isOpen = Boolean(open[m.id]);
            const minutes = m.lessons.reduce((s, l) => s + l.durationMin, 0);
            return (
              <Card key={m.id} className={`overflow-hidden transition ${drag?.kind === 'module' && drag.id === m.id ? 'opacity-50' : ''}`}>
                <div
                  onDragOver={(e) => drag?.kind === 'module' && e.preventDefault()}
                  onDrop={() => dropOn('module', m.id)}
                  className="flex items-center gap-2 px-3 py-3 sm:px-4"
                >
                  <span
                    draggable
                    onDragStart={() => setDrag({ kind: 'module', id: m.id })}
                    onDragEnd={() => setDrag(null)}
                    className="hidden cursor-grab text-veda-muted sm:block"
                    aria-hidden
                    title="Drag to reorder"
                  >
                    <GripVertical size={18} />
                  </span>
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-peach font-display text-[0.95rem] font-bold text-saffron">{mi + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display text-[1.05rem] font-bold text-veda-bark">{m.title}</span>
                        <StatusBadge status={m.status} />
                      </span>
                      <span className="block text-[0.76rem] text-veda-muted">
                        {m.lessons.length} lesson{m.lessons.length === 1 ? '' : 's'} · {m.weeks} week{m.weeks === 1 ? '' : 's'}
                        {minutes > 0 && ` · ${formatMinutes(minutes)}`}
                      </span>
                    </span>
                    <ChevronDown size={18} className={`shrink-0 text-veda-muted transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                  </button>
                  <Switch label={`Publish module ${m.title}`} checked={m.status === 'published'} onChange={(on) => toggleModule(m, on)} />
                  <RowMenu label={m.title} items={moduleMenu(m, mi)} />
                </div>

                {isOpen && (
                  <div className="border-t border-line/70 bg-cream/30">
                    {m.description && <p className="px-4 pt-3 text-[0.82rem] text-veda-muted">{m.description}</p>}
                    <ul className="divide-y divide-line/60">
                      {m.lessons.map((l, li) => {
                        const meta = typeMeta(l.type);
                        const Icon = meta.icon;
                        return (
                          <li
                            key={l.id}
                            onDragOver={(e) => drag?.kind === 'lesson' && drag.parent === m.id && e.preventDefault()}
                            onDrop={() => dropOn('lesson', l.id, m.id)}
                            className={`flex items-center gap-2 px-3 py-2.5 sm:px-4 ${drag?.id === l.id ? 'opacity-50' : ''}`}
                          >
                            <span draggable onDragStart={() => setDrag({ kind: 'lesson', id: l.id, parent: m.id })} onDragEnd={() => setDrag(null)} className="hidden cursor-grab text-veda-muted sm:block" aria-hidden title="Drag to reorder">
                              <GripVertical size={16} />
                            </span>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-saffron"><Icon size={16} strokeWidth={1.7} aria-hidden /></span>
                            <button type="button" onClick={() => setLessonTarget({ moduleId: m.id, moduleTitle: m.title, lesson: l })} className="min-w-0 flex-1 text-left">
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="truncate text-[0.88rem] font-semibold text-veda-bark">{l.title}</span>
                                {l.isPreview && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.66rem] font-bold uppercase text-[#8A5A12]">Preview</span>}
                                {l.status === 'draft' && <StatusBadge status="draft" />}
                              </span>
                              <span className="block text-[0.74rem] text-veda-muted">
                                {meta.label}
                                {l.durationMin > 0 && ` · ${formatMinutes(l.durationMin)}`}
                                {l.resources.length > 0 && ` · ${l.resources.length} resource${l.resources.length === 1 ? '' : 's'}`}
                              </span>
                            </button>
                            <Switch label={`Publish lesson ${l.title}`} checked={l.status === 'published'} onChange={(on) => toggleLesson(l, on)} />
                            <RowMenu label={l.title} items={lessonMenu(m, l, li)} />
                          </li>
                        );
                      })}
                      {m.lessons.length === 0 && <li className="px-4 py-5 text-center text-[0.82rem] text-veda-muted">No lessons in this module yet.</li>}
                    </ul>
                    <div className="px-4 py-3">
                      <button type="button" onClick={() => setLessonTarget({ moduleId: m.id, moduleTitle: m.title, lesson: null })} className={`${btnSecondary} !py-2`}>
                        <Plus size={15} aria-hidden /> Add Lesson
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ModuleModal target={moduleTarget} onClose={() => setModuleTarget(null)} onSave={saveModule} />
      <LessonDrawer target={lessonTarget} onClose={() => setLessonTarget(null)} onSave={saveLesson} />

      <ConfirmDialog
        open={Boolean(delModule)}
        title="Delete module?"
        confirmLabel="Delete module"
        danger
        onClose={() => setDelModule(null)}
        onConfirm={async () => {
          if (!delModule) return;
          await api.deleteModule(delModule.id);
          toast.success('Module deleted');
          setDelModule(null);
          await load();
        }}
      >
        <p>
          <strong>{delModule?.title}</strong> and its {delModule?.lessons.length ?? 0} lesson(s), including uploaded files, will be permanently deleted.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(delLesson)}
        title="Delete lesson?"
        confirmLabel="Delete lesson"
        danger
        onClose={() => setDelLesson(null)}
        onConfirm={async () => {
          if (!delLesson) return;
          await api.deleteLesson(delLesson.id);
          toast.success('Lesson deleted');
          setDelLesson(null);
          await load();
        }}
      >
        <p><strong>{delLesson?.title}</strong> and its uploaded file will be permanently deleted.</p>
      </ConfirmDialog>

      <Modal
        open={Boolean(moving)}
        onClose={() => setMoving(null)}
        title="Move lesson"
        subtitle={moving?.title}
        width="max-w-sm"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={() => setMoving(null)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        }
      >
        <p className="mb-2 text-[0.85rem] text-veda-muted">Choose the module to move it to (it goes at the end).</p>
        <div className="space-y-1.5">
          {modules
            .filter((m) => m.id !== moving?.moduleId)
            .map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  const lesson = moving;
                  setMoving(null);
                  if (lesson) run(() => api.moveLesson(lesson.id, m.id), 'Lesson moved');
                }}
                className="flex w-full items-center justify-between rounded-lg border border-line bg-white/70 px-3 py-2 text-left text-[0.85rem] font-semibold text-veda-bark hover:border-gold"
              >
                {m.title}
                <MoveRight size={15} aria-hidden />
              </button>
            ))}
        </div>
      </Modal>
    </div>
  );
}