import { Link } from 'react-router-dom';
import { LotusMark } from '@/components/common/Logo';

export default function DashLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="VedaLearn home">
      <LotusMark className={compact ? 'h-9 w-9 shrink-0' : 'h-11 w-11 shrink-0'} />
      <span className="leading-none">
        <span className={`block font-display font-semibold text-veda-brown ${compact ? 'text-[1.4rem]' : 'text-[1.6rem]'}`}>VedaLearn</span>
        <span className="mt-0.5 block text-[0.6rem] tracking-wide text-veda-muted">Learn · Practice · Grow</span>
      </span>
    </Link>
  );
}