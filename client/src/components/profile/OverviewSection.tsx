import {
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  CreditCard,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LotusMark } from '@/components/common/Logo';
import Avatar from '@/components/course/Avatar';
import { DASH_AVATAR_SRC } from '@/constants/dashboard';
import { GENDER_OPTIONS } from '@/constants/profile';
import type { Profile } from '@/types/profile';
import { CARD, IconBadge, SectionCard } from './ProfileParts';
import { useProfileContext } from './profileContext';
import { useAvatarUpload } from './useAvatarUpload';

const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

/** "2003-07-15" -> "15 July 2003" (read as a plain date, so no time-zone shift) */
export const formatDob = (iso: string): string =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : '';

export const genderLabel = (gender: Profile['gender']): string =>
  gender ? (GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? '') : '';

function SummaryCard() {
  const ctx = useProfileContext();
  const { profile } = ctx;
  const avatar = useAvatarUpload(ctx);

  return (
    <section className={`${CARD} p-5 sm:p-6`} aria-label="Profile summary">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto shrink-0 sm:mx-0">
          <Avatar
            name={profile.name}
            src={profile.avatar || DASH_AVATAR_SRC}
            className="h-[120px] w-[120px] border-4 border-ivory shadow-soft ring-2 ring-gold/50 sm:h-[140px] sm:w-[140px]"
            textClass="text-3xl"
          />
          <button
            type="button"
            onClick={avatar.openPicker}
            disabled={avatar.busy}
            aria-label="Change profile photo"
            className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ivory bg-veda-brown text-ivory shadow transition-colors hover:bg-veda-bark disabled:opacity-60"
          >
            {avatar.busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory/40 border-t-ivory" /> : <Camera size={17} aria-hidden />}
          </button>
          <input ref={avatar.inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={avatar.onFile} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h2 className="break-words font-display text-[1.9rem] font-bold leading-tight text-veda-brown sm:text-[2.2rem]">{profile.name}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-pale/80 px-3.5 py-1.5 text-[0.88rem] font-semibold text-veda-brown">
              <LotusMark className="h-5 w-5" />
              {profile.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </div>

          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[0.92rem] text-veda-bark sm:justify-start">
            <li className="flex items-center gap-2">
              <IdCard size={22} strokeWidth={1.5} className="text-saffron" aria-hidden />
              Student ID: {profile.studentId}
            </li>
            <li className="hidden h-6 w-px bg-gold/40 sm:block" aria-hidden />
            <li className="flex items-center gap-2">
              <CalendarDays size={21} strokeWidth={1.5} className="text-saffron" aria-hidden />
              Member since: {profile.createdAt ? MONTH_YEAR.format(new Date(profile.createdAt)) : '—'}
            </li>
            <li className="hidden h-6 w-px bg-gold/40 sm:block" aria-hidden />
            <li>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.88rem] font-medium ${
                  profile.isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${profile.isActive ? 'bg-emerald-600' : 'bg-red-600'}`} />
                {profile.isActive ? 'Active' : 'Disabled'}
              </span>
            </li>
          </ul>
        </div>

        <Link to="/profile/personal" className="btn-primary self-center whitespace-nowrap rounded-xl px-6 py-3 text-[0.95rem] sm:self-start lg:self-center">
          <Pencil size={17} aria-hidden /> Edit Profile
        </Link>
      </div>
    </section>
  );
}

function InfoRow({ Icon, label, value, className = '' }: { Icon: LucideIcon; label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center gap-4 border-b border-gold/20 py-2.5 ${className}`}>
      <IconBadge Icon={Icon} className="h-11 w-11" size={20} />
      <div className="min-w-0">
        <p className="text-[0.9rem] font-semibold text-veda-bark">{label}</p>
        <p className={`break-words text-[0.95rem] ${value ? 'text-veda-text' : 'text-veda-muted/70'}`}>{value || 'Not added yet'}</p>
      </div>
    </div>
  );
}

function PersonalInfoCard() {
  const { profile } = useProfileContext();

  return (
    <SectionCard Icon={UserRound} title="Personal Information">
      <div className="grid gap-x-10 sm:grid-cols-2">
        <InfoRow Icon={UserRound} label="Full Name" value={profile.name} />
        <InfoRow Icon={Mail} label="Email Address" value={profile.email} />
        <InfoRow Icon={Phone} label="Phone Number" value={profile.phone} />
        <InfoRow Icon={CalendarDays} label="Date of Birth" value={formatDob(profile.dateOfBirth)} />
        <InfoRow Icon={UsersRound} label="Gender" value={genderLabel(profile.gender)} />
        <InfoRow Icon={MapPin} label="Location" value={profile.location} />
      </div>
      <div className="flex items-start gap-4 pt-3">
        <IconBadge Icon={FileText} className="h-11 w-11" size={20} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.9rem] font-semibold text-veda-bark">Bio</p>
          <p className={`mt-1 break-words rounded-lg border border-gold/25 bg-white/50 px-3.5 py-2.5 text-[0.95rem] ${profile.bio ? 'text-veda-text' : 'text-veda-muted/70'}`}>
            {profile.bio || 'Tell the community a little about yourself.'}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

const QUICK_CARDS: { to: string; Icon: LucideIcon; title: string; text: string }[] = [
  { to: '/profile/security', Icon: ShieldCheck, title: 'Account & Security', text: 'Change password, update email, phone and secure your account.' },
  { to: '/profile/notifications', Icon: Bell, title: 'Notification Preferences', text: 'Manage alerts for live classes, courses and other updates.' },
  { to: '/profile/orders', Icon: CreditCard, title: 'Orders & Payments', text: 'View your course purchases, payment history and invoices.' },
];

export default function OverviewSection() {
  return (
    <div className="space-y-5">
      <SummaryCard />
      <PersonalInfoCard />
      <div className="grid gap-4 md:grid-cols-3">
        {QUICK_CARDS.map(({ to, Icon, title, text }) => (
          <Link key={to} to={to} className={`${CARD} group flex items-center gap-4 p-4 transition-shadow hover:shadow-lg`}>
            <IconBadge Icon={Icon} className="h-14 w-14" size={26} />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.2rem] font-bold leading-tight text-veda-bark">{title}</span>
              <span className="mt-1 block text-[0.8rem] leading-snug text-veda-text">{text}</span>
            </span>
            <ChevronRight size={20} className="shrink-0 text-veda-brown transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}