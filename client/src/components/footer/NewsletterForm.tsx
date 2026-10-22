import { ArrowRight } from 'lucide-react';
import { FormEvent, useId, useState } from 'react';
import { subscribeToNewsletter } from '@/services/newsletter.service';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const inputId = useId();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    try {
      setMessage(await subscribeToNewsletter(email.trim()));
      setStatus('success');
      setEmail('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <div className="flex overflow-hidden rounded-lg border border-ivory/20 bg-ivory/95 focus-within:border-gold">
        <input
          id={inputId}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder="Enter your email"
          autoComplete="email"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-veda-bark placeholder:text-veda-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          aria-label="Subscribe"
          className="flex w-11 shrink-0 items-center justify-center bg-veda-brown text-ivory transition-colors hover:bg-saffron disabled:opacity-60"
        >
          <ArrowRight size={16} aria-hidden />
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-4 text-xs ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}
      >
        {status === 'success' || status === 'error' ? message : ''}
      </p>
    </form>
  );
}