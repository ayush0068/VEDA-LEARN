import Mandala from '@/components/common/Mandala';
import SectionHeading from '@/components/common/SectionHeading';
import { getIcon } from '@/constants/icons';
import { useFeatures } from '@/hooks/useFeatures';

export default function DiscoverSection() {
  const { features } = useFeatures();

  return (
    <section className="relative overflow-hidden bg-ivory py-14 sm:py-20" aria-labelledby="discover-heading">
      {/* decorative mandalas (desktop only) */}
      <Mandala className="pointer-events-none absolute -left-40 top-1/2 hidden h-[24rem] w-[24rem] -translate-y-1/2 text-gold/30 md:block" />
      <Mandala className="pointer-events-none absolute -right-40 top-1/2 hidden h-[24rem] w-[24rem] -translate-y-1/2 text-gold/30 md:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="discover-heading"
          title="Discover a Deeper You"
          subtitle="Our courses are designed to bring authentic Vedic knowledge to modern learners in a practical and easy-to-understand way."
        />

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0">
          {features.map((feature) => {
            const Icon = getIcon(feature.icon);
            return (
              <li
                key={feature.key}
                className="flex flex-col items-center px-3 text-center last:col-span-2 sm:last:col-span-1 lg:border-l lg:border-gold/30 lg:first:border-l-0"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/35 bg-gold-pale/50 text-veda-brown">
                  <Icon size={28} strokeWidth={1.4} aria-hidden />
                </span>
                <h3 className="mt-4 text-[0.95rem] font-semibold text-veda-bark">{feature.title}</h3>
                <p className="mt-1.5 max-w-[11rem] text-xs leading-relaxed text-veda-muted sm:text-[0.8rem]">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}