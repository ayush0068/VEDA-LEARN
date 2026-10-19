import { TRUST_ITEMS } from '@/constants/trustItems';

function Group({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      className="m-0 flex shrink-0 list-none items-center gap-7 pr-7 sm:gap-10 sm:pr-10"
      aria-hidden={hidden || undefined}
    >
      {TRUST_ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2.5 whitespace-nowrap">
          <Icon size={16} strokeWidth={1.8} className="shrink-0 text-gold-soft" aria-hidden />
          <span className="text-[0.8rem] font-medium tracking-wide text-ivory sm:text-sm">{label}</span>
          <span className="ml-2.5 h-1.5 w-1.5 rotate-45 bg-gold/70 sm:ml-4" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

export default function TrustBar() {
  return (
    <section
      className="group border-y border-gold/40 bg-veda-bark py-2.5 sm:py-3"
      aria-label="Why learners choose VedaLearn"
    >
      {/* viewport: hides overflow + soft fade on both edges */}
      <div className="overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[-webkit-mask-image:none] motion-reduce:[mask-image:none]">
        {/* track: animate-trust-sm (mobile) / animate-trust (desktop) are defined in index.css */}
        <div className="flex w-max animate-trust-sm will-change-transform group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] group-active:[animation-play-state:paused] motion-reduce:animate-none sm:animate-trust">
          <Group />
          <Group hidden />
        </div>
      </div>
    </section>
  );
}