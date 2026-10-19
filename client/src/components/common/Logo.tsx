import { Link } from 'react-router-dom';

export function LotusMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <g stroke="#B7791F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 8c6 7 8 15 0 27-8-12-6-20 0-27z" fill="#F3D58B" fillOpacity=".55" />
        <path d="M32 35c-10 0-18-7-21-17 9 0 17 4 21 17z" fill="#E9BE62" fillOpacity=".45" />
        <path d="M32 35c10 0 18-7 21-17-9 0-17 4-21 17z" fill="#E9BE62" fillOpacity=".45" />
        <path d="M32 36c-10 3-19-1-27-9 1 12 9 22 27 22s26-10 27-22c-8 8-17 12-27 9z" fill="#F3D58B" fillOpacity=".35" />
        <path d="M18 54c4 2 9 3 14 3s10-1 14-3" />
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="VedaLearn home">
      <LotusMark className="h-11 w-11 shrink-0" />
      <span className="leading-none">
        <span className="block font-display text-[1.65rem] font-semibold text-veda-brown">VedaLearn</span>
        <span className="mt-1 block text-[0.62rem] tracking-wide text-veda-muted">
          Ancient Wisdom. Online, For You.
        </span>
      </span>
    </Link>
  );
}
