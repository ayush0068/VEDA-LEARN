// Pair of big faint mandalas for the left / right edge of a SECTION (desktop only, lg+).
// The circle's diameter equals the section's height, so the mandala runs from the very top of the section to
// the very bottom (never cropped vertically) and is half hidden by the screen edge. A soft golden haze
// sits behind it and it turns very slowly, like the footer mandala.
//
// Usage: the parent <section> needs `relative overflow-hidden`, and its content wrapper needs `relative`
// so the content stays above the art:
//   <section className="relative overflow-hidden ..."><SectionMandalas /> <div className="relative ...">
import Mandala from '@/components/common/Mandala';

type Props = {
  /** which edges get a mandala */
  sides?: 'both' | 'left' | 'right';
  /** turn the opposite way (use on the next section so neighbours don't spin in sync) */
  reverse?: boolean;
  /** largest allowed diameter in px (very tall sections) */
  max?: number;
};

const HAZE =
  'radial-gradient(circle, rgba(217,164,65,0.16) 0%, rgba(217,164,65,0.07) 36%, transparent 66%)';

function Edge({ side, reverse, max }: { side: 'l' | 'r'; reverse?: boolean; max: number }) {
  return (
    <div
      className={`absolute top-1/2 aspect-square h-full -translate-y-1/2 ${
        side === 'l' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
      }`}
      style={{ maxHeight: max }}
    >
      <div className="absolute left-1/2 top-1/2 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundImage: HAZE }} />
      <Mandala
        className={`absolute inset-0 h-full w-full animate-spin-slow text-gold/[0.26] will-change-transform [stroke-width:0.3] motion-reduce:animate-none ${
          reverse ? '[animation-direction:reverse]' : ''
        }`}
      />
    </div>
  );
}

export default function SectionMandalas({ sides = 'both', reverse = false, max = 760 }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {sides !== 'right' && <Edge side="l" reverse={reverse} max={max} />}
      {sides !== 'left' && <Edge side="r" reverse={!reverse} max={max} />}
    </div>
  );
}