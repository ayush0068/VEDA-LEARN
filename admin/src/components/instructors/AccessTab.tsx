import { Save, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Switch from '@/components/common/Switch';
import { Spinner, btnPrimary } from '@/components/common/ui';
import type { InstructorPatch } from '@/services/instructors.service';
import type { InstructorDetails, InstructorOptions, InstructorRole, PermissionKey, Permissions } from '@/types/instructor';

interface Props {
  details: InstructorDetails;
  options: InstructorOptions;
  onSave: (patch: InstructorPatch) => Promise<void>;
}

const sameAs = (a: Permissions, b: Permissions) => (Object.keys(a) as PermissionKey[]).every((k) => a[k] === b[k]);

/** Admin decides the instructor's role and exactly what they may do. */
export default function AccessTab({ details, options, onSave }: Props) {
  const [role, setRole] = useState<InstructorRole>(details.instructorRole);
  const [permissions, setPermissions] = useState<Permissions>(details.permissions);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const preset = options.roles.find((r) => r.value === role)?.permissions;
  const customised = preset ? !sameAs(permissions, preset) : false;
  const dirty = role !== details.instructorRole || !sameAs(permissions, details.permissions);
  const enabled = Object.values(permissions).filter(Boolean).length;

  const pickRole = (next: InstructorRole) => {
    setRole(next);
    const nextPreset = options.roles.find((r) => r.value === next)?.permissions;
    if (nextPreset) setPermissions({ ...nextPreset }); // a role starts from its own default permissions
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await onSave({ instructorRole: role, permissions });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">Role</h3>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Instructor role">
          {options.roles.map((r) => {
            const selected = r.value === role;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => pickRole(r.value)}
                className={`rounded-xl border p-3 text-left transition ${selected ? 'border-gold bg-white ring-2 ring-gold/30' : 'border-line bg-white/60 hover:border-gold/50'}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? 'border-saffron' : 'border-[#CDBA9E]'}`}>
                    {selected && <span className="h-2 w-2 rounded-full bg-saffron" />}
                  </span>
                  <span className="text-[0.88rem] font-bold text-veda-bark">{r.label}</span>
                </span>
                <span className="mt-1 block pl-6 text-[0.76rem] leading-snug text-veda-muted">{r.description}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[0.76rem] text-veda-muted">Choosing a role loads its default permissions, which you can change below.</p>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">
            <ShieldCheck size={15} className="text-saffron" aria-hidden /> Permissions · {enabled} of {options.permissions.length}
          </h3>
          {customised && (
            <button type="button" onClick={() => preset && setPermissions({ ...preset })} className="text-[0.76rem] font-semibold text-saffron hover:underline">
              Customised · reset to role default
            </button>
          )}
        </div>

        <ul className="divide-y divide-line/70 rounded-2xl border border-line bg-white/70">
          {options.permissions.map((p) => (
            <li key={p.key} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[0.88rem] font-semibold text-veda-bark">{p.label}</p>
                <p className="text-[0.76rem] leading-snug text-veda-muted">{p.description}</p>
              </div>
              <Switch checked={permissions[p.key]} onChange={(on) => setPermissions((cur) => ({ ...cur, [p.key]: on }))} label={p.label} />
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-700">
          {error}
        </p>
      )}

      <button type="button" onClick={save} disabled={busy || !dirty} className={`${btnPrimary} w-full sm:w-auto`}>
        {busy ? <Spinner /> : <Save size={16} aria-hidden />}
        {busy ? 'Saving…' : 'Save access'}
      </button>
    </div>
  );
}