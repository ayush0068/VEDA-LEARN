import Mandala from '@/components/common/Mandala';

/** Soft gold band with a short line (the "Transform Your Life..." / "Not Just a Course" strips on phones). */
export default function PromoBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-cream via-gold-pale/70 to-cream px-5 py-6 text-center">
      <div className="pointer-events-none absolute -left-8 top-1/2 -z-10 h-28 w-28 -translate-y-1/2" aria-hidden>
        <Mandala className="h-full w-full text-gold/25 [stroke-width:0.6]" />
      </div>
      <div className="pointer-events-none absolute -right-8 top-1/2 -z-10 h-28 w-28 -translate-y-1/2" aria-hidden>
        <Mandala className="h-full w-full text-gold/25 [stroke-width:0.6]" />
      </div>
      <span className="font-deva text-[1.7rem] text-saffron" aria-hidden>
        ॐ
      </span>
      <p className="font-display text-[1.25rem] font-semibold leading-snug text-veda-brown">{children}</p>
    </div>
  );
}