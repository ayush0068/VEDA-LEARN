// Soft Vedic atmosphere behind the page body (rendered once inside <main> by MainLayout).
// No grids, borders or strips: just a few floating lotus petals / sparkles near the page edges.
// The big mandalas live in the sections themselves (see SectionMandalas).
// It sits BEHIND the content (-z-10), never takes pointer events, and sections with their own solid
// background (hero, banners, cards) simply cover it. Tune the look with the FLOATS array below.

// pointed lotus petal (single, floating)
const PETAL = 'M0 0 C -5 -5 -5 -14 0 -20 C 5 -14 5 -5 0 0Z M0 -1 L0 -15';
const STAR = 'M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6Z';

type Float = { x: string; y: string; kind: 'petal' | 'star' | 'dot'; s: number; r?: number };
// x is a % of the page width: kept near the edges so the centre column stays clean
const FLOATS: Float[] = [
  { x: '4%', y: '6%', kind: 'star', s: 1.3 },
  { x: '94%', y: '9%', kind: 'petal', s: 1.1, r: -34 },
  { x: '7%', y: '27%', kind: 'dot', s: 1 },
  { x: '12%', y: '38%', kind: 'petal', s: 1.2, r: -20 },
  { x: '92%', y: '47%', kind: 'petal', s: 1, r: 18 },
  { x: '88%', y: '76%', kind: 'star', s: 1.2 },
  { x: '5%', y: '73%', kind: 'petal', s: 1.1, r: -38 },
  { x: '93%', y: '84%', kind: 'petal', s: 0.9, r: 30 },
];

export default function PageBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* floating petals, sparkles and dots */}
      <svg className="absolute inset-0 hidden h-full w-full text-gold/[0.38] md:block" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        {FLOATS.map(({ x, y, kind, s, r = 0 }) => (
          <svg key={`${x}-${y}`} x={x} y={y} width="1" height="1" overflow="visible">
            <g transform={`rotate(${r}) scale(${s})`}>
              {kind === 'petal' && <path d={PETAL} fill="currentColor" fillOpacity="0.15" />}
              {kind === 'star' && <path d={STAR} fill="currentColor" stroke="none" />}
              {kind === 'dot' && <circle r="1.8" fill="currentColor" stroke="none" />}
            </g>
          </svg>
        ))}
      </svg>
    </div>
  );
}