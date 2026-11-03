import { useOutletContext } from 'react-router-dom';
import type { Profile } from '@/types/profile';
import type { ProfileState } from '@/hooks/useProfile';

/** What <Profile> (the layout) hands to every section through <Outlet context>. */
export interface ProfileContextValue extends Omit<ProfileState, 'profile'> {
  /** always set: the sections are only rendered once the profile has loaded */
  profile: Profile;
  /** small confirmation / error toast */
  notify: (message: string) => void;
}

export const useProfileContext = () => useOutletContext<ProfileContextValue>();