import { Settings } from 'lucide-react';
import { PRIVACY_OPTIONS } from '@/constants/profile';
import { SectionCard, ToggleRow } from './ProfileParts';
import { useProfileContext } from './profileContext';

/** Every switch is saved straight away (PATCH /api/profile/privacy). */
export default function PrivacySection() {
  const { profile, togglePrivacy, notify } = useProfileContext();

  const change = (key: (typeof PRIVACY_OPTIONS)[number]['key'], value: boolean) =>
    togglePrivacy(key, value).then(
      () => notify('Privacy settings saved'),
      (err: unknown) => notify(err instanceof Error ? err.message : 'Could not save this setting'),
    );

  return (
    <SectionCard Icon={Settings} title="Privacy & Settings" subtitle="Control what other learners can see about you.">
      <ul className="divide-y divide-gold/20">
        {PRIVACY_OPTIONS.map(({ key, label, text }) => (
          <ToggleRow key={key} label={label} text={text} checked={profile.privacy[key]} onChange={(v) => void change(key, v)} />
        ))}
      </ul>
    </SectionCard>
  );
}