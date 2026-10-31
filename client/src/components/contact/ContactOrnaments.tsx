/** Small decorative SVGs used on the Contact page (pure SVG, no image files). */

/** Lotus that sits on top of the form card. */
export function CardLotus({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 48" className={className} fill="none" aria-hidden>
      <g stroke="#C26A1B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M45 4c6 6 9 14 0 28-9-14-6-22 0-28z" fill="#F6DFA9" fillOpacity=".7" />
        <path d="M45 32C34 31 25 24 21 13c10 1 19 6 24 19z" fill="#F1DFB4" fillOpacity=".75" />
        <path d="M45 32c11-1 20-8 24-19-10 1-19 6-24 19z" fill="#F1DFB4" fillOpacity=".75" />
        <path d="M44 34C32 36 18 32 6 22c2 12 12 22 39 22s37-10 39-22c-12 10-26 14-39 12z" fill="#F8E8C2" fillOpacity=".8" />
      </g>
    </svg>
  );
}

/** Filigree corner for the form card. `flip` mirrors it for the top-right corner. */
export function CardCorner({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`${className} ${flip ? '-scale-x-100' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 46V20C2 10 10 2 20 2h26" opacity=".7" />
      <path d="M8 46V22c0-8 6-14 14-14h24" opacity=".5" />
      <path d="M14 14c4 0 8 3 8 8 0 3-2 5-5 5s-5-2-5-4 2-4 4-4" />
      <path d="M22 8c0 4-3 6-6 6M8 22c4 0 6-3 6-6" opacity=".8" />
      <circle cx="26" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="26" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** ──── ॐ ──── divider under the hero text. */
export function OmDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-saffron ${className}`} aria-hidden>
      <span className="h-px w-16 bg-saffron/60 sm:w-24" />
      <span className="h-1 w-1 rotate-45 bg-saffron/80" />
      <span className="font-deva text-xl font-semibold">ॐ</span>
      <span className="h-1 w-1 rotate-45 bg-saffron/80" />
      <span className="h-px w-16 bg-saffron/60 sm:w-24" />
    </div>
  );
}