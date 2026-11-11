import { HeroScene } from '@/components/common/Art';

export default function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-[#FDEBD0] shadow-card">
      <HeroScene className="absolute inset-y-0 right-0 h-full w-full opacity-60 [mask-image:linear-gradient(to_right,transparent,black_45%)] sm:w-[80%] sm:opacity-100 lg:w-[72%]" />
      {/* fades the picture into the page colour on the left so the text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FDF0DC] via-[#FDF0DC]/85 to-transparent sm:via-[#FDF0DC]/60" />

      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="font-display text-[1.5rem] font-bold leading-tight text-veda-bark sm:text-[1.9rem]">
          Welcome Back, Admin <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-[0.88rem] text-veda-bark/90 sm:text-[0.95rem]">Here&apos;s what&apos;s happening on VedaLearn today.</p>
      </div>
    </section>
  );
}