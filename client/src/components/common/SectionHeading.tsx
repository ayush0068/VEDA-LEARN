import { LotusMark } from '@/components/common/Logo';

interface SectionHeadingProps {
  id?: string;
  title: string;
  subtitle?: string;
}

/** Centered serif heading with a small lotus divider. Reused by upcoming sections. */
export default function SectionHeading({ id, title, subtitle }: SectionHeadingProps) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <h2 id={id} className="font-display text-3xl font-semibold text-veda-bark sm:text-4xl">
        {title}
      </h2>

      <div className="mx-auto mt-3 flex items-center justify-center gap-3" aria-hidden>
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/60" />
        <LotusMark className="h-5 w-5" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/60" />
      </div>

      {subtitle && <p className="mt-4 text-sm leading-relaxed text-veda-muted sm:text-base">{subtitle}</p>}
    </header>
  );
}