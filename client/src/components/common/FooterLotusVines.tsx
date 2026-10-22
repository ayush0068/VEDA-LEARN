// OPTION B — Vedic motif border beside the footer mandala (desktop only).
// Half-open lotuses rising from the footer floor (echoing the half mandala), a lotus bud on a curved stem,
// kalka / paisley motifs, beaded garland swags, dashed rangoli arcs and tiny sparkles. All thin line-art.
// Same props as FooterVines, so you can swap one for the other. `flip` mirrors it for the RIGHT side.
import type { CSSProperties } from 'react';

type Props = { className?: string; flip?: boolean; style?: CSSProperties };

// pointed lotus petal (ogee shape), base at (0,0), tip at (0,-h)
const petal = (h: number, w: number) =>
  `M0 0 C ${-w * 1.1} ${-h * 0.28} ${-w * 0.8} ${-h * 0.78} 0 ${-h} C ${w * 0.8} ${-h * 0.78} ${w * 1.1} ${-h * 0.28} 0 0Z`;
const petalInner = (h: number, w: number) =>
  `M0 ${-h * 0.1} C ${-w * 0.5} ${-h * 0.3} ${-w * 0.36} ${-h * 0.66} 0 ${-h * 0.84} C ${w * 0.36} ${-h * 0.66} ${w * 0.5} ${-h * 0.3} 0 ${-h * 0.1}Z`;

type Layer = { angles: number[]; h: number; w: number };
const LOTUS_LAYERS: Layer[] = [
  { angles: [-74, -40, -8, 24, 58], h: 100, w: 19 },
  { angles: [-58, -24, 8, 42, 76], h: 82, w: 17 },
  { angles: [-40, -10, 22], h: 62, w: 15 },
  { angles: [-20, 12], h: 40, w: 11 },
];

function Lotus({ x, y, scale = 1, layers = LOTUS_LAYERS }: { x: number; y: number; scale?: number; layers?: Layer[] }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {layers.map((layer, li) =>
        layer.angles.map((a) => (
          <g key={`${li}-${a}`} transform={`rotate(${a})`}>
            <path d={petal(layer.h, layer.w)} fill="currentColor" fillOpacity="0.07" />
            <path d={petalInner(layer.h, layer.w)} opacity="0.5" strokeWidth="0.5" />
          </g>
        )),
      )}
      <circle r="6" fill="currentColor" fillOpacity="0.12" />
      <circle r="2.4" fill="currentColor" stroke="none" />
    </g>
  );
}

// paisley / kalka: curled teardrop with an inner echo line and a dot
function Paisley({ x, y, r, scale = 1 }: { x: number; y: number; r: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${scale})`}>
      <path d="M0 0 C 18 -6 24 -32 8 -50 C 1 -58 -10 -54 -11 -45 C -12 -36 -3 -31 3 -36 C 7 -39 5 -44 1 -44" fill="currentColor" fillOpacity="0.07" />
      <path d="M2 -6 C 13 -10 17 -29 7 -42" opacity="0.55" strokeWidth="0.5" />
      <circle cx="3" cy="-24" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="7" cy="-16" r="0.9" fill="currentColor" stroke="none" />
    </g>
  );
}

// closed lotus bud
function Bud({ x, y, r, scale = 1 }: { x: number; y: number; r: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${scale})`}>
      <path d={petal(46, 13)} transform="rotate(-24)" fill="currentColor" fillOpacity="0.07" />
      <path d={petal(46, 13)} transform="rotate(24)" fill="currentColor" fillOpacity="0.07" />
      <path d={petal(52, 14)} fill="currentColor" fillOpacity="0.09" />
      <path d={petalInner(52, 14)} opacity="0.5" strokeWidth="0.5" />
      <path d="M-14 4 C -8 -2 8 -2 14 4" opacity="0.6" />
    </g>
  );
}

// beads strung along a cubic curve
const bezier = (p: number[], t: number) => {
  const u = 1 - t;
  return [
    u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6],
    u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7],
  ];
};
const garland = (p: number[], n: number) =>
  Array.from({ length: n }, (_, i) => {
    const [x, y] = bezier(p, i / (n - 1));
    return { x, y, r: i % 3 === 1 ? 1.5 : 0.9 };
  });

const SWAGS = [
  [262, 296, 232, 330, 168, 330, 132, 292],
  [96, 252, 80, 280, 50, 296, 6, 292],
  [440, 222, 410, 250, 372, 252, 340, 236],
];
const BEADS = SWAGS.flatMap((p, i) => garland(p, i === 1 ? 14 : 18).map((b, j) => ({ ...b, k: `${i}-${j}` })));

const STARS: Array<[number, number, number]> = [
  [150, 150, 5], [34, 120, 4.5], [250, 190, 4], [360, 60, 5], [96, 34, 4], [410, 150, 3.5], [20, 40, 3.5],
];
const DOTS: Array<[number, number, number]> = [
  [170, 190, 1.2], [60, 86, 1.2], [8, 170, 1], [300, 120, 1.2], [210, 120, 1], [130, 90, 1], [400, 60, 1], [330, 190, 1.1],
];
const star = (r: number) => `M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z`;

export default function FooterLotusVines({ className = '', flip = false, style }: Props) {
  return (
    <svg
      viewBox="0 0 440 340"
      className={className}
      style={{ ...style, transform: flip ? 'scaleX(-1)' : undefined }}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden
    >
      {/* rangoli arcs around the main lotus (same language as the mandala's dashed ring) */}
      <g opacity="0.55" strokeWidth="0.6">
        <path d="M204 340 A132 132 0 0 1 429 247" strokeDasharray="1.5 3.5" />
        <path d="M186 340 A150 150 0 0 1 440 232" opacity="0.7" />
        <path d="M222 340 A114 114 0 0 1 418 262" opacity="0.7" />
      </g>

      {/* long hairline sweeps */}
      <g opacity="0.45" strokeWidth="0.6">
        <path d="M440 334 C 360 330 290 338 210 330 C 150 324 90 336 20 338" />
        <path d="M130 340 C 100 300 96 260 108 226" />
      </g>

      {/* stems */}
      <path d="M118 340 C 104 300 66 276 62 232 C 59 204 74 188 72 164" />
      <path d="M62 232 C 40 226 26 210 28 190 C 29 180 38 178 40 185" opacity="0.8" />
      <path d="M72 164 C 70 150 62 140 54 136" opacity="0.7" />

      {/* beaded garland swags */}
      <g fill="currentColor" stroke="none" opacity="0.8">
        {BEADS.map((b) => (
          <circle key={b.k} cx={b.x} cy={b.y} r={b.r} />
        ))}
      </g>

      {/* flowers */}
      <Lotus x={334} y={340} scale={1} />
      <Lotus x={160} y={340} scale={0.6} layers={LOTUS_LAYERS.slice(0, 3)} />
      <Bud x={72} y={164} r={-6} scale={1} />
      <Bud x={40} y={186} r={-50} scale={0.55} />

      {/* paisleys */}
      <Paisley x={226} y={296} r={-14} scale={0.8} />
      <Paisley x={14} y={284} r={-28} scale={0.9} />
      <Paisley x={112} y={230} r={18} scale={0.75} />
      <Paisley x={396} y={232} r={12} scale={0.65} />
      <Paisley x={288} y={236} r={-8} scale={0.55} />

      <g fill="currentColor" stroke="none">
        {DOTS.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
        {STARS.map(([x, y, r]) => (
          <path key={`s${x}-${y}`} d={star(r)} transform={`translate(${x} ${y})`} opacity="0.9" />
        ))}
      </g>
    </svg>
  );
}