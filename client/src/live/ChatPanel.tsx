import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ChatMessage } from './liveRoom';

const TIME = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export default function ChatPanel({ messages, meId, disabled, disabledText, onSend }: { messages: ChatMessage[]; meId: string; disabled?: boolean; disabledText?: string; onSend: (text: string) => Promise<{ ok: boolean; message?: string }> }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    const res = await onSend(value);
    setError(res.ok ? '' : (res.message ?? 'Could not send'));
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="thin-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3" aria-live="polite">
        {messages.length === 0 && <p className="py-10 text-center text-[0.84rem] text-gold-soft/70">No messages yet. Say hello 🙏</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.userId === meId ? 'items-end' : 'items-start'}`}>
            <p className="mb-0.5 flex items-center gap-1.5 text-[0.7rem] text-gold-soft/80">
              <b className={m.role === 'host' ? 'text-gold' : ''}>{m.userId === meId ? 'You' : m.name}</b>
              {m.role === 'host' && <span className="rounded bg-gold/20 px-1 text-[0.6rem] font-bold uppercase text-gold">Teacher</span>}
              <span>{TIME.format(new Date(m.at))}</span>
            </p>
            <p className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-[0.86rem] leading-snug ${m.userId === meId ? 'rounded-br-md bg-saffron/90 text-white' : 'rounded-bl-md bg-white/10 text-ivory'}`}>{m.text}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={submit} className="border-t border-white/10 p-2.5">
        {error && <p className="mb-1.5 px-1 text-[0.74rem] text-red-300">{error}</p>}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            disabled={disabled}
            placeholder={disabled ? (disabledText ?? 'Chat is off') : 'Type a message…'}
            aria-label="Chat message"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-base text-ivory placeholder:text-gold-soft/50 focus:border-gold focus:outline-none sm:text-[0.88rem]"
          />
          <button type="submit" disabled={disabled || !text.trim()} aria-label="Send" className="flex h-[2.6rem] w-11 shrink-0 items-center justify-center rounded-xl bg-saffron text-white transition hover:brightness-110 disabled:opacity-40">
            <Send size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}