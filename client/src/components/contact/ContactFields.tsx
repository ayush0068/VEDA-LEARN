import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';

/** Same look as AuthField (rounded input + left icon + inline error) so every form on the site feels the same. */
const shell = (error?: string) =>
  `flex items-center gap-3 rounded-xl border bg-[#fffaf0]/85 px-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] transition-colors focus-within:border-gold ${
    error ? 'border-red-400/80' : 'border-gold/30 hover:border-gold/50'
  }`;

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 px-1 text-[0.8rem] text-red-700">
      {error}
    </p>
  );
}

interface SelectProps {
  icon: LucideIcon;
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
}

/** Native <select> (keyboard + mobile friendly) dressed like the other fields. */
export function ContactSelect({ icon: Icon, label, name, value, options, onChange, error }: SelectProps) {
  const id = useId();
  return (
    <div>
      <label className={`relative h-[3.1rem] ${shell(error)}`}>
        <span className="sr-only">{label}</span>
        <Icon size={19} strokeWidth={1.5} className="shrink-0 text-veda-muted" aria-hidden />
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-full w-full min-w-0 cursor-pointer appearance-none bg-transparent pr-7 text-[0.95rem] focus:outline-none ${
            value ? 'text-veda-bark' : 'text-veda-muted'
          }`}
        >
          <option value="" disabled>
            {label}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="text-veda-bark">
              {o}
            </option>
          ))}
        </select>
        <ChevronDown size={18} strokeWidth={1.8} className="pointer-events-none absolute right-4 text-saffron" aria-hidden />
      </label>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

interface TextareaProps {
  icon: LucideIcon;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  error?: string;
}

export function ContactTextarea({ icon: Icon, label, name, value, onChange, maxLength, error }: TextareaProps) {
  const id = useId();
  return (
    <div>
      <label className={`items-start py-3.5 ${shell(error)}`}>
        <span className="sr-only">{label}</span>
        <Icon size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-veda-muted" aria-hidden />
        <textarea
          id={id}
          name={name}
          rows={4}
          value={value}
          maxLength={maxLength + 200} /* a little slack so the validator can show a clear message instead of silently cutting text */
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-h-[6.5rem] w-full min-w-0 resize-y bg-transparent text-[0.95rem] text-veda-bark placeholder:text-veda-muted focus:outline-none"
        />
      </label>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <FieldError id={`${id}-error`} error={error} />
        </div>
        <span className={`mt-1.5 shrink-0 px-1 text-[0.75rem] ${value.length > maxLength ? 'text-red-700' : 'text-veda-muted'}`}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}