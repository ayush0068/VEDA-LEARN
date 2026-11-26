import { Ban, Clock, KeyRound, LogIn, Move, Pencil, Plus, ShieldAlert, Trash2, TriangleAlert, Upload, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AccessLevel, ActivityItem, MemberStatus, ModuleInfo, Permissions } from '@/types/team';

export const LEVEL_LABEL: Record<AccessLevel, string> = { none: 'No access', view: 'View', edit: 'Edit', full: 'Full' };

export const LEVEL_HELP: Record<AccessLevel, string> = {
  none: 'Hidden. The admin cannot see this section at all.',
  view: 'Can open and read, but change nothing.',
  edit: 'Can also add new things and change existing ones.',
  full: 'Can also delete.',
};

export const LEVEL_STYLE: Record<AccessLevel, string> = {
  none: 'bg-[#F3ECE1] text-veda-muted',
  view: 'bg-[#E6EEF8] text-[#2F5E99]',
  edit: 'bg-[#FDE6C8] text-[#C9701B]',
  full: 'bg-[#E4F4DC] text-ok',
};

export const STATUS_STYLE: Record<MemberStatus, { label: string; box: string; dot: string }> = {
  active: { label: 'Active', box: 'bg-[#E4F4DC] text-ok', dot: 'bg-ok' },
  pending: { label: 'Password pending', box: 'bg-[#FDE6C8] text-[#C9701B]', dot: 'bg-[#F28C28]' },
  suspended: { label: 'Suspended', box: 'bg-[#EFE6DA] text-veda-muted', dot: 'bg-[#A8998A]' },
};

export const moduleLabel = (modules: ModuleInfo[] | undefined, key: string): string => {
  const hit = modules?.find((m) => m.key === key);
  if (hit) return hit.label;
  if (key === 'team') return 'Admins & Roles';
  if (key === 'auth') return 'Sign-in';
  return key ? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()) : 'General';
};

/** "Students: Edit" chips of everything an admin can reach */
export const accessList = (permissions: Permissions, modules: ModuleInfo[] | undefined) =>
  (modules ?? []).filter((m) => permissions[m.key] && permissions[m.key] !== 'none').map((m) => ({ key: m.key, label: m.label, level: permissions[m.key] }));

export const activityIcon = (a: Pick<ActivityItem, 'action' | 'outcome'>): LucideIcon => {
  if (a.outcome === 'denied') return ShieldAlert;
  if (a.outcome === 'failed') return TriangleAlert;
  if (a.action === 'auth.login') return LogIn;
  if (a.action.endsWith('.reset_password')) return KeyRound;
  if (a.action.endsWith('.delete') || a.action.endsWith('recording_delete')) return Trash2;
  if (a.action.endsWith('.create')) return Plus;
  if (a.action.endsWith('.upload')) return Upload;
  if (a.action.endsWith('.move') || a.action.endsWith('.reorder')) return Move;
  if (a.action.includes('recording')) return Video;
  if (a.action.endsWith('.cancel') || a.action.endsWith('.sign_out')) return Ban;
  if (a.action.endsWith('.update')) return Pencil;
  return Clock;
};

export const OUTCOME_STYLE: Record<ActivityItem['outcome'], string> = {
  success: 'bg-peach text-saffron',
  denied: 'bg-[#FBE0DA] text-[#B3402A]',
  failed: 'bg-[#FDEFC9] text-[#9A6A0C]',
};

const DAY = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const TIME = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const FULL = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

export const timeOf = (iso: string) => TIME.format(new Date(iso));
export const fullTime = (iso: string) => FULL.format(new Date(iso));

/** the calendar day in the browser's time zone */
export const dayKeyOf = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dayHeading = (iso: string): string => {
  const key = dayKeyOf(iso);
  const now = new Date();
  const today = dayKeyOf(now.toISOString());
  const yesterday = dayKeyOf(new Date(now.getTime() - 86400000).toISOString());
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return DAY.format(new Date(iso));
};

/** "2026-11-21" -> "21 Nov" */
export const shortDay = (key: string): string => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(`${key}T12:00:00`));

/** a readable device from the browser's user-agent text */
export const deviceOf = (ua: string): string => {
  if (!ua) return '';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return [browser, os].filter(Boolean).join(' on ');
};