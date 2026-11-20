import { ArrowLeft, ArrowRight, Check, ChevronLeft, ExternalLink, ListVideo, PartyPopper, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CourseOutline from '@/components/learn/CourseOutline';
import LessonMedia from '@/components/learn/LessonMedia';
import { ProgressBar } from '@/components/dashboard/DashParts';
import { getCourseLearning, getLessonDetail, setLessonDone } from '@/services/learning.service';
import type { ApiRequestError } from '@/services/api';
import type { CourseLearning, LessonDetail } from '@/types/learning';

const BG = 'min-h-dvh bg-gradient-to-br from-[#fff6e8] via-[#fdecd0] to-[#fbe2bb]';

function Message({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className={`${BG} flex items-center justify-center px-5`}>
      <div className="max-w-md text-center">
        <h1 className="font-display text-[1.7rem] font-bold text-veda-bark">{title}</h1>
        <p className="mt-2 text-[0.92rem] text-veda-muted">{text}</p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">{action}</div>
      </div>
    </div>
  );
}

/** /learn/:slug (opens the lesson to continue with) and /learn/:slug/:lessonId */
export default function CoursePlayer() {
  const { slug = '', lessonId } = useParams();
  const navigate = useNavigate();

  const [outline, setOutline] = useState<CourseLearning | null>(null);
  const [outlineError, setOutlineError] = useState<ApiRequestError | null>(null);
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [lessonError, setLessonError] = useState<ApiRequestError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const autoDone = useRef('');

  const loadOutline = useCallback(() => {
    setOutlineError(null);
    getCourseLearning(slug)
      .then(setOutline)
      .catch((e: ApiRequestError) => setOutlineError(e));
  }, [slug]);

  useEffect(() => {
    setOutline(null);
    loadOutline();
  }, [loadOutline]);

  // /learn/:slug -> jump to the lesson to continue with
  useEffect(() => {
    if (!lessonId && outline?.resumeLessonId) navigate(`/learn/${slug}/${outline.resumeLessonId}`, { replace: true });
  }, [lessonId, outline, slug, navigate]);

  useEffect(() => {
    if (!lessonId) return;
    let alive = true;
    setDetail(null);
    setLessonError(null);
    setSaveError('');
    setCelebrate(false);
    getLessonDetail(lessonId)
      .then((d) => alive && setDetail(d))
      .catch((e: ApiRequestError) => alive && setLessonError(e));
    window.scrollTo({ top: 0 });
    return () => {
      alive = false;
    };
  }, [lessonId]);

  useEffect(() => {
    document.title = `${detail?.lesson.title ?? outline?.course.title ?? 'Learn'} | VedaLearn`;
  }, [detail, outline]);

  const toggleDone = async (done: boolean) => {
    if (!detail || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const result = await setLessonDone(detail.lesson.id, done);
      setDetail((d) => (d ? { ...d, lesson: { ...d.lesson, completed: done } } : d));
      setOutline((o) =>
        o
          ? {
              ...o,
              progress: result.progress,
              modules: o.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === detail.lesson.id ? { ...l, completed: done } : l)) })),
            }
          : o,
      );
      if (result.courseCompleted) setCelebrate(true);
      return result;
    } catch (e) {
      setSaveError((e as Error).message || 'Could not save your progress');
    } finally {
      setSaving(false);
    }
  };

  const finishAndNext = async () => {
    if (!detail) return;
    if (!detail.lesson.completed && detail.canTrack) {
      const result = await toggleDone(true);
      if (!result) return; // failed: stay here
    }
    if (detail.nextId) navigate(`/learn/${slug}/${detail.nextId}`);
  };

  const onVideoEnded = () => {
    if (detail?.canTrack && !detail.lesson.completed && autoDone.current !== detail.lesson.id) {
      autoDone.current = detail.lesson.id;
      void toggleDone(true);
    }
  };

  if (outlineError) {
    const notEnrolled = outlineError.status === 403;
    return (
      <Message
        title={notEnrolled ? 'This course is not on your account yet' : 'Could not open the course'}
        text={notEnrolled ? 'Enroll in this course to start learning.' : outlineError.message}
        action={
          <>
            {notEnrolled ? (
              <Link to={`/courses/${slug}`} className="btn-primary">
                View course
              </Link>
            ) : (
              <button type="button" onClick={loadOutline} className="btn-primary">
                Try again
              </button>
            )}
            <Link to="/dashboard/my-courses" className="btn-outline">
              My Courses
            </Link>
          </>
        }
      />
    );
  }

  if (!outline) {
    return (
      <div className={`${BG} flex items-center justify-center`} role="status" aria-label="Loading course">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-gold/30 border-t-saffron" />
      </div>
    );
  }

  if (!outline.hasCurriculum) {
    return (
      <Message
        title={outline.course.title}
        text="The lessons of this course are being prepared. Please check back soon."
        action={
          <Link to="/dashboard/my-courses" className="btn-primary">
            Back to My Courses
          </Link>
        }
      />
    );
  }

  const { progress } = outline;
  const lesson = detail?.lesson;

  const sidebar = (
    <>
      <div className="mb-4 rounded-xl border border-gold/25 bg-white/70 p-3">
        <div className="flex items-center justify-between text-[0.8rem]">
          <span className="font-semibold text-veda-bark">Your progress</span>
          <span className="text-veda-muted">
            {progress.completed}/{progress.total} lessons · {progress.percent}%
          </span>
        </div>
        <ProgressBar percent={progress.percent} className="mt-2" />
      </div>
      <CourseOutline slug={slug} modules={outline.modules} currentId={lessonId} onNavigate={() => setListOpen(false)} />
    </>
  );

  return (
    <div className={BG}>
      <header className="sticky top-0 z-30 border-b border-gold/25 bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/dashboard/my-courses" aria-label="Back to My Courses" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-veda-brown hover:bg-gold-pale/60">
            <ArrowLeft size={19} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[1.02rem] font-bold leading-tight text-veda-bark">{outline.course.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <ProgressBar percent={progress.percent} className="max-w-[220px] flex-1" />
              <span className="text-[0.74rem] text-veda-muted">{progress.percent}%</span>
            </div>
          </div>
          <button type="button" onClick={() => setListOpen(true)} className="btn-outline !px-3 !py-2 lg:hidden" aria-label="Open lessons list">
            <ListVideo size={17} aria-hidden /> Lessons
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          {lessonError ? (
            <div className="rounded-2xl border border-gold/25 bg-white/70 p-8 text-center shadow-soft" role="alert">
              <h2 className="font-display text-[1.3rem] font-bold text-veda-bark">{lessonError.status === 403 ? 'This lesson is locked' : 'Could not open this lesson'}</h2>
              <p className="mt-1 text-[0.9rem] text-veda-muted">{lessonError.message}</p>
              {lessonError.status !== 403 && (
                <Link to={`/learn/${slug}`} className="btn-primary mt-4">
                  Go to your next lesson
                </Link>
              )}
            </div>
          ) : !detail || !lesson ? (
            <div className="space-y-4" aria-busy="true">
              <div className="aspect-video w-full animate-pulse rounded-2xl bg-gold-pale/60" />
              <div className="h-7 w-2/3 animate-pulse rounded bg-gold-pale/60" />
            </div>
          ) : (
            <>
              <LessonMedia lesson={lesson} onVideoEnded={onVideoEnded} />

              <div className="mt-4">
                <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-saffron">
                  Module {detail.module.number} · {detail.module.title}
                </p>
                <h1 className="mt-1 font-display text-[1.5rem] font-bold leading-snug text-veda-bark sm:text-[1.8rem]">{lesson.title}</h1>
                <p className="mt-1 text-[0.8rem] text-veda-muted">
                  Lesson {detail.position.index} of {detail.position.total}
                  {lesson.durationMin > 0 && ` · ${lesson.durationMin} min`}
                  {lesson.isPreview && ' · Free preview'}
                </p>
                {lesson.description && <p className="mt-3 text-[0.95rem] leading-relaxed text-veda-text">{lesson.description}</p>}
              </div>

              {celebrate && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900" role="status">
                  <PartyPopper size={22} className="mt-0.5 shrink-0" aria-hidden />
                  <div className="flex-1 text-[0.9rem]">
                    <p className="font-semibold">Course completed. Congratulations!</p>
                    <p>Your certificate is on your dashboard.</p>
                  </div>
                  <button type="button" onClick={() => setCelebrate(false)} aria-label="Dismiss" className="text-emerald-800 hover:opacity-70">
                    <X size={16} />
                  </button>
                </div>
              )}

              {lesson.resources.length > 0 && (
                <section className="mt-5">
                  <h2 className="mb-2 font-display text-[1.05rem] font-bold text-veda-bark">Resources</h2>
                  <ul className="space-y-1.5">
                    {lesson.resources.map((r, i) => (
                      <li key={`${r.url}-${i}`}>
                        <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[0.9rem] text-saffron hover:underline">
                          <ExternalLink size={14} aria-hidden /> {r.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-gold/25 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  {detail.prevId ? (
                    <Link to={`/learn/${slug}/${detail.prevId}`} className="btn-outline">
                      <ChevronLeft size={16} aria-hidden /> Previous
                    </Link>
                  ) : null}
                  {detail.canTrack && (
                    <button
                      type="button"
                      onClick={() => toggleDone(!lesson.completed)}
                      disabled={saving}
                      aria-pressed={lesson.completed}
                      className={lesson.completed ? 'btn border border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-60' : 'btn-outline disabled:opacity-60'}
                    >
                      <Check size={16} aria-hidden /> {lesson.completed ? 'Completed' : 'Mark as complete'}
                    </button>
                  )}
                </div>
                {detail.nextId ? (
                  <button type="button" onClick={finishAndNext} disabled={saving} className="btn-primary disabled:opacity-60">
                    {detail.canTrack && !lesson.completed ? 'Complete & Next' : 'Next lesson'} <ArrowRight size={16} aria-hidden />
                  </button>
                ) : (
                  <Link to="/dashboard/my-courses" className="btn-primary">
                    Back to My Courses
                  </Link>
                )}
              </div>
              {!detail.canTrack && <p className="mt-3 text-[0.8rem] text-veda-muted">{detail.lesson.isPreview ? 'Enroll in this course to save your progress.' : 'Preview mode: your progress is not saved.'}</p>}
              {saveError && (
                <p role="alert" className="mt-3 text-[0.85rem] text-red-700">
                  {saveError}
                </p>
              )}
            </>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px] max-h-[calc(100dvh-90px)] overflow-y-auto pr-1">{sidebar}</div>
        </aside>
      </div>

      {listOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Lessons">
          <button type="button" aria-label="Close lessons" onClick={() => setListOpen(false)} className="absolute inset-0 bg-veda-bark/50" />
          <div className="absolute inset-y-0 right-0 flex w-[22rem] max-w-[90vw] flex-col bg-ivory shadow-2xl">
            <div className="flex items-center justify-between border-b border-gold/25 px-4 py-3">
              <h2 className="font-display text-[1.1rem] font-bold text-veda-bark">Lessons</h2>
              <button type="button" onClick={() => setListOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gold-pale/60">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
          </div>
        </div>
      )}
    </div>
  );
}