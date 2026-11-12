import { Ban, CircleCheck, KeyRound, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import StatusPill from '@/components/students/StatusPill';
import type { InstructorPatch } from '@/services/instructors.service';
import type { InstructorDetails } from '@/types/instructor';
import { formatDate, timeAgo } from '@/utils/format';

interface Props {
  details: InstructorDetails;
  onSave: (patch: InstructorPatch) => Promise<void>;
  onReset: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const PHONE_RE = /^[+()\-\s\d]{7,20}$/;

export default function ProfileTab({ details, onSave, onReset, onToggle, onDelete }: Props) {
  const [name, setName] = useState(details.name);
  const [phone, setPhone] = useState(details.phone);
  const [title, setTitle] = useState(details.title);
  const [years, setYears] = useState(String(details.experienceYears));
  const [bio, setBio] = useState(details.bio);
  const [tags, setTags] = useState<string[]>(details.expertise);
  const [tagText, setTagText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const addTag = () => {
    const tag = tagText.trim().replace(/\s+/g, ' ');
    setTagText('');
    if (!tag || tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    if (tag.length > 30) return setError('Each expertise tag can be at most 30 characters.');
    if (tags.length >= 8) return setError('You can add at most 8 expertise tags.');
    setError('');
    setTags([...tags, tag]);
  };

  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagText && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const dirty =
    name.trim() !== details.name ||
    phone.trim() !== details.phone ||
    title.trim() !== details.title ||
    years !== String(details.experienceYears) ||
    bio.trim() !== details.bio ||
    tags.join('|') !== details.expertise.join('|');

  const save = async () => {
    const exp = Number(years);
    if (name.trim().length < 2) return setError('Please enter the full name.');
    if (phone.trim() && !PHONE_RE.test(phone.trim())) return setError('Please enter a valid phone number.');
    if (!Number.isInteger(exp) || exp < 0 || exp > 60) return setError('Experience must be a whole number of years (0-60).');

    setBusy(true);
    setError('');
    try {
      await onSave({ name: name.trim(), phone: phone.trim(), title: title.trim(), experienceYears: exp, bio: bio.trim(), expertise: tags });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Phone</span>
          <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" maxLength={20} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Jyotish Acharya" maxLength={80} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Years of experience</span>
          <input type="number" min={0} max={60} inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} className={inputClass} />
        </label>
        <div>
          <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">Email</span>
          <p className="truncate rounded-xl border border-line bg-cream px-3.5 py-2.5 text-[0.9rem] text-veda-muted">{details.email}</p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-[0.8rem] font-semibold text-veda-bark">
          Short bio <span className="font-normal text-veda-muted">{bio.length}/600</span>
        </span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={600} placeholder="A few lines about their background and teaching style" className={`${inputClass} resize-y`} />
      </label>

      <div>
        <span className="mb-1.5 block text-[0.8rem] font-semibold text-veda-bark">
          Expertise <span className="font-normal text-veda-muted">(press Enter to add, up to 8)</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white/80 p-2 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/25">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-peach px-2.5 py-1 text-[0.78rem] text-veda-bark">
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="text-veda-muted hover:text-red-600">
                <X size={13} />
              </button>
            </span>
          ))}
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            onKeyDown={onTagKey}
            onBlur={addTag}
            placeholder={tags.length ? '' : 'e.g. Vedic Astrology'}
            className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-base text-veda-bark placeholder:text-veda-muted/70 focus:outline-none sm:text-[0.88rem]"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
          {error}
        </p>
      )}

      <button type="button" onClick={save} disabled={busy || !dirty} className={`${btnPrimary} w-full sm:w-auto`}>
        {busy ? <Spinner /> : <Save size={16} aria-hidden />}
        {busy ? 'Saving…' : 'Save profile'}
      </button>

      {/* account */}
      <section className="rounded-2xl border border-line bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">Account</h3>
          <StatusPill student={details} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-[0.85rem]">
          <div>
            <dt className="text-[0.72rem] text-veda-muted">Added on</dt>
            <dd className="font-medium text-veda-bark">{formatDate(details.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[0.72rem] text-veda-muted">Last login</dt>
            <dd className="font-medium text-veda-bark">{details.lastLoginAt ? timeAgo(details.lastLoginAt) : 'Never signed in'}</dd>
          </div>
        </dl>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onReset} className={btnSecondary}>
            <KeyRound size={15} aria-hidden /> Reset password
          </button>
          <button type="button" onClick={onToggle} className={btnSecondary}>
            {details.isActive ? <Ban size={15} aria-hidden /> : <CircleCheck size={15} aria-hidden />}
            {details.isActive ? 'Disable account' : 'Enable account'}
          </button>
        </div>
        <button type="button" onClick={onDelete} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-[0.84rem] font-semibold text-red-700 transition hover:bg-red-100">
          <Trash2 size={15} aria-hidden /> Delete instructor
        </button>
      </section>
    </div>
  );
}