import { CheckCircle2, LayoutGrid, Loader2, Mail, MessageCircle, Send, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AuthField } from '@/components/auth/AuthField';
import { AuthError } from '@/components/auth/AuthParts';
import { MESSAGE_MAX, QUERY_TYPES } from '@/constants/contact';
import { sendContactMessage } from '@/services/contact.service';
import { emailError, messageError, nameError, queryTypeError } from '@/utils/validators';
import { ContactSelect, ContactTextarea } from './ContactFields';
import { CardCorner, CardLotus } from './ContactOrnaments';

interface FieldErrors {
  name?: string;
  email?: string;
  queryType?: string;
  message?: string;
}

/** "Send Us a Message" card. Validates in the browser (same rules as the server), then POSTs to /api/contact. */
export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [queryType, setQueryType] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** editing a field clears its own error and the old success / server banners */
  const touch = <K extends keyof FieldErrors>(key: K, setter: (v: string) => void) => (value: string) => {
    setter(value);
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    if (success) setSuccess('');
    if (serverError) setServerError('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors: FieldErrors = {
      name: nameError(name) || undefined,
      email: emailError(email) || undefined,
      queryType: queryTypeError(queryType) || undefined,
      message: messageError(message, MESSAGE_MAX) || undefined,
    };
    setErrors(nextErrors);
    setServerError('');
    setSuccess('');
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const msg = await sendContactMessage({
        name: name.trim().replace(/\s+/g, ' '),
        email: email.trim(),
        queryType,
        message: message.trim(),
      });
      setSuccess(msg);
      setName('');
      setEmail('');
      setQueryType('');
      setMessage('');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative pt-7">
      {/* lotus sits on the card's top border */}
      <CardLotus className="absolute left-1/2 top-0 z-10 h-[3.1rem] w-[5.6rem] -translate-x-1/2" />

      <section
        className="relative rounded-[1.6rem] border border-gold/50 bg-ivory/90 px-5 pb-7 pt-9 shadow-soft backdrop-blur-[1px] sm:px-8 sm:pb-8"
        aria-labelledby="contact-form-heading"
      >
        <CardCorner className="pointer-events-none absolute left-1.5 top-1.5 h-12 w-12 text-saffron/70" />
        <CardCorner flip className="pointer-events-none absolute right-1.5 top-1.5 h-12 w-12 text-saffron/70" />

        <h2 id="contact-form-heading" className="text-center font-display text-[2rem] font-bold leading-tight text-veda-bark sm:text-[2.25rem]">
          Send Us a Message
        </h2>
        <p className="mt-1.5 text-center text-[0.92rem] text-veda-muted">Fill in the details below and our team will get back to you soon.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <AuthField icon={UserRound} label="Your Name *" name="name" value={name} onChange={touch('name', setName)} autoComplete="name" error={errors.name} />
            <AuthField icon={Mail} label="Your Email *" name="email" type="email" value={email} onChange={touch('email', setEmail)} autoComplete="email" error={errors.email} />
          </div>

          <ContactSelect icon={LayoutGrid} label="Query Type *" name="queryType" value={queryType} options={QUERY_TYPES} onChange={touch('queryType', setQueryType)} error={errors.queryType} />

          <ContactTextarea icon={MessageCircle} label="Your Message *" name="message" value={message} onChange={touch('message', setMessage)} maxLength={MESSAGE_MAX} error={errors.message} />

          <AuthError message={serverError} />

          {success && (
            <div role="status" aria-live="polite" className="flex items-start gap-2 rounded-xl border border-emerald-300/70 bg-emerald-50/80 px-3.5 py-2.5 text-[0.88rem] text-emerald-900">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-[3.2rem] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-b from-[#7a3d14] to-[#4a230b] text-[1.02rem] font-semibold text-ivory shadow-[0_12px_24px_-10px_rgba(62,31,11,0.75)] transition hover:from-[#5a2d0f] hover:to-[#3e1f0b] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Send size={18} strokeWidth={1.6} aria-hidden />}
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </section>
    </div>
  );
}