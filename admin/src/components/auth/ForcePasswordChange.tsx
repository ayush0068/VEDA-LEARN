import { Eye, EyeOff, KeyRound, LogOut } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { LotusMark } from '@/components/common/Art';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import { useAuth } from '@/context/AuthContext';

/** Shown instead of the panel while an admin still has the temporary password the super admin gave them. */
export default function ForcePasswordChange() {
  const { user, setOwnPassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return setError('Use at least 8 characters with a letter and a number.');
    if (next !== again) return setError('The two new passwords do not match.');
    if (next === current) return setError('Your new password must be different from the temporary one.');

    setBusy(true);
    try {
      await setOwnPassword(current, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password');
      setBusy(false);
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-line bg-ivory p-6 shadow-xl shadow-veda-brown/15 sm:p-7" aria-labelledby="fpc-title">
        <LotusMark className="mx-auto h-11 w-11" />
        <h1 id="fpc-title" className="mt-2 text-center font-display text-[1.6rem] font-bold text-veda-bark">
          Choose your password
        </h1>
        <p className="mt-1 text-center text-[0.88rem] text-veda-muted">
          Namaste {user?.name}! You signed in with a temporary password. Set your own to open the admin panel.
        </p>

        <div className="mt-5 space-y-3.5">
          <label className="block text-[0.82rem] font-semibold text-veda-bark">
            Temporary password
            <input type={type} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-[0.82rem] font-semibold text-veda-bark">
            New password
            <input type={type} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={8} className={`${inputClass} mt-1`} />
            <span className="mt-1 block text-[0.74rem] font-normal text-veda-muted">At least 8 characters, with a letter and a number.</span>
          </label>
          <label className="block text-[0.82rem] font-semibold text-veda-bark">
            Confirm new password
            <input type={type} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required className={`${inputClass} mt-1`} />
          </label>

          <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-saffron hover:underline">
            {show ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
            {show ? 'Hide passwords' : 'Show passwords'}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button type="button" onClick={logout} disabled={busy} className={btnSecondary}>
            <LogOut size={16} aria-hidden /> Sign out
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? <Spinner /> : <KeyRound size={16} aria-hidden />}
            Save and continue
          </button>
        </div>
      </form>
    </main>
  );
}