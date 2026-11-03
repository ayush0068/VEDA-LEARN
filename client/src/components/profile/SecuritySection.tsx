import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isTokenRemembered, replaceToken } from '@/services/api';
import { changePassword } from '@/services/profile.service';
import { Field, FormError, SectionCard, inputCls } from './ProfileParts';
import { useProfileContext } from './profileContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} maxLength={200} className={`${inputCls} pr-11`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-veda-muted hover:bg-gold-pale/60"
      >
        {show ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
      </button>
    </div>
  );
}

function EmailCard() {
  const { profile, setEmail, notify } = useProfileContext();
  const [email, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) return setError('Please enter a valid email address');
    if (!password) return setError('Please enter your current password to confirm');

    setSaving(true);
    setError('');
    try {
      await setEmail({ email: clean, password });
      setNewEmail('');
      setPassword('');
      notify('Email updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your email');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard Icon={Mail} title="Email Address" subtitle={`Currently ${profile.email}`}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New email" htmlFor="sec-email">
            <input id="sec-email" type="email" value={email} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" maxLength={254} className={inputCls} />
          </Field>
          <Field label="Current password" htmlFor="sec-email-pass">
            <PasswordInput id="sec-email-pass" value={password} onChange={setPassword} autoComplete="current-password" />
          </Field>
        </div>
        <FormError message={error} />
        <button type="submit" disabled={saving || !email || !password} className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Updating…' : 'Update Email'}
        </button>
      </form>
    </SectionCard>
  );
}

function PasswordCard() {
  const { notify } = useProfileContext();
  const { logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!current) return setError('Please enter your current password');
    if (next.length < 8) return setError('New password must be at least 8 characters');
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return setError('New password must contain at least one letter and one number');
    if (next !== confirm) return setError('The new passwords do not match');

    setSaving(true);
    setError('');
    try {
      // the server signs every older token out and hands back a fresh one for this device
      const token = await changePassword({ currentPassword: current, newPassword: next, remember: isTokenRemembered() });
      replaceToken(token);
      setCurrent('');
      setNext('');
      setConfirm('');
      notify('Password changed. Other devices have been signed out.');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 401) logout();
      setError(err instanceof Error ? err.message : 'Could not change your password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard Icon={KeyRound} title="Change Password" subtitle="Use at least 8 characters with a letter and a number.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password" htmlFor="sec-cur">
            <PasswordInput id="sec-cur" value={current} onChange={setCurrent} autoComplete="current-password" />
          </Field>
          <Field label="New password" htmlFor="sec-new">
            <PasswordInput id="sec-new" value={next} onChange={setNext} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password" htmlFor="sec-confirm">
            <PasswordInput id="sec-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </Field>
        </div>
        <FormError message={error} />
        <button type="submit" disabled={saving || !current || !next || !confirm} className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Changing…' : 'Change Password'}
        </button>
      </form>
    </SectionCard>
  );
}

export default function SecuritySection() {
  const { profile } = useProfileContext();
  return (
    <div className="space-y-5">
      <EmailCard />
      <PasswordCard />
      <SectionCard Icon={ShieldCheck} title="Phone Number" subtitle="Used for class reminders and account recovery.">
        <p className="text-[0.95rem] text-veda-text">
          {profile.phone || 'No phone number added yet.'}{' '}
          <Link to="/profile/personal" className="font-medium text-veda-brown underline decoration-gold/60 underline-offset-2 hover:text-saffron">
            {profile.phone ? 'Change' : 'Add one'} in Personal Information
          </Link>
        </p>
      </SectionCard>
    </div>
  );
}