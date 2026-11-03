import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { resizeToSquareDataUrl } from '@/utils/image';
import type { ProfileContextValue } from './profileContext';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Picks a picture, shrinks it in the browser and saves it as the profile photo. */
export const useAvatarUpload = ({ setAvatar, notify }: Pick<ProfileContextValue, 'setAvatar' | 'notify'>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be chosen again
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return notify('Please choose a PNG, JPG or WebP picture');
    if (file.size > MAX_FILE_BYTES) return notify('This picture is too large (max 8 MB)');

    setBusy(true);
    try {
      await setAvatar(await resizeToSquareDataUrl(file));
      notify('Profile photo updated');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update your photo');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await setAvatar('');
      notify('Profile photo removed');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not remove your photo');
    } finally {
      setBusy(false);
    }
  };

  return { inputRef, busy, openPicker, onFile, remove };
};