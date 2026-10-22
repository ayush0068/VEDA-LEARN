// OPTION A — realistic leafy vines beside the footer mandala (desktop only).
// Leaves are generated along the stems (alternate / paired, tapering toward the tip), each one an
// asymmetric pointed leaf with a slightly curved midrib, side veins and a soft translucent fill.
// Authored for the LEFT side; `flip` mirrors it for the RIGHT side.
import type { CSSProperties } from 'react';

type Props = { className?: string; flip?: boolean; style?: CSSProperties };
type Seg = readonly [number, number, number, number, number, number, number, number]; // cubic bezier x0..y3
type Stem = { segs: Seg[]; max: number; min: number; count: number; pair?: boolean };
type Leaf = { x: number; y: number; r: number; s: number };

// deterministic "random" so the art is identical on every render
const rnd = (i: number) => {
  const v = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return v - Math.floor(v);
};

const pt = ([x0, y0, x1, y1, x2, y2, x3, y3]: Seg, t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
    y: u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
  };
};
const angle = ([x0, y0, x1, y1, x2, y2, x3, y3]: Seg, t: number) => {
  const u = 1 - t;
  const dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
  const dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

// Stems run base -> tip (viewBox 440 x 340, bottom edge = footer floor, x=0 = screen edge, x=440 = mandala side)
const STEMS: Stem[] = [
  { segs: [[170, 340, 110, 330, 30, 296, 26, 228], [26, 228, 22, 170, 46, 120, 36, 36]], max: 24, min: 9, count: 8 },
  { segs: [[205, 340, 150, 320, 82, 290, 70, 222], [70, 222, 64, 176, 90, 140, 82, 80]], max: 22, min: 8, count: 8 },
  { segs: [[132, 340, 84, 328, 34, 322, 8, 284], [8, 284, 0, 262, 6, 240, 14, 214]], max: 17, min: 8, count: 6 },
  { segs: [[240, 340, 196, 318, 142, 280, 128, 226], [128, 226, 124, 196, 140, 176, 134, 140]], max: 19, min: 8, count: 7 },
  { segs: [[290, 340, 250, 324, 214, 300, 206, 262], [206, 262, 202, 238, 212, 224, 208, 196]], max: 16, min: 7, count: 6 },
  // inner sprigs (near the mandala): paired leaves, a little bigger
  { segs: [[440, 340, 408, 318, 376, 290, 372, 240], [372, 240, 368, 204, 386, 178, 378, 128]], max: 28, min: 11, count: 5, pair: true },
  { segs: [[384, 340, 352, 324, 322, 302, 316, 264], [316, 264, 314, 240, 324, 226, 320, 198]], max: 23, min: 10, count: 5, pair: true },
];

const LEAVES: Leaf[] = [];
STEMS.forEach((stem, si) => {
  const n = stem.segs.length;
  stem.segs.forEach((seg, i) => {
    for (let k = 0; k < stem.count; k++) {
      const t = (k + 0.55) / stem.count;
      const p = pt(seg, t);
      const a = angle(seg, t);
      const prog = (i + t) / n;
      const seed = si * 100 + i * 20 + k;
      const base = stem.max - (stem.max - stem.min) * prog;
      const off = 40 + rnd(seed) * 18;
      const sides = stem.pair ? [1, -1] : [k % 2 ? 1 : -1];
      sides.forEach((side, j) => {
        const s = base * (0.86 + rnd(seed + j + 7) * 0.28);
        LEAVES.push({ x: p.x, y: p.y, r: a + 90 + side * off, s });
      });
    }
  });
  // terminal leaf at the very tip
  const last = stem.segs[n - 1];
  const tip = pt(last, 1);
  LEAVES.push({ x: tip.x, y: tip.y, r: angle(last, 1) + 90, s: stem.min * 1.15 });
});

// real-leaf outline: rounded base, asymmetric belly, drawn-out pointed tip (+ curved midrib & side veins)
const leafOutline = (s: number) => {
  const w = s * 0.36;
  return `M0 0 C ${-w * 0.95} ${-s * 0.16} ${-w * 1.05} ${-s * 0.62} ${s * 0.07} ${-s} C ${w * 1.1} ${-s * 0.66} ${w * 0.92} ${-s * 0.2} 0 0Z`;
};
const leafVeins = (s: number) => {
  const w = s * 0.36;
  let d = `M0 ${s * 0.14} L0 0 Q ${s * 0.01} ${-s * 0.5} ${s * 0.07} ${-s * 0.95}`;
  [0.28, 0.46, 0.64].forEach((k) => {
    const mx = s * 0.045 * k;
    const my = -s * k;
    const reach = 1 - k * 0.55;
    d += ` M${mx} ${my} L${-w * 0.78 * reach} ${my - s * 0.15} M${mx} ${my} L${w * 0.8 * reach} ${my - s * 0.15}`;
  });
  return d;
};

// fine curling tendrils + long hairline sweeps toward the mandala
const FINE = [
  'M26 228 C 8 214 2 192 12 176 C 18 166 28 168 28 176 C 28 182 22 184 20 180',
  'M70 222 C 52 206 50 184 60 170 C 66 162 76 164 74 172 C 74 177 69 178 68 175',
  'M128 226 C 110 214 106 194 114 182 C 119 175 127 178 125 184',
  'M372 240 C 394 226 402 206 394 190 C 390 182 382 184 384 190 C 385 194 390 194 390 191',
  'M316 264 C 296 252 290 232 298 218 C 302 212 310 214 308 220',
  'M206 262 C 190 252 186 236 192 226',
  'M440 332 C 370 328 300 336 230 328 C 170 322 110 334 36 338',
  'M440 316 C 384 306 332 284 302 250',
  'M440 338 C 360 341 280 339 200 341',
  'M300 340 C 250 330 200 336 150 322',
];

const DOTS: Array<[number, number, number]> = [
  [108, 62, 1.5], [18, 120, 1.2], [58, 40, 1], [160, 120, 1.2], [182, 168, 1], [236, 214, 1.2], [112, 150, 1],
  [344, 88, 1.3], [412, 150, 1.2], [350, 210, 1], [330, 150, 1.2], [260, 262, 1.1], [412, 250, 1], [150, 20, 1], [8, 58, 1],
];
const STARS: Array<[number, number, number]> = [
  [120, 34, 5], [58, 14, 4], [196, 150, 4.5], [352, 54, 5], [270, 230, 4], [18, 156, 3.5], [404, 108, 4],
];
const star = (r: number) => `M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z`;

export default function FooterVines({ className = '', flip = false, style }: Props) {
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
      <g opacity="0.5" strokeWidth="0.6">
        {FINE.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <g>
        {STEMS.flatMap((st, i) =>
          st.segs.map((s, j) => (
            <path key={`${i}-${j}`} d={`M${s[0]} ${s[1]} C ${s[2]} ${s[3]} ${s[4]} ${s[5]} ${s[6]} ${s[7]}`} />
          )),
        )}
      </g>

      <g strokeWidth="0.65">
        {LEAVES.map(({ x, y, r, s }, i) => (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)})`}>
            <path d={leafOutline(s)} fill="currentColor" fillOpacity="0.1" />
            <path d={leafVeins(s)} opacity="0.55" strokeWidth="0.45" />
          </g>
        ))}
      </g>

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