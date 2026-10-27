import { Award, BookOpen, Infinity as InfinityIcon, PlayCircle, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LotusMark } from '@/components/common/Logo';
import SectionMandalas from '@/components/common/SectionMandalas';

const BENEFITS: { icon: LucideIcon; title: string; text: string; desktopOnly?: boolean }[] = [
  { icon: BookOpen, title: 'Expert Teachers', text: 'Learn from authentic guides and scholars' },
  { icon: PlayCircle, title: 'Live & Recorded', text: 'Access anytime, anywhere' },
  { icon: Award, title: 'Certificate Programs', text: 'Get certified after course completion' },
  { icon: UsersRound, title: 'Supportive Community', text: 'Connect with like-minded learners' },
  { icon: InfinityIcon, title: 'Learn at Your Pace', text: 'Lifetime access to enrolled courses', desktopOnly: true },
];

export default function BenefitsStrip() {
  return (
    <section className="relative overflow-hidden pb-10 pt-4 lg:pb-14 lg:pt-6" aria-label="Why learn with VedaLearn">
      <SectionMandalas />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-4 rounded-2xl border border-gold/25 bg-cream/90 py-4 shadow-soft lg:grid-cols-5 lg:py-6">
          {BENEFITS.map(({ icon: Icon, title, text, desktopOnly }) => (
            <li
              key={title}
              className={`flex flex-col items-center px-1.5 text-center lg:px-4 lg:[&:not(:first-child)]:border-l lg:border-gold/30 ${
                desktopOnly ? 'hidden lg:flex' : ''
              }`}
            >
              <Icon size={30} strokeWidth={1.3} className="text-veda-brown lg:h-9 lg:w-9" aria-hidden />
              <h3 className="mt-2 text-[0.7rem] font-semibold leading-tight text-veda-bark lg:mt-3 lg:text-[0.95rem]">{title}</h3>
              <p className="mt-1 hidden max-w-[11rem] text-[0.75rem] leading-snug text-veda-muted lg:block">{text}</p>
            </li>
          ))}
        </ul>

        <LotusMark className="mx-auto mt-5 h-6 w-6 opacity-70 lg:hidden" />
      </div>
    </section>
  );
}