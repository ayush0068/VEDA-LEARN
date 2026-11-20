import { ChevronDown, FileDown, FileText, Loader2, NotebookText, PlayCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { CurriculumModule } from '@/constants/courseDetails';
import { getPublicOutline } from '@/services/learning.service';
import type { PublicOutlineModule } from '@/services/learning.service';
import { fileExists, syllabusFile } from '@/utils/courseFormat';
import PreviewLessonModal from './PreviewLessonModal';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// number circles go from gold to dark brown, like the design
const CIRCLE = ['bg-gold', 'bg-[#b8741f]', 'bg-saffron', 'bg-[#9a5516]', 'bg-veda-brown', 'bg-veda-bark'];

interface CurriculumProps {
  courseSlug: string;
  /** syllabus PDF set in the admin panel; empty = public/downloads/<slug>-syllabus.pdf */
  syllabusUrl?: string;
  modules: CurriculumModule[];
  lessons: number;
  weeks: number;
}

export default function Curriculum({ courseSlug, syllabusUrl, modules, lessons, weeks }: CurriculumProps) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [checking, setChecking] = useState(false);
  const [syllabusNote, setSyllabusNote] = useState('');
  // real lessons (from Modules & Lessons in the admin panel); free-preview ones can be played by anyone
  const [outline, setOutline] = useState<PublicOutlineModule[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const closePreview = useCallback(() => setPreviewId(null), []);

  useEffect(() => {
    let alive = true;
    getPublicOutline(courseSlug)
      .then((m) => alive && setOutline(m))
      .catch(() => alive && setOutline([]));
    return () => {
      alive = false;
    };
  }, [courseSlug]);

  /** the real lessons of module i (matched by position and name, so old hand-written curriculum keeps working) */
  const lessonList = (i: number, m: CurriculumModule) => (outline[i] && outline[i].title === m.title ? outline[i].lessons : []);

  const allOpen = open.size === modules.length;
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const downloadSyllabus = async () => {
    setChecking(true);
    setSyllabusNote('');
    const url = syllabusUrl || syllabusFile(courseSlug);
    // a PDF the admin attached is trusted; the default public/ file is checked first
    if (syllabusUrl || (await fileExists(url, 'pdf'))) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.download = `${courseSlug}-syllabus.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      setSyllabusNote('The syllabus PDF will be available soon.');
    }
    setChecking(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h2 id="curriculum-heading" className="font-display text-[1.5rem] font-semibold text-veda-bark sm:text-[1.7rem]">
          Course Curriculum
        </h2>
        <p className="flex items-center gap-4 text-[0.84rem] text-veda-text">
          <span>
            {lessons} Lessons &bull; {weeks} Weeks
          </span>
          <button
            type="button"
            onClick={() => setOpen(allOpen ? new Set() : new Set(modules.map((_, i) => i)))}
            className="hidden font-medium text-veda-brown hover:text-saffron sm:inline"
          >
            {allOpen ? 'Collapse All' : 'Expand All'}
          </button>
        </p>
      </div>

      <ol className="mt-4 divide-y divide-gold/20 overflow-hidden rounded-xl border border-gold/20 bg-ivory shadow-sm">
        {modules.map((m, i) => {
          const isOpen = open.has(i);
          const panelId = `module-panel-${i}`;
          return (
            <li key={m.title}>
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition-colors hover:bg-cream sm:gap-4 sm:px-4"
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-semibold text-ivory ${CIRCLE[i % CIRCLE.length]}`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.92rem] font-medium leading-snug text-veda-bark">
                      Module {i + 1}: {m.title}
                    </span>
                    <span className="mt-0.5 block text-[0.78rem] text-veda-muted sm:hidden">
                      {plural(m.lessons, 'Lesson')} &bull; {plural(m.weeks, 'Week')}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-[0.8rem] text-veda-muted sm:block">
                    {plural(m.lessons, 'Lesson')} &bull; {plural(m.weeks, 'Week')}
                  </span>
                  <ChevronDown size={18} className={`shrink-0 text-veda-text transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
              </h3>

              <div id={panelId} role="region" aria-labelledby={undefined} hidden={!isOpen} className="bg-cream/60 px-4 pb-4 pl-14 sm:pl-[3.75rem]">
                {lessonList(i, m).length > 0 ? (
                  <ul className="space-y-1 pt-1">
                    {lessonList(i, m).map((l) => {
                      const Icon = l.type === 'video' ? PlayCircle : l.type === 'document' ? FileText : NotebookText;
                      return (
                        <li key={l.id} className="flex items-center gap-2.5 text-[0.86rem] text-veda-text">
                          <Icon size={15} className="shrink-0 text-gold" aria-hidden />
                          <span className="min-w-0 flex-1 truncate">{l.title}</span>
                          {l.durationMin > 0 && <span className="shrink-0 text-[0.74rem] text-veda-muted">{l.durationMin} min</span>}
                          {l.isPreview && (
                            <button type="button" onClick={() => setPreviewId(l.id)} className="shrink-0 rounded-full bg-gold-pale px-2.5 py-0.5 text-[0.74rem] font-semibold text-saffron hover:bg-gold-soft/60">
                              Free preview
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : m.topics && m.topics.length > 0 ? (
                  <ul className="list-disc space-y-1.5 pl-4 pt-1 text-[0.86rem] text-veda-text marker:text-gold">
                    {m.topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="pt-1 text-[0.86rem] text-veda-text">
                    {plural(m.lessons, 'video lesson')} over {plural(m.weeks, 'week')}, with study material and a live doubt-solving session.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-gold/25 bg-gradient-to-r from-cream to-gold-pale/50 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ivory text-saffron shadow-sm">
          <FileDown size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.92rem] font-medium text-veda-bark">Course Syllabus (PDF)</p>
          <p className="text-[0.78rem] text-veda-muted" role="status">
            {syllabusNote || 'Download detailed syllabus'}
          </p>
        </div>
        <button
          type="button"
          onClick={downloadSyllabus}
          disabled={checking}
          className="inline-flex shrink-0 items-center gap-1.5 text-[0.88rem] font-semibold text-saffron transition-colors hover:text-veda-brown disabled:opacity-60"
        >
          {checking ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
          Download
        </button>
      </div>
      <PreviewLessonModal slug={courseSlug} lessonId={previewId} onClose={closePreview} />
    </div>
  );
}