import { useState } from 'react';
import { CONTACT_LANDSCAPE_SRC } from '@/constants/contact';

/** top edge fades into the page so the strip blends with the section above */
const FADE_MASK = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 14%, #000 48%)';

/** Bottom strip: public/images/contact-landscape.png (falls back to hills + a small temple drawn in SVG). */
export default function ContactLandscape() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="pointer-events-none relative -mt-4 h-40 overflow-hidden sm:-mt-8 sm:h-52 lg:-mt-10 lg:h-64" aria-hidden>
      <div className="absolute inset-0" style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }}>
        {failed ? (
          <svg viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
            <path d="M0 130 C160 90 300 140 480 110 C660 80 820 130 1000 100 C1100 85 1160 100 1200 96 V200 H0Z" fill="#f3d9a6" opacity=".7" />
            <path d="M0 165 C220 135 400 175 620 150 C840 125 1000 165 1200 140 V200 H0Z" fill="#e9bd78" opacity=".6" />
            {/* temple */}
            <g fill="#d9a35a" opacity=".85" transform="translate(790 70)">
              <path d="M60 0c8 10 13 22 13 36H47c0-14 5-26 13-36z" />
              <rect x="56" y="-14" width="1.6" height="16" />
              <path d="M57 -14l16 4-16 4z" fill="#e48a2f" />
              <rect x="20" y="36" width="80" height="4" />
              <rect x="10" y="40" width="100" height="44" />
              <path d="M18 40c4-12 12-12 16 0zM86 40c4-12 12-12 16 0z" />
            </g>
            {/* trees */}
            <g fill="#e0a85d" opacity=".8">
              <ellipse cx="170" cy="120" rx="46" ry="22" /><rect x="167" y="120" width="6" height="40" />
              <ellipse cx="1080" cy="108" rx="52" ry="24" /><rect x="1077" y="108" width="6" height="52" />
            </g>
          </svg>
        ) : (
          <img src={CONTACT_LANDSCAPE_SRC} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover object-bottom" />
        )}
      </div>
    </div>
  );
}