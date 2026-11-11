import { Info, UserPlus, Save } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Modal from '@/components/common/Modal';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import type { Student } from '@/types';

export interface StudentFormValues {
  name: string;
  email: string;
  phone: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

interface Props {
  /** null = closed; a Student = edit; 'new' = add */
  target: Student | 'new' | null;
  onClose: () => void;
  /** throw an Error to show its message inside the form */
  onSubmit: (values: StudentFormValues) => Promise<void>;
}

export default function StudentFormModal({ target, onClose, onSubmit }: Props) {
  if (!target) return null;
  // remounts for every open so the fields always start fresh
  return <Form key={target === 'new' ? 'new' : target.id} target={target} onClose={onClose} onSubmit={onSubmit} />;
}

function Form({ target, onClose, onSubmit }: { target: Student | 'new'; onClose: () => void; onSubmit: Props['onSubmit'] }) {
  const editing = target !== 'new';
  const [values, setValues] = useState<StudentFormValues>({
    name: editing ? target.name : '',
    email: editing ? target.email : '',
    phone: editing ? target.phone : '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof StudentFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const validate = (): string => {
    const name = values.name.trim();
    if (name.length < 2 || name.length > 60) return 'Please enter the full name (2-60 characters).';
    if (!editing && !EMAIL_RE.test(values.email.trim())) return 'Please enter a valid email address.';
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) return 'Please enter a valid phone number.';
    return '';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = validate();
    if (problem) return setError(problem);

    setBusy(true);
    setError('');
    try {
      await onSubmit({ name: values.name.trim().replace(/\s+/g, ' '), email: values.email.trim().toLowerCase(), phone: values.phone.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={editing ? 'Edit student' : 'Add student'}
      subtitle={editing ? target.email : 'Create a learner account in one step'}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="student-form" disabled={busy} className={btnPrimary}>
            {busy ? <Spinner /> : editing ? <Save size={16} aria-hidden /> : <UserPlus size={16} aria-hidden />}
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create student'}
          </button>
        </div>
      }
    >
      <form id="student-form" onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Full name</span>
          <input value={values.name} onChange={set('name')} placeholder="e.g. Rohan Sharma" autoComplete="off" maxLength={60} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Email</span>
          <input type="email" value={values.email} onChange={set('email')} placeholder="student@example.com" autoComplete="off" disabled={editing} className={inputClass} />
          {editing && <span className="mt-1 block text-[0.74rem] text-veda-muted">The sign-in email can only be changed by the student.</span>}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
            Phone <span className="font-normal text-veda-muted">(optional, needed for WhatsApp)</span>
          </span>
          <input type="tel" inputMode="tel" value={values.phone} onChange={set('phone')} placeholder="+91 98765 43210" autoComplete="off" maxLength={20} className={inputClass} />
        </label>

        {!editing && (
          <div className="flex gap-2.5 rounded-xl border border-gold/30 bg-peach/60 p-3 text-[0.8rem] leading-snug text-veda-bark">
            <Info size={17} className="mt-0.5 shrink-0 text-saffron" aria-hidden />
            <p>
              A strong <b>random password</b> is generated automatically. You can share it with the student by email or WhatsApp right after creating the account, and the
              student <b>must change it</b> on the first login.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}