import { Info } from 'lucide-react';
import { LEVEL_HELP, LEVEL_LABEL } from '@/components/team/teamUtils';
import type { AccessLevel, ModuleInfo, Permissions } from '@/types/team';

const LEVELS: AccessLevel[] = ['none', 'view', 'edit', 'full'];

/** the chosen button is filled, so the current level can be read at a glance */
const CHOSEN: Record<AccessLevel, string> = {
  none: 'bg-white text-veda-bark',
  view: 'bg-[#2F5E99] text-white',
  edit: 'bg-[#C9701B] text-white',
  full: 'bg-ok text-white',
};

interface Props {
  modules: ModuleInfo[];
  value: Permissions;
  onChange: (next: Permissions) => void;
  disabled?: boolean;
}

/** One row per section of the panel; the super admin picks how much each admin gets there. */
export default function PermissionMatrix({ modules, value, onChange, disabled }: Props) {
  const groups = [...new Set(modules.map((m) => m.group))];
  const setAll = (level: AccessLevel) => onChange(Object.fromEntries(modules.map((m) => [m.key, level])) as Permissions);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-veda-muted">What can this admin do?</p>
        <div className="flex items-center gap-1 text-[0.76rem]">
          <span className="text-veda-muted">Set all:</span>
          {(['none', 'view', 'full'] as AccessLevel[]).map((l) => (
            <button key={l} type="button" disabled={disabled} onClick={() => setAll(l)} className="rounded-md px-2 py-1 font-semibold text-saffron hover:bg-peach disabled:opacity-50">
              {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group} className="overflow-hidden rounded-xl border border-line bg-white/60">
            <p className="border-b border-line/70 bg-cream/60 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#8F4F1E]">{group}</p>
            <ul className="divide-y divide-line/60">
              {modules
                .filter((m) => m.group === group)
                .map((m) => (
                  <li key={m.key} className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[0.9rem] font-semibold text-veda-bark">{m.label}</p>
                      <p className="text-[0.76rem] leading-snug text-veda-muted">{m.description}</p>
                    </div>
                    <div role="radiogroup" aria-label={`Access to ${m.label}`} className="grid shrink-0 grid-cols-4 gap-1 rounded-xl bg-cream p-1 sm:w-[17.5rem]">
                      {LEVELS.map((level) => {
                        const on = value[m.key] === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={disabled}
                            title={LEVEL_HELP[level]}
                            onClick={() => onChange({ ...value, [m.key]: level })}
                            className={`rounded-lg px-1 py-1.5 text-[0.74rem] font-semibold transition disabled:cursor-not-allowed ${on ? `${CHOSEN[level]} shadow-sm` : 'text-veda-muted hover:bg-white/70'}`}
                          >
                            {level === 'none' ? 'None' : LEVEL_LABEL[level]}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-2.5 flex gap-1.5 text-[0.76rem] leading-snug text-veda-muted">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          <b>View</b> = read only · <b>Edit</b> = add and change · <b>Full</b> = also delete. Changes work from the admin&apos;s next click.
        </span>
      </p>
    </div>
  );
}