import { Camera, Save } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/course/Avatar';
import { DASH_AVATAR_SRC } from '@/constants/dashboard';
import { GENDER_OPTIONS } from '@/constants/profile';
import type { Gender } from '@/types/profile';
import { Field, FormError, SectionCard, inputCls } from './ProfileParts';
import { useProfileContext } from './profileContext';
import { useAvatarUpload } from './useAvatarUpload';

const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;
const todayIso = () => new Date().toISOString().slice(0, 10);

/** Editable "Personal Information" (saved with PATCH /api/profile). */
export default function PersonalSection() {
  const ctx = useProfileContext();
  const { profile, save, notify } = ctx;
  const avatar = useAvatarUpload(ctx);

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== profile.name ||
    phone !== profile.phone ||
    dateOfBirth !== profile.dateOfBirth ||
    gender !== profile.gender ||
    location !== profile.location ||
    bio !== profile.bio;

  const reset = () => {
    setName(profile.name);
    setPhone(profile.phone);
    setDateOfBirth(profile.dateOfBirth);
    setGender(profile.gender);
    setLocation(profile.location);
    setBio(profile.bio);
    setError('');
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const digits = phone.replace(/\D/g, '').length;

    if (cleanName.length < 2 || cleanName.length > 60) return setError('Please enter your full name (2-60 characters)');
    if (phone.trim() && (!PHONE_RE.test(phone.trim()) || digits < 7 || digits > 15)) return setError('Please enter a valid phone number');
    if (dateOfBirth && dateOfBirth > todayIso()) return setError('Date of birth cannot be in the future');

    setSaving(true);
    setError('');
    try {
      await save({ name: cleanName, phone: phone.trim(), dateOfBirth, gender, location: location.trim(), bio: bio.trim() });
      notify('Profile updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard Icon={Camera} title="Edit Personal Information" subtitle="Update the details shown on your profile.">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={profile.name} src={profile.avatar || DASH_AVATAR_SRC} className="h-20 w-20 ring-2 ring-gold/50" textClass="text-xl" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={avatar.openPicker} disabled={avatar.busy} className="btn-outline px-4 py-2 disabled:opacity-60">
            <Camera size={16} aria-hidden /> {avatar.busy ? 'Uploading…' : 'Change photo'}
          </button>
          {profile.avatar && (
            <button type="button" onClick={avatar.remove} disabled={avatar.busy} className="rounded-lg px-4 py-2 text-sm font-medium text-veda-muted hover:bg-gold-pale/60 disabled:opacity-60">
              Remove
            </button>
          )}
        </div>
        <input ref={avatar.inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={avatar.onFile} />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" htmlFor="pf-name">
            <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className={inputCls} />
          </Field>
          <Field label="Email Address" htmlFor="pf-email" hint="To change your email, go to Account & Security.">
            <input id="pf-email" value={profile.email} readOnly disabled className={inputCls} />
          </Field>
          <Field label="Phone Number" htmlFor="pf-phone">
            <input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="+91 98765 43210" autoComplete="tel" className={inputCls} />
          </Field>
          <Field label="Date of Birth" htmlFor="pf-dob">
            <input id="pf-dob" type="date" value={dateOfBirth} max={todayIso()} onChange={(e) => setDateOfBirth(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Gender" htmlFor="pf-gender">
            <select id="pf-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputCls}>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location" htmlFor="pf-location">
            <input id="pf-location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="City, State, Country" className={inputCls} />
          </Field>
        </div>

        <Field label="Bio" htmlFor="pf-bio" hint={`${bio.length}/300`}>
          <textarea id="pf-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} className={`${inputCls} resize-y`} />
        </Field>

        <FormError message={error} />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={saving || !dirty} className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={16} aria-hidden /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={reset} disabled={saving || !dirty} className="btn-outline px-6 disabled:opacity-50">
            Reset
          </button>
          <Link to="/profile" className="text-sm font-medium text-veda-brown hover:text-saffron">
            Back to overview
          </Link>
        </div>
      </form>
    </SectionCard>
  );
}