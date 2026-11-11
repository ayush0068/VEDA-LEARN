import { Check, Copy, Eye, EyeOff, Mail, MessageCircle, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/common/Modal';
import { Spinner, btnPrimary, btnSecondary } from '@/components/common/ui';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/services/api';
import { emailCredentials } from '@/services/students.service';
import type { Credentials } from '@/services/students.service';
import { buildShareMessage, copyText, mailtoLink, whatsappLink } from '@/utils/share';

export interface CredentialsView extends Credentials {
  reason: 'created' | 'reset';
}

interface Props {
  credentials: CredentialsView | null;
  /** true when the server can send e-mail itself (SMTP set in server/.env) */
  emailConfigured: boolean;
  onClose: () => void;
}

export default function CredentialsModal({ credentials, emailConfigured, onClose }: Props) {
  if (!credentials) return null;
  return <Body key={credentials.student.id + credentials.temporaryPassword} credentials={credentials} emailConfigured={emailConfigured} onClose={onClose} />;
}

function Body({ credentials, emailConfigured, onClose }: { credentials: CredentialsView; emailConfigured: boolean; onClose: () => void }) {
  const { student, temporaryPassword, reason } = credentials;
  const toast = useToast();
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState<'password' | 'message' | null>(null);
  const [mailState, setMailState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const message = buildShareMessage({ name: student.name, email: student.email, password: temporaryPassword });
  const mailto = mailtoLink(student.email, message);
  const whatsapp = whatsappLink(student.phone, message);

  const copy = async (what: 'password' | 'message') => {
    const ok = await copyText(what === 'password' ? temporaryPassword : message);
    if (!ok) return toast.error('Could not copy. Please select and copy it manually.');
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const sendEmail = async () => {
    // no SMTP on the server -> use the admin's own mail app with the message prefilled
    if (!emailConfigured) {
      window.location.href = mailto;
      return;
    }

    setMailState('sending');
    try {
      await emailCredentials(student.id, temporaryPassword);
      setMailState('sent');
      toast.success(`Login details emailed to ${student.email}`);
    } catch (err) {
      setMailState('idle');
      if (err instanceof ApiError && err.status === 503) {
        toast.error('The server could not send the email, opening your mail app instead.');
        window.location.href = mailto;
      } else {
        toast.error(err instanceof Error ? err.message : 'Could not send the email');
      }
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={mailState === 'sending'}
      title={reason === 'created' ? 'Student created' : 'Password reset'}
      subtitle={reason === 'created' ? `${student.name}'s account is ready` : `New temporary password for ${student.name}`}
      footer={
        <button type="button" onClick={onClose} className={`${btnPrimary} w-full`}>
          Done
        </button>
      }
    >
      <div className="space-y-4">
        {/* credentials */}
        <div className="rounded-2xl border border-line bg-white/70 p-4">
          <dl className="space-y-3 text-[0.85rem]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-veda-muted">Email</dt>
              <dd className="min-w-0 truncate font-semibold text-veda-bark">{student.email}</dd>
            </div>
            <div>
              <dt className="mb-1.5 text-veda-muted">Temporary password</dt>
              <dd className="flex items-center gap-2">
                <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-peach px-3 py-2.5 font-mono text-[1.02rem] font-semibold tracking-wide text-veda-bark">
                  {visible ? temporaryPassword : '•'.repeat(temporaryPassword.length)}
                </code>
                <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white/80 text-veda-muted hover:text-veda-bark">
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
                <button type="button" onClick={() => copy('password')} aria-label="Copy password" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white/80 text-veda-muted hover:text-veda-bark">
                  {copied === 'password' ? <Check size={17} className="text-ok" /> : <Copy size={17} />}
                </button>
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-[0.8rem] leading-snug text-amber-900">
          <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            Share it now: this password is <b>not shown again</b> (you can always generate a new one with <i>Reset password</i>). The student will be forced to choose a new
            password on the first login.
          </p>
        </div>

        {/* share */}
        <div>
          <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">Share with the student</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={sendEmail} disabled={mailState === 'sending'} className={btnSecondary}>
              {mailState === 'sending' ? <Spinner /> : mailState === 'sent' ? <Check size={17} className="text-ok" /> : <Mail size={17} aria-hidden />}
              {mailState === 'sent' ? 'Email sent' : emailConfigured ? 'Send by email' : 'Open email app'}
            </button>

            <a href={whatsapp} target="_blank" rel="noreferrer" className={`${btnSecondary} hover:!border-[#25D366]/60`}>
              <MessageCircle size={17} className="text-[#1FAF54]" aria-hidden />
              Share on WhatsApp
            </a>
          </div>

          {!student.phone && <p className="mt-2 text-[0.76rem] text-veda-muted">No phone number saved: WhatsApp will let you pick the contact. Add one with “Edit student”.</p>}

          <button type="button" onClick={() => copy('message')} className="mt-2.5 inline-flex items-center gap-2 text-[0.8rem] font-semibold text-saffron hover:underline">
            {copied === 'message' ? <Check size={15} /> : <Copy size={15} />}
            {copied === 'message' ? 'Message copied' : 'Copy the full message'}
          </button>
        </div>
      </div>
    </Modal>
  );
}