import { ArrowRight, MessageCircleQuestion, MonitorPlay, UserCheck, UsersRound } from 'lucide-react';
import Mandala from '@/components/common/Mandala';
import { LIVE_TEACHERS } from '@/constants/liveClasses';
import { TeacherAvatar } from './LiveCommon';

const REASONS = [
  { Icon: UserCheck, text: 'Learn directly from experts' },
  { Icon: MessageCircleQuestion, text: 'Get your questions answered' },
  { Icon: UsersRound, text: 'Practice in real-time with guidance' },
  { Icon: MonitorPlay, text: 'Access recordings for revision' },
];

export function WhyJoin() {
  return (
    <section className="rounded-xl border border-gold/25 bg-cream/60 p-4" aria-labelledby="why-join">
      <h2 id="why-join" className="font-display text-[1.1rem] font-semibold text-veda-bark">
        Why Join Live Classes?
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3.5">
        {REASONS.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ivory text-veda-brown">
              <Icon size={18} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-[0.72rem] leading-snug text-veda-text">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeaturedTeacher({ onViewProfile }: { onViewProfile: (teacherId: string) => void }) {
  const t = LIVE_TEACHERS[0];
  return (
    <section className="rounded-xl border border-gold/25 bg-ivory p-4 shadow-soft" aria-labelledby="featured-teacher">
      <h2 id="featured-teacher" className="font-display text-[1.1rem] font-semibold text-veda-bark">
        Featured Teacher
      </h2>
      <div className="mt-3 flex items-center gap-3">
        <TeacherAvatar src={t.avatar} name={t.name} className="h-[74px] w-[74px] border border-gold/40" text="text-xl" />
        <div className="min-w-0">
          <p className="font-display text-[0.98rem] font-semibold leading-snug text-veda-bark">{t.name}</p>
          <p className="mt-0.5 text-[0.74rem] text-veda-text">{t.role}</p>
          <p className="text-[0.74rem] text-veda-muted">{t.years}</p>
        </div>
      </div>
      <p className="mt-3 text-[0.78rem] leading-relaxed text-veda-muted">{t.bio}</p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onViewProfile(t.id)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-veda-brown/50 px-3 text-[0.74rem] font-medium text-veda-brown transition-colors hover:bg-veda-brown hover:text-ivory"
        >
          View Profile <ArrowRight size={13} aria-hidden />
        </button>
      </div>
    </section>
  );
}

export function RecordingsCta({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="relative isolate overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold-pale to-[#f3d79a] p-5">
      <Mandala className="pointer-events-none absolute -left-8 top-1/2 -z-10 h-32 w-32 -translate-y-1/2 text-gold/50 [stroke-width:0.5]" />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-deva text-4xl font-bold text-gold/70" aria-hidden>
        ॐ
      </span>
      <div className="pl-14">
        <h2 className="font-display text-[1.2rem] font-semibold leading-snug text-veda-bark">
          Can't Attend Live? <br />
          Watch Recordings Later
        </h2>
        <p className="mt-1.5 text-[0.74rem] leading-snug text-veda-text">All live classes are recorded and available for enrolled students.</p>
        <button type="button" onClick={onBrowse} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-veda-brown px-4 text-[0.78rem] font-medium text-ivory hover:bg-veda-bark">
          Browse Recorded Classes <ArrowRight size={14} aria-hidden />
        </button>
      </div>
    </section>
  );
}