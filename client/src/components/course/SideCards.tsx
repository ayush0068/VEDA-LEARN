import { Award, BookOpen, Clock, Compass, Download, GraduationCap, Infinity as InfinityIcon, MessagesSquare, MonitorPlay, Sparkles, Star, UsersRound } from 'lucide-react';
import Mandala from '@/components/common/Mandala';
import type { CourseDetail } from '@/constants/courseDetails';
import type { Course } from '@/types';
import { formatPlus, instructorPhoto } from '@/utils/courseFormat';
import Avatar from './Avatar';

const card = 'rounded-2xl border border-gold/20 bg-cream/70 p-5 shadow-soft sm:p-6';

/** "This Course Includes" */
export function IncludesCard({ course }: { course: Course }) {
  const items = [
    { icon: MonitorPlay, text: `${course.lessons ?? 0} Video Lessons` },
    { icon: Clock, text: `${course.weeks ?? 0} Weeks Duration` },
    { icon: Download, text: 'Downloadable Resources' },
    { icon: MessagesSquare, text: 'Live Q&A Sessions' },
    { icon: Award, text: 'Certificate of Completion' },
    { icon: InfinityIcon, text: 'Lifetime Access' },
  ];

  return (
    <section aria-labelledby="includes-heading" className={card}>
      <h2 id="includes-heading" className="text-[1.02rem] font-semibold text-veda-bark">
        This Course Includes
      </h2>
      <ul className="mt-4 space-y-3.5">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-[0.88rem] text-veda-text">
            <Icon size={18} strokeWidth={1.5} className="shrink-0 text-saffron" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Who Is This Course For?" */
export function AudienceCard({ items }: { items: string[] }) {
  const icons = [BookOpen, Sparkles, GraduationCap, Compass];
  return (
    <section aria-labelledby="audience-heading" className={card}>
      <h2 id="audience-heading" className="font-display text-[1.25rem] font-semibold text-veda-bark">
        Who Is This Course For?
      </h2>
      <ul className="mt-4 space-y-3.5">
        {items.map((text, i) => {
          const Icon = icons[i % icons.length];
          return (
            <li key={text} className="flex items-start gap-3 text-[0.86rem] leading-snug text-veda-text">
              <Icon size={19} strokeWidth={1.4} className="mt-0.5 shrink-0 text-saffron" aria-hidden />
              {text}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "Meet Your Instructor" (photo from public/images/instructors/<name>.png) */
export function InstructorCard({ name, info }: { name: string; info: CourseDetail['instructor'] }) {
  const stats = [
    { icon: Clock, value: formatPlus(info.coursesConducted), label: 'Courses Conducted' },
    { icon: UsersRound, value: formatPlus(info.students), label: 'Students' },
    { icon: Star, value: info.rating.toFixed(1), label: 'Average Rating' },
  ];

  return (
    <section aria-labelledby="instructor-heading" className={`${card} relative isolate overflow-hidden`}>
      <div className="pointer-events-none absolute -right-16 -top-16 -z-10 h-52 w-52" aria-hidden>
        <Mandala className="h-full w-full text-gold/15 [stroke-width:0.5]" />
      </div>

      <h2 id="instructor-heading" className="font-display text-[1.45rem] font-semibold text-veda-bark">
        Meet Your Instructor
      </h2>

      <div className="mt-5 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left lg:flex-col lg:text-center">
        <Avatar
          name={name}
          src={instructorPhoto(name)}
          className="h-32 w-32 ring-4 ring-gold-pale sm:h-28 sm:w-28 lg:h-36 lg:w-36"
          textClass="text-3xl"
        />
        <div>
          <p className="font-display text-[1.25rem] font-semibold text-veda-bark">{name}</p>
          <p className="mt-1 text-[0.9rem] text-veda-text">{info.title}</p>
          <p className="text-[0.85rem] text-veda-muted">{info.experience}</p>
        </div>
      </div>

      <p className="mt-4 text-[0.88rem] leading-relaxed text-veda-text">{info.bio.replace('{name}', name)}</p>

      <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-gold/25 pt-4 text-center">
        {stats.map(({ icon: Icon, value, label }) => (
          <li key={label} className="flex flex-col items-center gap-1">
            <span className="flex items-center gap-1.5 text-[0.98rem] font-semibold text-veda-bark">
              <Icon size={16} className="text-saffron" aria-hidden /> {value}
            </span>
            <span className="text-[0.68rem] leading-tight text-veda-muted">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}