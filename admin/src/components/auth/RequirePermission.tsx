import { ArrowLeft, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/context/AuthContext';
import type { AccessLevel, ModuleKey } from '@/types/team';

interface Props {
  /** which part of the panel this page belongs to */
  module?: ModuleKey;
  level?: AccessLevel;
  /** pages only the super admin may open (Admins & Roles) */
  superOnly?: boolean;
  children: ReactNode;
}

/** Wraps a page: admins without the right see a short "no access" card instead. (The server refuses their requests as well.) */
export default function RequirePermission({ module, level = 'view', superOnly, children }: Props) {
  const { can, isSuper } = useAuth();
  const allowed = superOnly ? isSuper : module ? can(module, level) : isSuper;
  if (allowed) return <>{children}</>;

  return (
    <Card className="mx-auto mt-6 flex max-w-xl flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-peach text-saffron">
        <Lock size={26} strokeWidth={1.6} aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-[1.6rem] font-bold text-veda-bark">You do not have access to this page</h1>
      <p className="mt-2 max-w-sm text-[0.9rem] text-veda-muted">Your role does not include this section. If you need it, ask the super admin to update your access.</p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-veda-brown px-5 py-2.5 text-sm font-semibold text-ivory shadow-card transition hover:bg-veda-bark">
        <ArrowLeft size={16} aria-hidden /> Back to Dashboard
      </Link>
    </Card>
  );
}