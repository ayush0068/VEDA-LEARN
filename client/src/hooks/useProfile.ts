import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { ApiRequestError } from '@/services/api';
import * as profileApi from '@/services/profile.service';
import type { NotificationPrefs, PrivacyPrefs, Profile, ProfileUpdate } from '@/types/profile';

/** Loads the signed-in student's profile and saves every change through /api/profile. */
export const useProfile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setError('');
    } catch (err) {
      setError((err as ApiRequestError).message || 'Could not load your profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Personal Information form. Throws the server's message when something is invalid. */
  const save = useCallback(
    async (fields: ProfileUpdate) => {
      const next = await profileApi.updateProfile(fields);
      setProfile(next);
      updateUser({ name: next.name });
    },
    [updateUser],
  );

  const setAvatar = useCallback(
    async (image: string) => {
      const avatar = image ? await profileApi.uploadAvatar(image) : '';
      if (!image) await profileApi.deleteAvatar();
      setProfile((prev) => (prev ? { ...prev, avatar } : prev));
      updateUser({ avatar });
    },
    [updateUser],
  );

  const setEmail = useCallback(
    async (input: { email: string; password: string }) => {
      const email = await profileApi.changeEmail(input);
      setProfile((prev) => (prev ? { ...prev, email } : prev));
      updateUser({ email });
    },
    [],
  );

  /** Switch shows the new value at once; it is put back if the server refuses. */
  const toggleNotification = useCallback(async (key: keyof NotificationPrefs, value: boolean) => {
    setProfile((prev) => (prev ? { ...prev, notifications: { ...prev.notifications, [key]: value } } : prev));
    try {
      const notifications = await profileApi.saveNotifications({ [key]: value });
      setProfile((prev) => (prev ? { ...prev, notifications } : prev));
    } catch (err) {
      setProfile((prev) => (prev ? { ...prev, notifications: { ...prev.notifications, [key]: !value } } : prev));
      throw err;
    }
  }, []);

  const togglePrivacy = useCallback(async (key: keyof PrivacyPrefs, value: boolean) => {
    setProfile((prev) => (prev ? { ...prev, privacy: { ...prev.privacy, [key]: value } } : prev));
    try {
      const privacy = await profileApi.savePrivacy({ [key]: value });
      setProfile((prev) => (prev ? { ...prev, privacy } : prev));
    } catch (err) {
      setProfile((prev) => (prev ? { ...prev, privacy: { ...prev.privacy, [key]: !value } } : prev));
      throw err;
    }
  }, []);

  return { profile, loading, error, reload: load, save, setAvatar, setEmail, toggleNotification, togglePrivacy };
};

export type ProfileState = ReturnType<typeof useProfile>;