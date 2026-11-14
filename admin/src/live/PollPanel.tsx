import { BarChart3, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PollState, Role } from './liveRoom';

interface Props {
  role: Role;
  poll: PollState | null;
  enabled: boolean;
  votedOption?: number;
  onStart?: (question: string, options: string[]) => Promise<{ ok: boolean; message?: string }>;
  onEnd?: () => Promise<unknown>;
  onVote?: (pollId: string, option: number) => Promise<{ ok: boolean; message?: string }>;
}

function Results({ poll, mine }: { poll: PollState; mine?: number }) {
  return (
    <div className="space-y-2.5">
      {poll.options.map((o, i) => {
        const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0;
        return (
          <div key={i}>
            <div className="flex justify-between gap-2 text-[0.84rem] text-ivory">
              <span className="min-w-0 break-words">
                {o.text} {mine === i && <span className="text-gold">· your vote</span>}
              </span>
              <span className="shrink-0 text-gold-soft">
                {o.votes} · {pct}%
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-saffron transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <p className="text-[0.74rem] text-gold-soft/70">{poll.total} vote{poll.total === 1 ? '' : 's'}</p>
    </div>
  );
}

export default function PollPanel({ role, poll, enabled, votedOption, onStart, onEnd, onVote }: Props) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!enabled) return <p className="p-6 text-center text-[0.85rem] text-gold-soft/70">Polls are turned off for this class.</p>;

  const field = 'w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-base text-ivory placeholder:text-gold-soft/50 focus:border-gold focus:outline-none sm:text-[0.86rem]';

  const start = async () => {
    setBusy(true);
    const res = await onStart!(question, options);
    setBusy(false);
    if (!res.ok) return setError(res.message ?? 'Could not start the poll');
    setError('');
    setQuestion('');
    setOptions(['', '']);
    return undefined;
  };

  return (
    <div className="thin-scroll h-full space-y-5 overflow-y-auto p-3.5">
      {poll && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wide text-gold">
            <BarChart3 size={13} /> {poll.open ? 'Poll is open' : 'Poll closed'}
          </p>
          <p className="mb-3 font-semibold text-ivory">{poll.question}</p>

          {role === 'student' && poll.open && votedOption === undefined ? (
            <div className="space-y-2">
              {poll.options.map((o, i) => (
                <button key={i} type="button" onClick={async () => setError((await onVote!(poll.id, i)).message ?? '')} className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-left text-[0.88rem] text-ivory transition hover:border-gold hover:bg-white/10">
                  {o.text}
                </button>
              ))}
              {error && <p className="text-[0.76rem] text-red-300">{error}</p>}
            </div>
          ) : (
            <Results poll={poll} mine={votedOption} />
          )}

          {role === 'host' && poll.open && (
            <button type="button" onClick={() => void onEnd?.()} className="mt-3.5 w-full rounded-xl border border-gold/50 px-3 py-2 text-[0.82rem] font-semibold text-gold transition hover:bg-gold/10">
              Close poll & show results
            </button>
          )}
        </section>
      )}

      {role === 'host' && (
        <section>
          <h3 className="mb-2 text-[0.82rem] font-bold text-ivory">{poll ? 'Start a new poll' : 'Ask students a question'}</h3>
          <div className="space-y-2">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={200} placeholder="Question" aria-label="Poll question" className={field} />
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input value={o} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} maxLength={80} placeholder={`Option ${i + 1}`} aria-label={`Option ${i + 1}`} className={field} />
                {options.length > 2 && (
                  <button type="button" aria-label="Remove option" onClick={() => setOptions(options.filter((_, j) => j !== i))} className="flex w-10 shrink-0 items-center justify-center rounded-xl text-gold-soft hover:bg-white/10">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button type="button" onClick={() => setOptions([...options, ''])} className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-gold hover:underline">
                <Plus size={14} /> Add option
              </button>
            )}
            {error && <p className="text-[0.76rem] text-red-300">{error}</p>}
            <button type="button" onClick={() => void start()} disabled={busy || !question.trim() || options.filter((o) => o.trim()).length < 2} className="w-full rounded-xl bg-gradient-to-r from-[#7A3E14] to-saffron px-4 py-2.5 text-[0.85rem] font-semibold text-white transition hover:brightness-110 disabled:opacity-40">
              Send poll to students
            </button>
          </div>
        </section>
      )}

      {role === 'student' && !poll && <p className="py-10 text-center text-[0.85rem] text-gold-soft/70">No poll right now. When the teacher asks a question it appears here.</p>}
    </div>
  );
}