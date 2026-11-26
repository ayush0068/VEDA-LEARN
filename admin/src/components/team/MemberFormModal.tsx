import { Check } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Modal from '@/components/common/Modal';
import { Spinner, btnPrimary, btnSecondary, inputClass } from '@/components/common/ui';
import PermissionMatrix from '@/components/team/PermissionMatrix';
import { createMember, updateMember } from '@/services/team.service';
import type { Member, MemberCredentials, Permissions, TeamOptions } from '@/types/team';

interface Props {
  options: TeamOptions;
  /** given = edit that admin, empty = add a new one */
  member?: Member;
  onClose: () => void;
  onCreated: (result: MemberCredentials) => void;
  onUpdated: (member: Member) => void;
}

const empty = (options: TeamOptions): Permissions => options.presets.find((p) => p.value === 'custom')?.permissions ?? (Object.fromEntries(options.modules.map((m) => [m.key, 'none'])) as Permissions);

const sameAs = (a: Permissions, b: Permissions) => Object.keys(a).every((k) => a[k as keyof Permissions] === b[k as keyof Permissions]);

export default function MemberFormModal({ options, member, onClose, onCreated, onUpdated }: Props) {
  const editing = Boolean(member);
  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [title, setTitle] = useState(member?.title ?? '');
  const [titleTouched, setTitleTouched] = useState(editing);
  const [preset, setPreset] = useState(member?.preset ?? 'custom');
  const [permissions, setPermissions] = useState<Permissions>(member?.permissions ?? empty(options));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pickPreset = (value: string) => {
    const p = options.presets.find((x) => x.value === value);
    if (!p) return;
    setPreset(value);
    setPermissions({ ...p.permissions });
    if (!titleTouched) setTitle(value === 'custom' ? '' : p.label);
  };

  // changing a single row turns the role into "Custom" unless it still matches a ready-made role exactly
  const changePermissions = (next: Permissions) => {
    setPermissions(next);
    setPreset(options.presets.find((p) => p.value !== 'custom' && sameAs(p.permissions, next))?.value ?? 'custom');
  };

  const given = Object.values(permissions).filter((l) => l !== 'none').length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (given === 0) return setError('Give this admin access to at least one section.');

    setBusy(true);
    try {
      if (member) onUpdated(await updateMember(member.id, { name, phone, title: title.trim() || 'Admin', preset, permissions }));
      else onCreated(await createMember({ name, email, phone, title: title.trim(), preset, permissions }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={editing ? `Edit ${member?.name}` : 'Add an admin'}
      subtitle={editing ? 'Change their details or what they are allowed to do' : 'They get a temporary password and only see the sections you choose'}
      width="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" form="member-form" disabled={busy} className={btnPrimary}>
            {busy ? <Spinner /> : <Check size={16} aria-hidden />}
            {editing ? 'Save changes' : 'Add admin'}
          </button>
        </div>
      }
    >
      <form id="member-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="block text-[0.82rem] font-semibold text-veda-bark">
            Full name
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} autoComplete="off" placeholder="e.g. Ravi Sharma" className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-[0.82rem] font-semibold text-veda-bark">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={editing} autoComplete="off" placeholder="name@example.com" className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-[0.82rem] font-semibold text-veda-bark">
            Phone <span className="font-normal text-veda-muted">(optional, for WhatsApp)</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" placeholder="+91 98765 43210" className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-[0.82rem] font-semibold text-veda-bark">
            Role name <span className="font-normal text-veda-muted">(shown in the panel)</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
              maxLength={60}
              placeholder="e.g. Content Manager"
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">Start from a ready-made role</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {options.presets.map((p) => {
              const on = preset === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickPreset(p.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${on ? 'border-gold bg-white ring-2 ring-gold/30' : 'border-line bg-white/60 hover:border-gold/60'}`}
                >
                  <span className="block text-[0.86rem] font-bold text-veda-bark">{p.label}</span>
                  <span className="mt-0.5 block text-[0.74rem] leading-snug text-veda-muted">{p.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <PermissionMatrix modules={options.modules} value={permissions} onChange={changePermissions} disabled={busy} />

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}