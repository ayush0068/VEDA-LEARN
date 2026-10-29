import { Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthCheckbox, AuthField } from '@/components/auth/AuthField';
import AuthLayout from '@/components/auth/AuthLayout';
import { AuthError, AuthHeading, AuthSubmit, OrDivider } from '@/components/auth/AuthParts';
import SocialButtons from '@/components/auth/SocialButtons';
import { useAuth } from '@/context/AuthContext';
import { emailError, nameError, newPasswordError } from '@/utils/validators';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

export default function Register() {
  const { user, register } = useAuth();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const next = fromPath && fromPath !== '/login' && fromPath !== '/register' ? fromPath : '/';

  // already signed in (or just created the account)
  if (user) return <Navigate to={next} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors: FieldErrors = {
      name: nameError(name) || undefined,
      email: emailError(email) || undefined,
      password: newPasswordError(password) || undefined,
      confirm: !confirm ? 'Please confirm your password' : confirm !== password ? 'Passwords do not match' : undefined,
      terms: agreed ? undefined : 'Please accept the Terms of Service and Privacy Policy',
    };
    setErrors(nextErrors);
    setServerError('');
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await register({ name: name.trim().replace(/\s+/g, ' '), email: email.trim(), password });
      // <Navigate> above takes over once the user is set
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const linkClass = 'font-semibold text-gold transition-colors hover:text-veda-brown';

  return (
    <AuthLayout title="Create Account" switchPrompt="Already have an account?" switchLabel="Sign In" switchTo="/login" size="md">
      <AuthHeading title="Create Your Account" subtitle="Start your journey towards knowledge, harmony and a better you" />

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3.5">
        <AuthField icon={User} label="Full Name" name="name" value={name} onChange={setName} autoComplete="name" error={errors.name} />
        <AuthField icon={Mail} label="Email address" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" error={errors.email} />
        <AuthField icon={Lock} label="Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} />
        <AuthField icon={Lock} label="Confirm Password" name="confirm" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />

        <div className="pt-0.5">
          <AuthCheckbox checked={agreed} onChange={setAgreed} error={errors.terms}>
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noopener" className={linkClass}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" rel="noopener" className={linkClass}>
              Privacy Policy
            </Link>
          </AuthCheckbox>
        </div>

        <AuthError message={serverError} />

        <div className="pt-1">
          <AuthSubmit loading={submitting}>{submitting ? 'Creating account…' : 'Create Account'}</AuthSubmit>
        </div>
      </form>

      <div className="mt-5 space-y-5">
        <OrDivider />
        <SocialButtons />
        <p className="text-center text-[0.92rem] text-veda-text">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-saffron transition-colors hover:text-veda-brown">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}