import { Settings, Smartphone } from 'lucide-react';
import { PRIVACY_OPTIONS } from '@/constants/profile';
import { SectionCard, ToggleRow } from './ProfileParts';
import { useProfileContext } from './profileContext';

const SIDES: { value: 'left' | 'right'; label: string; text: string }[] = [
  { value: 'right', label: 'Right', text: 'Default' },
  { value: 'left', label: 'Left', text: 'For left-handed use' },
];

/** Where the round search button sits on phones (saved with PATCH /api/profile/preferences). */
function SearchSideCard() {
  const { profile, setSearchSide, notify } = useProfileContext();
  const side = profile.searchSide ?? 'right';

  const choose = (value: 'left' | 'right') => {
    if (value === side) return;
    setSearchSide(value).then(
      () => notify(`Search button moved to the ${value}`),
      (err: unknown) => notify(err instanceof Error ? err.message : 'Could not save this setting'),
    );
  };

  return (
    <SectionCard Icon={Smartphone} title="Search button on phone" subtitle="Choose which side of the screen the round search button stays on.">
      <div role="radiogroup" aria-label="Search button position" className="grid gap-3 sm:grid-cols-2">
        {SIDES.map(({ value, label, text }) => {
          const active = side === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(value)}
              className={`flex items-center gap-4 rounded-xl border p-3.5 text-left transition-colors ${
                active ? 'border-veda-brown bg-gold-pale/50 shadow-soft' : 'border-gold/30 bg-white/50 hover:bg-gold-pale/30'
              }`}
            >
              {/* little phone showing where the button will be */}
              <span className="relative h-16 w-10 shrink-0 rounded-lg border-2 border-veda-brown/60 bg-ivory" aria-hidden>
                <span className={`absolute bottom-1.5 h-3.5 w-3.5 rounded-full bg-veda-brown ${value === 'left' ? 'left-1.5' : 'right-1.5'}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] font-semibold text-veda-bark">{label}</span>
                <span className="block text-[0.8rem] text-veda-muted">{text}</span>
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-veda-brown' : 'border-gold/50'}`}
                aria-hidden
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-veda-brown" />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[0.8rem] text-veda-muted">This only changes phones and tablets. It is saved to your account, so it follows you to every device.</p>
    </SectionCard>
  );
}

/** Every switch is saved straight away (PATCH /api/profile/privacy). */
export default function PrivacySection() {
  const { profile, togglePrivacy, notify } = useProfileContext();

  const change = (key: (typeof PRIVACY_OPTIONS)[number]['key'], value: boolean) =>
    togglePrivacy(key, value).then(
      () => notify('Privacy settings saved'),
      (err: unknown) => notify(err instanceof Error ? err.message : 'Could not save this setting'),
    );

  return (
    <div className="space-y-5">
      <SearchSideCard />
      <SectionCard Icon={Settings} title="Privacy & Settings" subtitle="Control what other learners can see about you.">
        <ul className="divide-y divide-gold/20">
          {PRIVACY_OPTIONS.map(({ key, label, text }) => (
            <ToggleRow key={key} label={label} text={text} checked={profile.privacy[key]} onChange={(v) => void change(key, v)} />
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}