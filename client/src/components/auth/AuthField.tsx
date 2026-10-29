import { Check, Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthFieldProps {
  icon: LucideIcon;
  /** accessible label (the design only shows the placeholder) */
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
}

/** Rounded input with a left icon; password fields get the eye toggle on the right. */
export function AuthField({ icon: Icon, label, name, type = 'text', value, onChange, autoComplete, error }: AuthFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label
        className={`flex h-[3.1rem] items-center gap-3 rounded-xl border bg-[#fffaf0]/85 px-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] transition-colors focus-within:border-gold ${
          error ? 'border-red-400/80' : 'border-gold/20 hover:border-gold/40'
        }`}
      >
        <span className="sr-only">{label}</span>
        <Icon size={19} strokeWidth={1.5} className="shrink-0 text-veda-muted" aria-hidden />
        <input
          id={id}
          name={name}
          type={isPassword && visible ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full min-w-0 bg-transparent text-[0.95rem] text-veda-bark placeholder:text-veda-muted focus:outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="shrink-0 text-veda-muted transition-colors hover:text-veda-brown"
          >
            {visible ? <Eye size={19} strokeWidth={1.5} aria-hidden /> : <EyeOff size={19} strokeWidth={1.5} aria-hidden />}
          </button>
        )}
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 px-1 text-[0.8rem] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

interface AuthCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
}

/** Square gold-bordered checkbox with a label (Remember me / Terms). */
export function AuthCheckbox({ checked, onChange, children, error }: AuthCheckboxProps) {
  const id = useId();
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2.5 text-[0.88rem] text-veda-text">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="peer sr-only"
        />
        <span
          className={`flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded border bg-ivory text-ivory transition-colors peer-checked:border-veda-brown peer-checked:bg-veda-brown peer-focus-visible:ring-2 peer-focus-visible:ring-gold ${
            error ? 'border-red-400' : 'border-veda-muted/60'
          }`}
          aria-hidden
        >
          <Check size={13} strokeWidth={3} className={checked ? 'opacity-100' : 'opacity-0'} />
        </span>
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 px-1 text-[0.8rem] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}