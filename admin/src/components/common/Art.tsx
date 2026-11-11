import { useId } from 'react';

/** Gold lotus used in the sidebar header (outline style, same family as the public site logo). */
export function LotusMark({ className = 'h-10 w-10', stroke = '#F6DFA4' }: { className?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <g stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 6c6 7 8 15 0 27-8-12-6-20 0-27z" fill={stroke} fillOpacity=".28" />
        <path d="M32 33c-10 0-18-7-21-17 9 0 17 4 21 17z" fill={stroke} fillOpacity=".2" />
        <path d="M32 33c10 0 18-7 21-17-9 0-17 4-21 17z" fill={stroke} fillOpacity=".2" />
        <path d="M32 34c-10 3-19-1-27-9 1 12 9 22 27 22s26-10 27-22c-8 8-17 12-27 9z" fill={stroke} fillOpacity=".14" />
        <path d="M18 52c4 2 9 3 14 3s10-1 14-3" />
      </g>
    </svg>
  );
}

/** Thin decorative mandala (colour from currentColor). */
export function MandalaMark({ className = '' }: { className?: string }) {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const small = Array.from({ length: 16 }, (_, i) => i * 22.5 + 11.25);
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="0.7" aria-hidden>
      <circle cx="100" cy="100" r="97" />
      <circle cx="100" cy="100" r="92" strokeDasharray="2 3" />
      {small.map((a) => (
        <path key={`s${a}`} transform={`rotate(${a} 100 100)`} d="M100 62 C94 74 94 84 100 92 C106 84 106 74 100 62Z" />
      ))}
      {petals.map((a) => (
        <path key={a} transform={`rotate(${a} 100 100)`} d="M100 14 C88 36 88 62 100 84 C112 62 112 36 100 14Z" fillOpacity=".05" fill="currentColor" />
      ))}
      <circle cx="100" cy="100" r="30" />
      <circle cx="100" cy="100" r="18" />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
    </svg>
  );
}

/** Temple silhouette (main shikhara, two small towers, pillared hall, steps). Colour from currentColor. */
export function TempleSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} fill="currentColor" aria-hidden>
      {/* steps */}
      <rect x="10" y="126" width="180" height="7" rx="1" />
      <rect x="20" y="119" width="160" height="7" rx="1" />
      {/* side towers */}
      <path d="M36 112 C36 96 42 84 52 74 L55 64 L58 74 C68 84 74 96 74 112Z" />
      <path d="M126 112 C126 96 132 84 142 74 L145 64 L148 74 C158 84 164 96 164 112Z" transform="translate(0 0)" />
      {/* main tower */}
      <path d="M68 112 C68 80 78 50 92 32 L96 20 L104 20 L108 32 C122 50 132 80 132 112Z" />
      <ellipse cx="100" cy="27" rx="10" ry="4.5" />
      <path d="M97 22 L100 8 L103 22Z" />
      <path d="M100 8 L100 2 L112 5 L100 8Z" />
      {/* hall */}
      <path d="M22 112 L100 100 L178 112 L178 120 L22 120Z" />
      {/* tower ridges + hall pillars (cut-outs) */}
      <g stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" fill="none">
        <path d="M76 100 H124 M79 88 H121 M83 76 H117 M88 64 H112 M92 52 H108 M95 40 H105" />
        <path d="M44 100 H66 M47 88 H63 M50 78 H60" />
        <path d="M134 100 H156 M137 88 H153 M140 78 H150" />
        <path d="M38 112 V120 M52 112 V120 M66 112 V120 M80 112 V120 M94 112 V120 M108 112 V120 M122 112 V120 M136 112 V120 M150 112 V120 M164 112 V120" />
      </g>
    </svg>
  );
}

