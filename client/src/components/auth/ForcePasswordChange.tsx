import { Eye, EyeOff, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { replaceToken } from '@/services/api';
import { changePassword } from '@/services/profile.service';

const passwordProblem = (current: string, next: string, confirm: string): string => {
  if (!current) return 'Please enter the temporary password you received.';
  if (next.length < 8) return 'New password must be at least 8 characters.';
  if (next.length > 72) return 'New password is too long (max 72 characters).';
  if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return 'New password must contain at least one letter and one number.';
  if (next === current) return 'New password must be different from the temporary one.';
  if (next !== confirm) return 'The two new passwords do not match.';
  return '';
};

/**
 * Full-screen, cannot-be-dismissed dialog shown to a student who signed in with a temporary password
 * (accounts created by an admin). The server also refuses every other request until this is done.
 */
export default function ForcePasswordChange() {
  const { user, updateUser, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const required = Boolean(user?.mustChangePassword);

  // lock page scroll behind the dialog
  useEffect(() => {
    if (!required) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [required]);

  if (!user || !required) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const problem = passwordProblem(current, next, confirm);
    if (problem) return setError(problem);

    setBusy(true);
    setError('');
    try {
      const token = await changePassword({ currentPassword: current, newPassword: next, remember: true });
      replaceToken(token);
      updateUser({ mustChangePassword: false });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password');
    } finally {
      setBusy(false);
    }
  };

  const field =
    'w-full rounded-xl border border-gold/30 bg-white/80 px-3.5 py-3 text-base text-veda-bark placeholder:text-veda-muted/70 transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25';

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-veda-bark/60 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="force-pw-title">
      <form
        onSubmit={onSubmit}
        noValidate
        className="max-h-[96dvh] w-full max-w-[440px] animate-rise-in overflow-y-auto rounded-t-3xl border border-gold/30 bg-ivory px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:rounded-3xl sm:pb-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-pale text-saffron">
            <KeyRound size={22} aria-hidden />
          </span>
          <div>
            <h2 id="force-pw-title" className="font-display text-[1.45rem] font-semibold leading-tight text-veda-bark">
              Set a new password
            </h2>
            <p className="text-[0.85rem] text-veda-muted">Namaste {user.name.split(' ')[0]}, one quick step first.</p>
          </div>
        </div>

        <p className="mt-4 flex gap-2.5 rounded-xl bg-cream px-3.5 py-3 text-[0.86rem] leading-snug text-veda-text">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-saffron" aria-hidden />
          Your account was created with a temporary password. For your safety please choose your own password before continuing.
        </p>

        <div className="mt-4 space-y-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[0.85rem] font-semibold text-veda-bark">Temporary password</span>
            <input type={show ? 'text' : 'password'} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="The password you were given" className={field} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.85rem] font-semibold text-veda-bark">New password</span>
            <input type={show ? 'text' : 'password'} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters, with a letter and a number" className={field} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.85rem] font-semibold text-veda-bark">Confirm new password</span>
            <input type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type the new password again" className={field} />
          </label>

          <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-2 text-[0.85rem] font-medium text-saffron hover:underline">
            {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            {show ? 'Hide passwords' : 'Show passwords'}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.85rem] text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-veda-brown px-5 py-3 text-[0.95rem] font-semibold text-ivory transition hover:bg-veda-bark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory/40 border-t-ivory" aria-hidden />}
          {busy ? 'Saving…' : 'Save and continue'}
        </button>

        <button type="button" onClick={logout} className="mx-auto mt-3 flex items-center gap-1.5 text-[0.85rem] text-veda-muted hover:text-veda-bark">
          <LogOut size={15} aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );
}