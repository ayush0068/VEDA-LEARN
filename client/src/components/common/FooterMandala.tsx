import type { CSSProperties } from 'react';
import Mandala from '@/components/common/Mandala';
// Side ornament: pick ONE (both take the same props) —
//   Option A: realistic leafy vines   -> '@/components/common/FooterVines'
//   Option B: lotus + paisley (Vedic) -> '@/components/common/FooterLotusVines'
import FooterVines from '@/components/common/FooterLotusVines';

// Reuses the existing <Mandala /> line-art at the very end of the page (inside the footer).
// - Only its top part is visible (the lower part is cropped away) and it turns very slowly clockwise
//   (--animate-spin-slow in index.css).
// - Desktop only (lg+): thin vine flourishes (<FooterVines />) fill the empty space left and right of the mandala.
// - A soft golden light rises from the mandala's centre up into the footer. The glow is NOT clipped to
//   the mandala box, so there is no visible edge: footer and mandala read as one surface.

// S = mandala diameter: full width on phones, capped on large screens
const sizeVars = { '--s': 'min(100vw, 780px)' } as CSSProperties;

// each flourish fills the free space beside the mandala (capped so it stays small and quiet)
const VINE_STYLE = { width: 'min(440px, calc((100% - var(--s)) / 2 - 12px))' } as CSSProperties;
const VINE_CLASS = 'absolute bottom-0 hidden h-auto text-gold-soft/55 lg:block';

const GLOW =
  'radial-gradient(ellipse 50% 100% at 50% 100%, rgba(217,164,65,0.20) 0%, rgba(217,164,65,0.09) 38%, rgba(217,164,65,0.03) 62%, transparent 80%)';

export default function FooterMandala() {
  return (
    <div
      className="pointer-events-none relative"
      style={{ ...sizeVars, height: 'calc(var(--s) * 0.54)' }}
      aria-hidden
    >
      {/* light radiating upward from the mandala; sits behind the footer content (footer is `isolate`) */}
      <div
        className="absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
        style={{ width: 'calc(var(--s) * 1.7)', height: 'calc(var(--s) * 1.1)', backgroundImage: GLOW }}
      />

      {/* side flourishes (desktop only) */}
      <FooterVines className={`${VINE_CLASS} left-0`} style={VINE_STYLE} />
      <FooterVines className={`${VINE_CLASS} right-0`} style={VINE_STYLE} flip />

      {/* crop box: shows only the top part of the mandala */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[3%] -translate-x-1/2" style={{ width: 'var(--s)', height: 'var(--s)' }}>
          <Mandala className="h-full w-full animate-spin-slow text-gold-soft/60 will-change-transform [stroke-width:0.45] motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}