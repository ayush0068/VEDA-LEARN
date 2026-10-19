// Hand-built SVG scene: riverside temple at dawn, banyan canopy, meditating learner, Veda books.
// Pure SVG (no external image) so it stays sharp at any size and works offline.

const rand = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const LEAF_COLORS = ['#5E6B22', '#7C8A2E', '#9AA03F', '#4A5A1E', '#B2A94A', '#6F7F2A'];

const buildLeaves = () => {
  const r = rand(42);
  const leaves: { x: number; y: number; rx: number; ry: number; rot: number; fill: string; o: number }[] = [];
  for (let i = 0; i < 150; i += 1) {
    // concentrated top-right, drooping toward the left
    const x = 360 + r() * 380;
    const yBase = 20 + r() * 120;
    const droop = Math.max(0, (560 - x) / 560) * 70 * r();
    leaves.push({
      x,
      y: yBase + droop,
      rx: 14 + r() * 20,
      ry: 6 + r() * 9,
      rot: -60 + r() * 120,
      fill: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)],
      o: 0.75 + r() * 0.25,
    });
  }
  return leaves;
};

const LEAVES = buildLeaves();

const BOOKS = [
  { text: 'ऋग्वेद', y: 238, x: 560, w: 230 },
  { text: 'यजुर्वेद', y: 312, x: 548, w: 242 },
  { text: 'सामवेद', y: 386, x: 560, w: 230 },
  { text: 'अथर्ववेद', y: 460, x: 552, w: 238 },
];

