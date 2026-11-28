import { AlarmClock, ArrowLeft, Award, CheckCircle2, ExternalLink, FileText, Link2, Loader2, MessageSquareText, RotateCcw, Send, Trash2, UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { CARD } from '@/components/dashboard/DashParts';
import { Confetti, ScoreRing, dueIn, formatWhen } from '@/components/assessments/AssessParts';
import { getAssignment, submitAssignment, uploadFile } from '@/services/assessment.service';
import type { ApiRequestError } from '@/services/api';
import type { AssignmentDetail, UploadedFile } from '@/types/assessments';
import { ASSESS_BASE } from './DashboardAssessments';

const MAX = 10 * 1024 * 1024;
const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

interface Pending {
  id: string;
  name: string;
  size: number;
  progress: number;
  error?: string;
}

const STEPS = ['Handed in', 'Reviewed', 'Graded'];

export default function AssignmentPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<AssignmentDetail | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const input = useRef<HTMLInputElement>(null);

  const apply = useCallback((d: AssignmentDetail) => {
    setData(d);
    setText(d.submission?.text ?? '');
    setLink(d.submission?.link ?? '');
    setFiles(d.submission?.files ?? []);
  }, []);

  useEffect(() => {
    getAssignment(id).then(apply).catch((e: ApiRequestError) => setError(e));
  }, [id, apply]);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const a = data?.assignment;

  const addFiles = (list: FileList | File[]) => {
    if (!a) return;
    Array.from(list).forEach((file) => {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`;
      if (files.length + pending.filter((p) => !p.error).length >= a.maxFiles) {
        setFormError(`You can attach at most ${a.maxFiles} files.`);
        return;
      }
      if (file.size > MAX) return setPending((p) => [...p, { id: key, name: file.name, size: file.size, progress: 0, error: 'Larger than 10 MB' }]);
      if (file.type && !OK_TYPES.includes(file.type)) return setPending((p) => [...p, { id: key, name: file.name, size: file.size, progress: 0, error: 'Use PDF, Word, text, image or ZIP' }]);
      setFormError('');
      setPending((p) => [...p, { id: key, name: file.name, size: file.size, progress: 0 }]);
      uploadFile(file, (progress) => setPending((p) => p.map((x) => (x.id === key ? { ...x, progress } : x))))
        .then((done) => {
          setFiles((f) => [...f, done]);
          setPending((p) => p.filter((x) => x.id !== key));
        })
        .catch((e: ApiRequestError) => setPending((p) => p.map((x) => (x.id === key ? { ...x, error: e.message } : x))));
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a) return;
    if (pending.some((p) => !p.error)) return setFormError('Please wait for your files to finish uploading.');
    if (!text.trim() && !link.trim() && files.length === 0) return setFormError('Add your answer, a link or a file first.');
    setBusy(true);
    setFormError('');
    try {
      await submitAssignment(id, { text, link, files });
      apply(await getAssignment(id));
      setEditing(false);
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 3500);
    } catch (err) {
      setFormError((err as ApiRequestError).message);
    } finally {
      setBusy(false);
    }
  };

  if (error)
    return (
      <div className="px-4 py-10">
        <div className={`${CARD} mx-auto max-w-md p-8 text-center`}>
          <h1 className="font-display text-2xl font-bold text-veda-bark">{error.status === 403 ? 'Enroll to open this assignment' : 'Assignment not found'}</h1>
          <p className="mt-2 text-sm text-veda-muted">{error.message}</p>
          <Link to={ASSESS_BASE} className="btn-primary mt-5">
            Back
          </Link>
        </div>
      </div>
    );
  if (!data || !a)
    return (
      <div className="flex justify-center py-20" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-saffron" />
      </div>
    );

  const sub = data.submission;
  const due = dueIn(a.dueAt, now);
  const showForm = a.canSubmit && (!sub || sub.status === 'returned' || editing);
  const step = !sub ? -1 : sub.status === 'graded' ? 2 : sub.status === 'returned' ? 1 : 0;
  const ways = a.submissionTypes;
  const dueTone = due.tone === 'late' ? 'bg-red-100 text-red-700' : due.tone === 'soon' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';

  return (
    <div className="mx-auto max-w-[900px] space-y-5 px-4 py-5 sm:px-6 sm:py-7">
      <Confetti run={celebrate} />
      <Link to={ASSESS_BASE} className="inline-flex items-center gap-1.5 text-sm font-medium text-veda-muted transition hover:text-saffron">
        <ArrowLeft size={15} aria-hidden /> Quizzes &amp; Assignments
      </Link>

      <section className={`${CARD} aq-rise p-6 sm:p-8`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-saffron">{a.courseTitle}</p>
        <h1 className="mt-1 font-display text-[1.9rem] font-bold leading-tight text-veda-bark sm:text-[2.3rem]">{a.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.8rem]">
          {!sub && a.dueAt && (
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold ${dueTone}`}>
              <AlarmClock size={13} aria-hidden /> {due.text}
            </span>
          )}
          <span className="rounded-md bg-cream px-2.5 py-1 font-medium text-veda-muted">Due {formatWhen(a.dueAt)}</span>
          <span className="rounded-md bg-cream px-2.5 py-1 font-medium text-veda-muted">{a.maxPoints} marks</span>
          {!a.allowLate && <span className="rounded-md bg-cream px-2.5 py-1 font-medium text-veda-muted">No late hand-ins</span>}
        </div>

        {/* progress steps */}
        <ol className="mt-6 flex items-center" aria-label="Progress">
          {STEPS.map((label, i) => {
            const done = i <= step;
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <span className="flex flex-col items-center gap-1">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-500 ${done ? 'bg-saffron text-white' : 'bg-gold/15 text-veda-muted'}`}>{done ? <CheckCircle2 size={16} aria-hidden /> : i + 1}</span>
                  <span className={`text-[0.7rem] font-semibold ${done ? 'text-veda-bark' : 'text-veda-muted'}`}>{label}</span>
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-2 mb-4 h-0.5 flex-1 overflow-hidden rounded bg-gold/20">
                    <span className="block h-full bg-saffron transition-[width] duration-700" style={{ width: i < step ? '100%' : '0%' }} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {a.description && (
          <div className="mt-6">
            <h2 className="font-display text-[1.2rem] font-bold text-veda-bark">Instructions</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-veda-text">{a.description}</p>
          </div>
        )}
        {a.resources.length > 0 && (
          <div className="mt-5">
            <h2 className="font-display text-[1.2rem] font-bold text-veda-bark">Helpful resources</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {a.resources.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-white/70 px-3 py-1.5 text-sm font-medium text-veda-brown transition hover:border-gold hover:text-saffron">
                    <ExternalLink size={13} aria-hidden /> {r.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* teacher's grade + feedback */}
      {sub && sub.status !== 'submitted' && (
        <section className={`${CARD} aq-pop flex flex-col items-center gap-5 p-6 sm:flex-row sm:p-7`} aria-label="Your grade">
          {sub.status === 'graded' && sub.grade !== null ? <ScoreRing percent={Math.round((sub.grade / a.maxPoints) * 100)} size={110} stroke={10} tone="stroke-[#2e9b3e]" label={`${sub.grade}/${a.maxPoints}`} /> : <span className="flex h-[110px] w-[110px] shrink-0 items-center justify-center rounded-full bg-peach text-saffron"><RotateCcw size={38} aria-hidden /></span>}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="flex items-center justify-center gap-2 font-display text-[1.45rem] font-bold text-veda-bark sm:justify-start">
              {sub.status === 'graded' ? <Award size={22} className="text-saffron" aria-hidden /> : null} {sub.status === 'graded' ? 'Graded' : 'Please make some changes'}
            </h2>
            {sub.feedback ? (
              <p className="mt-2 flex items-start gap-2 rounded-xl bg-[#fdf1da] px-3.5 py-3 text-left text-[0.92rem] leading-relaxed text-veda-text">
                <MessageSquareText size={17} className="mt-0.5 shrink-0 text-saffron" aria-hidden /> <span className="whitespace-pre-wrap">{sub.feedback}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-veda-muted">No written feedback this time.</p>
            )}
          </div>
        </section>
      )}

      {/* what was handed in */}
      {sub && !showForm && (
        <section className={`${CARD} aq-rise p-6`} aria-label="Your submission">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-[1.3rem] font-bold text-veda-bark">
              <CheckCircle2 size={20} className="text-green-700" aria-hidden /> Your submission
            </h2>
            <span className="text-xs text-veda-muted">
              {formatWhen(sub.submittedAt)}
              {sub.late && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-red-700">Late</span>}
              {sub.version > 1 && ` · version ${sub.version}`}
            </span>
          </div>
          {sub.text && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/70 p-3.5 text-[0.92rem] leading-relaxed text-veda-text">{sub.text}</p>}
          {sub.link && (
            <a href={sub.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron hover:underline">
              <Link2 size={14} aria-hidden /> {sub.link}
            </a>
          )}
          {sub.files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {sub.files.map((f) => (
                <li key={f.url}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-white/70 px-3 py-1.5 text-sm font-medium text-veda-bark hover:border-gold">
                    <FileText size={14} aria-hidden /> {f.name} <span className="text-xs text-veda-muted">{kb(f.size)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {a.canSubmit && sub.status === 'submitted' && (
            <button type="button" onClick={() => setEditing(true)} className="btn-outline mt-4">
              <RotateCcw size={15} aria-hidden /> Edit &amp; resubmit
            </button>
          )}
          {!a.canSubmit && sub.status === 'submitted' && <p className="mt-3 text-sm text-veda-muted">Your teacher will review it soon.</p>}
        </section>
      )}

      {/* hand-in form */}
      {showForm && (
        <form onSubmit={submit} className={`${CARD} aq-rise space-y-5 p-6 sm:p-7`} aria-label="Hand in your work">
          <h2 className="font-display text-[1.4rem] font-bold text-veda-bark">{sub ? 'Update your work' : 'Your work'}</h2>

          {ways.includes('text') && (
            <div>
              <label htmlFor="asg-text" className="mb-1.5 flex justify-between text-sm font-semibold text-veda-bark">
                <span>Your answer</span>
                <span className="text-xs font-normal text-veda-muted">{text.length}/10000</span>
              </label>
              <textarea id="asg-text" value={text} onChange={(e) => setText(e.target.value)} rows={8} maxLength={10000} placeholder="Write your answer here…" className="w-full rounded-2xl border-2 border-gold/25 bg-white px-4 py-3 text-base leading-relaxed text-veda-bark transition focus:border-saffron focus:outline-none focus:ring-4 focus:ring-gold/20" />
            </div>
          )}

          {ways.includes('link') && (
            <div>
              <label htmlFor="asg-link" className="mb-1.5 block text-sm font-semibold text-veda-bark">
                Link <span className="font-normal text-veda-muted">(Google Drive, YouTube, GitHub…)</span>
              </label>
              <input id="asg-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="w-full rounded-2xl border-2 border-gold/25 bg-white px-4 py-3 text-base text-veda-bark transition focus:border-saffron focus:outline-none focus:ring-4 focus:ring-gold/20" />
            </div>
          )}

          {ways.includes('file') && (
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-veda-bark">
                Files <span className="font-normal text-veda-muted">(up to {a.maxFiles}, 10 MB each)</span>
              </span>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${drag ? 'scale-[1.01] border-saffron bg-peach/60' : 'border-gold/40 bg-white/50 hover:border-gold'}`}
              >
                <UploadCloud size={30} className={`mx-auto text-saffron ${drag ? 'animate-bounce' : ''}`} aria-hidden />
                <p className="mt-2 text-sm font-medium text-veda-bark">Drag &amp; drop files here</p>
                <button type="button" onClick={() => input.current?.click()} className="mt-1 text-sm font-semibold text-saffron underline-offset-2 hover:underline">
                  or browse your device
                </button>
                <p className="mt-1 text-xs text-veda-muted">PDF, Word, text, image or ZIP</p>
                <input ref={input} type="file" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} aria-label="Choose files" />
              </div>

              {(files.length > 0 || pending.length > 0) && (
                <ul className="mt-3 space-y-2">
                  {files.map((f) => (
                    <li key={f.url} className="aq-pop flex items-center gap-3 rounded-xl border border-gold/25 bg-white/80 px-3 py-2">
                      <CheckCircle2 size={17} className="shrink-0 text-green-700" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-veda-bark">{f.name}</span>
                      <span className="text-xs text-veda-muted">{kb(f.size)}</span>
                      <button type="button" onClick={() => setFiles((l) => l.filter((x) => x.url !== f.url))} aria-label={`Remove ${f.name}`} className="rounded-lg p-1.5 text-veda-muted hover:bg-red-50 hover:text-red-700">
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                  {pending.map((p) => (
                    <li key={p.id} className="rounded-xl border border-gold/25 bg-white/80 px-3 py-2">
                      <div className="flex items-center gap-3">
                        {p.error ? <span className="text-red-700">!</span> : <Loader2 size={16} className="shrink-0 animate-spin text-saffron" aria-hidden />}
                        <span className="min-w-0 flex-1 truncate text-sm text-veda-bark">{p.name}</span>
                        {p.error ? (
                          <button type="button" onClick={() => setPending((l) => l.filter((x) => x.id !== p.id))} className="text-xs font-semibold text-red-700 hover:underline">
                            Dismiss
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-veda-muted">{p.progress}%</span>
                        )}
                      </div>
                      {p.error ? <p className="mt-1 text-xs text-red-700">{p.error}</p> : <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gold/15"><div className="h-full rounded-full bg-gradient-to-r from-gold to-saffron transition-[width] duration-200" style={{ width: `${p.progress}%` }} /></div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {formError && (
            <p role="alert" className="aq-shake rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {formError}
            </p>
          )}
          {a.dueAt && due.tone === 'late' && <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">The deadline has passed. Your work will be marked as late.</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {editing && (
              <button type="button" onClick={() => apply(data)} className="btn-outline" disabled={busy}>
                Cancel
              </button>
            )}
            <button type="submit" disabled={busy} className="btn-primary aq-shine !px-7 !py-3">
              {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />} {sub ? 'Resubmit' : 'Submit assignment'}
            </button>
          </div>
        </form>
      )}

      {!sub && !a.canSubmit && <div className={`${CARD} p-6 text-center text-sm font-semibold text-veda-muted`}>The deadline has passed and late hand-ins are not accepted.</div>}
    </div>
  );
}