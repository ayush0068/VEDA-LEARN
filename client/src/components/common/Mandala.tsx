// Thin-line decorative lotus mandala. Colour comes from `currentColor` (set it with a text-* class).
// Stroke width is inherited from the <svg>, so parents can still thin/thicken it (e.g. [stroke-width:0.45]);
// hierarchy inside the art is made with opacity, never with hard-coded widths.
//
// Layers, outside -> in:
//   double outer ring · dashed ring · bead ring · 16 lotus petals · 16 smaller petals peeking in between ·
//   petal-base ring · eight-pointed star (two squares) · 12 inner petals · seed rings · 8-petal bud · bindu
const C = 100;

// pointed lotus petal (ogee) from base (0,0) up to tip (0,-h)
const petal = (h: number, w: number) =>
  `M0 0 C ${-w * 1.15} ${-h * 0.3} ${-w * 0.85} ${-h * 0.78} 0 ${-h} C ${w * 0.85} ${-h * 0.78} ${w * 1.15} ${-h * 0.3} 0 0Z`;
// inner echo line + centre vein
const petalInner = (h: number, w: number) =>
  `M0 ${-h * 0.12} C ${-w * 0.5} ${-h * 0.32} ${-w * 0.36} ${-h * 0.66} 0 ${-h * 0.84} C ${w * 0.36} ${-h * 0.66} ${w * 0.5} ${-h * 0.32} 0 ${-h * 0.12}Z`;

const ring = (n: number, offset = 0) => Array.from({ length: n }, (_, i) => offset + (360 / n) * i);

type PetalRing = { n: number; offset: number; base: number; h: number; w: number; inner?: boolean; fill: number };
const PETAL_RINGS: PetalRing[] = [
  { n: 16, offset: 11.25, base: 40, h: 31, w: 7.5, fill: 0.04 }, // small ones, drawn first so big petals sit on top
  { n: 16, offset: 0, base: 46, h: 40, w: 10.5, inner: true, fill: 0.06 }, // main outer petals
  { n: 12, offset: 15, base: 19, h: 17, w: 5.2, inner: true, fill: 0.06 }, // inner petals
  { n: 8, offset: 0, base: 3.5, h: 9, w: 3.4, fill: 0.08 }, // bud
];

const BEADS = ring(48);
const SPARKS = ring(16, 11.25); // little dots at the tips of the small petals

// octagram: two squares, one turned 45deg
const square = (r: number, rot: number) =>
  ring(4, rot)
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      return `${(C + r * Math.sin(rad)).toFixed(2)},${(C - r * Math.cos(rad)).toFixed(2)}`;
    })
    .join(' ');

export default function Mandala({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" aria-hidden>
      {/* outer rings */}
      <circle cx={C} cy={C} r="97" />
      <circle cx={C} cy={C} r="94.6" opacity="0.45" />
      <circle cx={C} cy={C} r="90.5" strokeDasharray="1.5 3" />

      {/* bead ring */}
      <g fill="currentColor" stroke="none" opacity="0.85">
        {BEADS.map((a) => (
          <circle key={a} cx={C} cy={C - 87.2} r={a % 30 === 0 ? 0.9 : 0.55} transform={`rotate(${a} ${C} ${C})`} />
        ))}
      </g>

      {/* petal rings */}
      {PETAL_RINGS.map(({ n, offset, base, h, w, inner, fill }) => (
        <g key={`${n}-${base}`}>
          {ring(n, offset).map((a) => (
            <g key={a} transform={`translate(${C} ${C}) rotate(${a}) translate(0 ${-base})`}>
              <path d={petal(h, w)} fill="currentColor" fillOpacity={fill} />
              {inner && <path d={petalInner(h, w)} opacity="0.5" />}
            </g>
          ))}
        </g>
      ))}

      {/* tiny sparks beyond the small petals */}
      <g fill="currentColor" stroke="none">
        {SPARKS.map((a) => (
          <circle key={a} cx={C} cy={C - 77} r="0.7" transform={`rotate(${a} ${C} ${C})`} />
        ))}
      </g>

      {/* geometry */}
      <circle cx={C} cy={C} r="46" opacity="0.7" />
      <g opacity="0.55">
        <polygon points={square(36, 0)} />
        <polygon points={square(36, 45)} />
        <circle cx={C} cy={C} r="36" strokeDasharray="1 2.4" />
      </g>
      <circle cx={C} cy={C} r="19" />
      <circle cx={C} cy={C} r="13" opacity="0.6" />
      <circle cx={C} cy={C} r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}