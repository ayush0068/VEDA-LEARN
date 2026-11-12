import { Info, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Modal from '@/components/common/Modal';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import type { InstructorOptions, InstructorRole } from '@/types/instructor';
import { ROLE_LABEL } from '@/utils/schedule';

export interface InstructorFormValues {
  name: string;
  email: string;
  phone: string;
  title: string;
  instructorRole: InstructorRole;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

interface Props {
  open: boolean;
  options: InstructorOptions | null;
  onClose: () => void;
  /** throw an Error to show its message inside the form */
  onSubmit: (values: InstructorFormValues) => Promise<void>;
}

export default function InstructorFormModal({ open, ...rest }: Props) {
  if (!open) return null;
  return <Form {...rest} />;
}

function Form({ options, onClose, onSubmit }: Omit<Props, 'open'>) {
  const [values, setValues] = useState<InstructorFormValues>({ name: '', email: '', phone: '', title: '', instructorRole: 'instructor' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof InstructorFormValues) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const role = options?.roles.find((r) => r.value === values.instructorRole);
  const roleList = options?.roles ?? (Object.keys(ROLE_LABEL) as InstructorRole[]).map((value) => ({ value, label: ROLE_LABEL[value], description: '' }));

  const validate = (): string => {
    const name = values.name.trim();
    if (name.length < 2 || name.length > 60) return 'Please enter the full name (2-60 characters).';
    if (!EMAIL_RE.test(values.email.trim())) return 'Please enter a valid email address.';
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) return 'Please enter a valid phone number.';
    if (values.title.trim().length > 80) return 'Title can be at most 80 characters.';
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
      await onSubmit({ ...values, name: values.name.trim().replace(/\s+/g, ' '), email: values.email.trim().toLowerCase(), phone: values.phone.trim(), title: values.title.trim() });
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
      title="Add instructor"
      subtitle="Create the account, then set their access and schedule"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="instructor-form" disabled={busy} className={btnPrimary}>
            {busy ? <Spinner /> : <UserPlus size={16} aria-hidden />}
            {busy ? 'Creating…' : 'Create instructor'}
          </button>
        </div>
      }
    >
      <form id="instructor-form" onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Full name</span>
          <input value={values.name} onChange={set('name')} placeholder="e.g. Acharya Ramesh Pandey" autoComplete="off" maxLength={60} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Email</span>
          <input type="email" value={values.email} onChange={set('email')} placeholder="instructor@example.com" autoComplete="off" className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
            Phone <span className="font-normal text-veda-muted">(optional, needed for WhatsApp)</span>
          </span>
          <input type="tel" inputMode="tel" value={values.phone} onChange={set('phone')} placeholder="+91 98765 43210" autoComplete="off" maxLength={20} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
            Title <span className="font-normal text-veda-muted">(optional)</span>
          </span>
          <input value={values.title} onChange={set('title')} placeholder="e.g. Jyotish Acharya" maxLength={80} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Role</span>
          <select value={values.instructorRole} onChange={set('instructorRole')} className={`${inputClass} cursor-pointer`}>
            {roleList.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {role && <span className="mt-1 block text-[0.76rem] text-veda-muted">{role.description} You can fine-tune each permission afterwards.</span>}
        </label>

        <div className="flex gap-2.5 rounded-xl border border-gold/30 bg-peach/60 p-3 text-[0.8rem] leading-snug text-veda-bark">
          <Info size={17} className="mt-0.5 shrink-0 text-saffron" aria-hidden />
          <p>
            A strong <b>random password</b> is generated automatically and can be shared by email or WhatsApp. The instructor <b>must change it</b> on the first login.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}