import { useState } from 'react';
import { PROFILE_LANDSCAPE_SRC } from '@/constants/profile';

/** Temple, trees and hills along the bottom of the page (decoration only). */
export default function ProfileLandscape() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={PROFILE_LANDSCAPE_SRC}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setFailed(true)}
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-[150px] w-full select-none object-cover object-bottom sm:h-auto"
    />
  );
}