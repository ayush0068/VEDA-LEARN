import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LotusMark, MandalaMark, TempleSilhouette } from '@/components/common/Art';
import { Spinner, btnPrimary, inputClass } from '@/components/common/ui';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await login({ email: email.trim(), password, remember });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <MandalaMark className="pointer-events-none absolute -left-32 -top-32 h-[30rem] w-[30rem] text-gold/20" />
      <MandalaMark className="pointer-events-none absolute -bottom-40 -right-32 h-[32rem] w-[32rem] text-gold/15" />
      <TempleSilhouette className="pointer-events-none absolute -bottom-4 left-1/2 h-56 w-[24rem] -translate-x-1/2 text-[#C98A4A]/25" />

      <div className="relative w-full max-w-[400px] animate-pop-in overflow-hidden rounded-3xl border border-line bg-ivory/95 shadow-2xl shadow-veda-brown/20">
        <div className="rounded-b-[50%_28px] bg-gradient-to-b from-[#B06A27] via-[#C58A45] to-[#E9BC8A] px-6 pb-7 pt-7 text-center">
          <LotusMark className="mx-auto h-12 w-12" />
          <p className="mt-1 font-display text-[1.8rem] font-semibold leading-none text-white">VedaLearn</p>
          <p className="mt-1.5 text-[0.85rem] text-white/90">Admin Panel</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 pb-7 pt-5" noValidate>
          <div className="flex items-center gap-2 text-[0.8rem] text-veda-muted">
            <ShieldCheck size={16} className="text-saffron" aria-hidden /> Sign in with your administrator account
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Email</span>
            <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className={inputClass} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Password</span>
            <span className="relative block">
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-veda-muted hover:text-veda-bark"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-[0.82rem] text-veda-text">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#7A3E14]" />
            Keep me signed in on this device
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !email || !password} className={`${btnPrimary} w-full py-3`}>
            {busy ? <Spinner /> : <LogIn size={17} aria-hidden />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}