import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthCheckbox, AuthField } from '@/components/auth/AuthField';
import AuthLayout from '@/components/auth/AuthLayout';
import { AuthError, AuthHeading, AuthSubmit, OrDivider } from '@/components/auth/AuthParts';
import SocialButtons from '@/components/auth/SocialButtons';
import { useAuth } from '@/context/AuthContext';
import { emailError } from '@/utils/validators';

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // where to go after signing in (the page that sent the user here, otherwise home)
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const next = fromPath && fromPath !== '/login' && fromPath !== '/register' ? fromPath : '/';

  // already signed in (or just signed in successfully)
  if (user) return <Navigate to={next} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors: FieldErrors = {
      email: emailError(email) || undefined,
      password: password ? undefined : 'Please enter your password',
    };
    setErrors(nextErrors);
    setServerError('');
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password, remember });
      // <Navigate> above takes over once the user is set
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign In" switchPrompt="New here?" switchLabel="Create Account" switchLabelShort="Sign Up" switchTo="/register">
      <AuthHeading title="Welcome Back" subtitle="Continue your journey of learning and self-growth" />

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-3.5">
        <AuthField icon={Mail} label="Email address" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" error={errors.email} />
        <AuthField icon={Lock} label="Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="current-password" error={errors.password} />

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <AuthCheckbox checked={remember} onChange={setRemember}>
            Remember me
          </AuthCheckbox>
          <Link to="/forgot-password" className="text-[0.88rem] font-semibold text-saffron transition-colors hover:text-veda-brown">
            Forgot password?
          </Link>
        </div>

        <AuthError message={serverError} />

        <div className="pt-1">
          <AuthSubmit loading={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</AuthSubmit>
        </div>
      </form>

      <div className="mt-5 space-y-5">
        <OrDivider />
        <SocialButtons />
        <p className="text-center text-[0.92rem] text-veda-text">
          Don&rsquo;t have an account?{' '}
          <Link to="/register" className="font-semibold text-saffron transition-colors hover:text-veda-brown">
            Create Account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}