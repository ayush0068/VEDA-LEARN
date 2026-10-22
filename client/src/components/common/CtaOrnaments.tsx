// Decorative SVG ornaments for the "Begin Your Vedic Learning Journey" banner:
// a cluster of banana leaves and a brass diya (oil lamp). Pure SVG, no image files.

const LEAVES = [
  { rotate: -30, scale: 0.88 },
  { rotate: 6, scale: 1 },
  { rotate: 34, scale: 0.78 },
];

function leafVeins(): string {
  const parts: string[] = [];
  for (let y = 30; y <= 226; y += 17) {
    const t = y / 250; // 0 near tip, 1 near base
    const half = 64 * Math.sin(Math.PI * Math.min(t * 1.05, 1)) * 0.92;
    parts.push(`M0 ${-y} C${-half * 0.45} ${-y + 10}, ${-half * 0.8} ${-y + 4}, ${-half} ${-y - 14}`);
    parts.push(`M0 ${-y} C${half * 0.45} ${-y + 10}, ${half * 0.8} ${-y + 4}, ${half} ${-y - 14}`);
  }
  return parts.join(' ');
}
const VEINS = leafVeins();

export function LeafCluster({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 270 310" className={className} aria-hidden>
      <defs>
        <linearGradient id="leafFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2F4B14" />
          <stop offset="0.5" stopColor="#5F7F25" />
          <stop offset="1" stopColor="#3A5A17" />
        </linearGradient>
      </defs>
      <g transform="translate(135 306)">
        {LEAVES.map(({ rotate, scale }) => (
          <g key={rotate} transform={`rotate(${rotate}) scale(${scale})`}>
            <path d="M0 0 C-66 -58 -74 -170 0 -256 C74 -170 66 -58 0 0Z" fill="url(#leafFill)" />
            <path d={VEINS} fill="none" stroke="#A9C466" strokeWidth="1.1" opacity="0.45" />
            <path d="M0 0 L0 -246" stroke="#B5CF72" strokeWidth="2.2" opacity="0.75" strokeLinecap="round" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Diya({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <defs>
        <radialGradient id="diyaGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFC15A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2CF7A" />
          <stop offset="0.5" stopColor="#C58B2B" />
          <stop offset="1" stopColor="#7A4F14" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#E8610F" />
          <stop offset="0.6" stopColor="#FFA524" />
          <stop offset="1" stopColor="#FFE38A" />
        </linearGradient>
      </defs>

      {/* glow */}
      <circle cx="60" cy="42" r="34" fill="url(#diyaGlow)" />

      {/* flame (gentle flicker) */}
      <path d="M60 14 C48 30 50 44 60 50 C70 44 72 30 60 14Z" fill="url(#flame)">
        <animate attributeName="opacity" values="0.92;1;0.88;1;0.92" dur="2.6s" repeatCount="indefinite" />
      </path>
      <path d="M60 30 C55 38 56 44 60 47 C64 44 65 38 60 30Z" fill="#FFF3C4" opacity="0.9" />

      {/* lamp bowl + stand */}
      <path d="M22 54 Q60 52 98 54 Q92 82 60 84 Q28 82 22 54Z" fill="url(#brass)" />
      <path d="M26 56 Q60 54 94 56" stroke="#FFE7A3" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M54 84 H66 L70 98 H50Z" fill="url(#brass)" />
      <ellipse cx="60" cy="101" rx="24" ry="6" fill="url(#brass)" />

      {/* marigold petals */}
      <g>
        <circle cx="22" cy="104" r="7" fill="#F29A1F" />
        <circle cx="30" cy="109" r="6" fill="#FFB938" />
        <circle cx="98" cy="105" r="7" fill="#F29A1F" />
        <circle cx="90" cy="110" r="5.5" fill="#FFB938" />
      </g>
    </svg>
  );
}