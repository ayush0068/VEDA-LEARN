import { Check, FileText, NotebookText, PlayCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LessonKind, OutlineModule } from '@/types/learning';

const ICON: Record<LessonKind, typeof PlayCircle> = { video: PlayCircle, article: NotebookText, document: FileText };

/** Sidebar list: modules with their lessons, a tick for every finished lesson, the open one highlighted. */
export default function CourseOutline({ slug, modules, currentId, onNavigate }: { slug: string; modules: OutlineModule[]; currentId?: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Course lessons" className="space-y-4">
      {modules.map((m) => {
        const done = m.lessons.filter((l) => l.completed).length;
        return (
          <section key={m.id}>
            <header className="mb-1.5 flex items-baseline justify-between gap-2 px-1">
              <h3 className="font-display text-[0.98rem] font-bold leading-snug text-veda-bark">
                {m.number}. {m.title}
              </h3>
              <span className="shrink-0 text-[0.72rem] text-veda-muted">
                {done}/{m.lessons.length}
              </span>
            </header>
            <ul className="space-y-1">
              {m.lessons.map((l) => {
                const Icon = ICON[l.type];
                const open = l.id === currentId;
                return (
                  <li key={l.id}>
                    <Link
                      to={`/learn/${slug}/${l.id}`}
                      onClick={onNavigate}
                      aria-current={open ? 'true' : undefined}
                      className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-[0.85rem] transition ${open ? 'border-gold bg-white text-veda-bark shadow-soft' : 'border-transparent text-veda-text hover:bg-white/70'}`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${l.completed ? 'bg-emerald-600 text-white' : 'border border-gold/50 text-saffron'}`}>
                        {l.completed ? <Check size={12} strokeWidth={3} aria-label="Completed" /> : <Icon size={12} aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{l.title}</span>
                      {l.isPreview && <Star size={13} className="shrink-0 text-gold" aria-label="Free preview" />}
                      {l.durationMin > 0 && <span className="shrink-0 text-[0.72rem] text-veda-muted">{l.durationMin}m</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}