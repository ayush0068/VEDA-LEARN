import { Bell } from 'lucide-react';
import { NOTIFICATION_OPTIONS } from '@/constants/profile';
import { SectionCard, ToggleRow } from './ProfileParts';
import { useProfileContext } from './profileContext';

/** Every switch is saved straight away (PATCH /api/profile/notifications). */
export default function NotificationsSection() {
  const { profile, toggleNotification, notify } = useProfileContext();

  const change = (key: (typeof NOTIFICATION_OPTIONS)[number]['key'], value: boolean) =>
    toggleNotification(key, value).then(
      () => notify('Notification preferences saved'),
      (err: unknown) => notify(err instanceof Error ? err.message : 'Could not save this setting'),
    );

  return (
    <SectionCard Icon={Bell} title="Notification Preferences" subtitle="Choose which alerts you want to receive.">
      <ul className="divide-y divide-gold/20">
        {NOTIFICATION_OPTIONS.map(({ key, label, text }) => (
          <ToggleRow key={key} label={label} text={text} checked={profile.notifications[key]} onChange={(v) => void change(key, v)} />
        ))}
      </ul>
    </SectionCard>
  );
}