export default function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 760 640"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="A learner meditating by a riverside temple at sunrise beside a stack of the four Vedas"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F9E7BE" />
          <stop offset="0.55" stopColor="#F6D79A" />
          <stop offset="1" stopColor="#EFC27C" />
        </linearGradient>
        <radialGradient id="sun" cx="0.48" cy="0.42" r="0.55">
          <stop offset="0" stopColor="#FFF8DC" stopOpacity="1" />
          <stop offset="0.45" stopColor="#FCE3A4" stopOpacity="0.65" />
          <stop offset="1" stopColor="#F6D79A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0CB8A" />
          <stop offset="1" stopColor="#CF9553" />
        </linearGradient>
        <linearGradient id="ghat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7804A" />
          <stop offset="1" stopColor="#6E4120" />
        </linearGradient>
        <linearGradient id="book" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E4D20" />
          <stop offset="1" stopColor="#5A2D10" />
        </linearGradient>
        <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBEBCB" />
          <stop offset="1" stopColor="#E3C595" />
        </linearGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6B4426" />
          <stop offset="1" stopColor="#3E2512" />
        </linearGradient>
      </defs>

      <rect width="760" height="640" fill="url(#sky)" />
      <rect width="760" height="640" fill="url(#sun)" />
      <circle cx="350" cy="215" r="46" fill="#FFF3CC" opacity="0.85" />

      {/* distant temples */}
      <g fill="#C79A63" opacity="0.5">
        <path d="M150 330 L150 292 Q150 262 172 232 Q194 262 194 292 L194 330Z" />
        <rect x="140" y="326" width="64" height="8" />
      </g>
      <g fill="#B7894F" opacity="0.7">
        {/* main shikhara */}
        <rect x="262" y="318" width="170" height="16" />
        <rect x="276" y="296" width="142" height="24" />
        <path d="M296 296 C296 250 310 205 347 148 C384 205 398 250 398 296Z" />
        <path d="M300 296 C300 270 306 250 312 236 L382 236 C388 250 394 270 394 296Z" fill="#A67A44" />
        <rect x="341" y="118" width="12" height="32" />
        <circle cx="347" cy="112" r="8" />
        {/* side tower */}
        <path d="M222 318 L222 286 Q222 262 242 238 Q262 262 262 286 L262 318Z" />
        <path d="M432 318 L432 286 Q432 262 452 238 Q472 262 472 286 L472 318Z" />
      </g>
      <g stroke="#8A5E2E" strokeWidth="1.4" opacity="0.5" fill="none">
        <path d="M304 270 H390 M308 252 H386 M314 234 H380 M322 216 H372 M330 198 H364 M338 180 H356" />
      </g>

      {/* river */}
      <rect y="334" width="760" height="140" fill="url(#river)" />
      <g stroke="#FFF1C8" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M120 360 h70 M250 372 h110 M430 362 h90 M170 392 h130 M360 404 h100 M520 388 h110 M80 424 h90 M300 436 h140" />
      </g>
      <path d="M300 340 Q347 352 394 340 L394 346 Q347 360 300 346Z" fill="#FFF3CC" opacity="0.45" />

      {/* ghat / ground */}
      <path d="M0 470 Q200 452 420 466 T760 458 L760 640 L0 640Z" fill="url(#ghat)" />
      <path d="M0 500 H760 M0 540 H760 M0 584 H760" stroke="#4E2C14" strokeWidth="1.5" opacity="0.18" />

      {/* banyan trunk + roots */}
      <path d="M690 80 C676 200 700 300 664 470 L760 470 L760 80Z" fill="url(#trunk)" />
      <g stroke="#4A2D17" strokeWidth="2.2" opacity="0.8" strokeLinecap="round">
        <path d="M470 120 V230" /><path d="M520 130 V250" /><path d="M575 125 V210" />
        <path d="M625 118 V265" /><path d="M430 100 V170" />
      </g>

      {/* canopy */}
      <g>
        {LEAVES.map((l, i) => (
          <ellipse
            key={i}
            cx={l.x}
            cy={l.y}
            rx={l.rx}
            ry={l.ry}
            fill={l.fill}
            opacity={l.o}
            transform={`rotate(${l.rot} ${l.x} ${l.y})`}
          />
        ))}
      </g>

      {/* mat */}
      <path d="M150 548 L430 548 L470 612 L110 612Z" fill="#8F2F22" />
      <path d="M150 548 L430 548 L470 612 L110 612Z" fill="none" stroke="#E3B552" strokeWidth="4" />
      <path d="M164 560 L416 560 L446 600 L134 600Z" fill="none" stroke="#E3B552" strokeWidth="1.5" opacity="0.7" />

      {/* meditating figure (seen from behind) */}
      <g>
        {/* crossed legs */}
        <ellipse cx="290" cy="548" rx="128" ry="40" fill="url(#cloth)" />
        <path d="M170 552 Q290 590 410 552" fill="none" stroke="#C9A06A" strokeWidth="2" opacity="0.7" />
        {/* torso skin */}
        <path d="M236 408 C236 376 344 376 344 408 L356 530 H224Z" fill="#B97A4C" />
        {/* shoulder cloth (upper wrap) */}
        <path d="M232 430 C250 418 330 418 350 430 L360 534 H222Z" fill="url(#cloth)" />
        <path d="M250 424 L340 520" stroke="#C9A06A" strokeWidth="5" opacity="0.55" strokeLinecap="round" />
        {/* arms */}
        <path d="M232 412 C214 440 212 492 232 534 L248 530 C238 490 240 450 252 420Z" fill="#B97A4C" />
        <path d="M348 412 C366 440 368 492 348 534 L332 530 C342 490 340 450 328 420Z" fill="#B97A4C" />
        {/* neck + head */}
        <rect x="278" y="364" width="24" height="26" rx="8" fill="#A96C41" />
        <circle cx="290" cy="344" r="30" fill="#2A170E" />
        <circle cx="290" cy="306" r="14" fill="#2A170E" />
        <path d="M262 346 Q290 372 318 346" fill="none" stroke="#5C3A22" strokeWidth="2" opacity="0.5" />
        {/* warm rim light */}
        <path d="M322 336 C330 350 332 372 326 392" stroke="#FFD58A" strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />
      </g>

      {/* Veda books */}
      <g>
        {BOOKS.map((b) => (
          <g key={b.text}>
            <rect x={b.x} y={b.y} width={b.w} height="62" rx="9" fill="url(#book)" />
            <rect x={b.x} y={b.y} width={b.w} height="62" rx="9" fill="none" stroke="#D9A441" strokeWidth="2.5" />
            <rect x={b.x + 7} y={b.y + 7} width={b.w - 14} height="48" rx="5" fill="none" stroke="#D9A441" strokeWidth="1" opacity="0.7" />
            <rect x={b.x + 20} y={b.y} width="7" height="62" fill="#D9A441" opacity="0.55" />
            <text
              x={b.x + 52}
              y={b.y + 43}
              fontSize="34"
              fontWeight="700"
              fill="#EDBE5A"
              fontFamily="'Noto Serif Devanagari','Nirmala UI',Mangal,serif"
            >
              {b.text}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