/** Sunrise scene for the welcome banner: sun, misty hills, temple, branches. Purely decorative. */
export function HeroScene({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 760 190" preserveAspectRatio="xMaxYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBD7A6" />
          <stop offset="0.55" stopColor="#F9C07F" />
          <stop offset="1" stopColor="#F4A257" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6DC" />
          <stop offset="0.35" stopColor="#FFE7A8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9C9" stopOpacity="0" />
          <stop offset="1" stopColor="#FFE9C9" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      <rect width="760" height="190" fill={`url(#${id}-sky)`} />
      <circle cx="372" cy="62" r="70" fill={`url(#${id}-sun)`} />
      <circle cx="372" cy="62" r="15" fill="#FFF4D2" />

      {/* hills */}
      <path d="M0 120 C60 96 120 86 190 104 C250 118 300 92 360 96 C430 102 470 120 540 100 C610 82 680 92 760 110 V190 H0Z" fill="#E9A36A" opacity=".75" />
      <path d="M0 140 C80 118 150 122 230 134 C310 146 380 120 450 124 C540 130 620 146 760 126 V190 H0Z" fill="#DE8B4C" opacity=".8" />
      <rect y="120" width="760" height="40" fill={`url(#${id}-mist)`} />

      {/* temple on the hill */}
      <g transform="translate(470 6) scale(.9)" color="#8C4A1F" opacity=".92">
        <TempleGroup />
      </g>

      {/* foreground ground */}
      <path d="M0 158 C120 148 240 160 380 156 C520 152 640 160 760 150 V190 H0Z" fill="#C6692A" opacity=".85" />

      {/* tree branches (right) */}
      <g fill="#B9561C" opacity=".85">
        <path d="M760 0 V26 C730 30 700 24 676 40 C690 44 704 46 716 60 C694 56 672 62 658 78 C682 76 704 84 716 98 L760 96Z" opacity=".9" />
        {[
          [640, 22, 26, 11, -20],
          [668, 8, 22, 9, 10],
          [700, 20, 24, 10, -10],
          [726, 6, 22, 9, 20],
          [690, 46, 24, 10, 15],
          [724, 38, 26, 11, -15],
          [652, 52, 20, 8, 25],
          [738, 66, 22, 9, 10],
          [706, 74, 22, 9, -20],
          [676, 70, 18, 8, 0],
        ].map(([cx, cy, rx, ry, rot], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${rot} ${cx} ${cy})`} />
        ))}
      </g>
    </svg>
  );
}

/** same temple shapes as <TempleSilhouette/> but as a <g> so it can sit inside another svg */
function TempleGroup() {
  return (
    <g fill="currentColor">
      <rect x="10" y="126" width="180" height="7" rx="1" />
      <rect x="20" y="119" width="160" height="7" rx="1" />
      <path d="M36 112 C36 96 42 84 52 74 L55 64 L58 74 C68 84 74 96 74 112Z" />
      <path d="M126 112 C126 96 132 84 142 74 L145 64 L148 74 C158 84 164 96 164 112Z" />
      <path d="M68 112 C68 80 78 50 92 32 L96 20 L104 20 L108 32 C122 50 132 80 132 112Z" />
      <ellipse cx="100" cy="27" rx="10" ry="4.5" />
      <path d="M97 22 L100 8 L103 22Z" />
      <path d="M22 112 L100 100 L178 112 L178 120 L22 120Z" />
    </g>
  );
}

/** Round admin avatar (temple at sunrise) used in the top bar. */
export function AdminAvatar({ className = 'h-11 w-11' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDE3B8" />
          <stop offset="1" stopColor="#E9904A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${id}-g)`} />
      <circle cx="40" cy="22" r="7" fill="#FFF3CF" opacity=".95" />
      <path d="M0 48 C16 40 30 44 44 42 C52 41 58 43 64 42 V64 H0Z" fill="#C8682A" opacity=".85" />
      <g transform="translate(12 12) scale(.2)" color="#6E3513">
        <TempleGroup />
      </g>
    </svg>
  );
}