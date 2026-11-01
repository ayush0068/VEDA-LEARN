import { Award, Check, FileText, PlayCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { ActivityType, DashboardActivity } from '@/types/dashboard';
import { timeAgo } from '@/utils/dashboardLogic';
import { CARD, SectionTitle } from './DashParts';

const LOOK: Record<ActivityType, { Icon: LucideIcon; ring: string }> = {
  lesson: { Icon: Check, ring: 'border-emerald-600 bg-emerald-600 text-white' },
  live: { Icon: PlayCircle, ring: 'border-saffron/80 bg-gold-pale/50 text-saffron' },
  assignment: { Icon: FileText, ring: 'border-gold bg-gold-pale/50 text-saffron' },
  certificate: { Icon: Award, ring: 'border-gold bg-gold-pale/50 text-saffron' },
};

export default function RecentActivity({ activity, now }: { activity: DashboardActivity[]; now: number }) {
  const [all, setAll] = useState(false);
  const list = all ? activity : activity.slice(0, 4);

  return (
    <section className={`${CARD} p-4`} aria-labelledby="recent-activity">
      <SectionTitle
        id="recent-activity"
        title="Recent Activity"
        size="md"
        onClick={activity.length > 4 ? () => setAll((v) => !v) : undefined}
        label={all ? 'Show Less' : 'View All'}
      />

      {list.length ? (
        <ul className="mt-3 divide-y divide-gold/15">
          {list.map((a, i) => {
            const { Icon, ring } = LOOK[a.type];
            return (
              <li key={`${a.at}-${i}`} className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-0">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${ring}`}>
                  <Icon size={a.type === 'lesson' ? 15 : 16} strokeWidth={a.type === 'lesson' ? 3 : 1.7} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[0.85rem] font-semibold leading-snug text-veda-bark">{a.title}</p>
                    <time dateTime={a.at} className="shrink-0 text-[0.7rem] text-veda-muted">
                      {timeAgo(a.at, now)}
                    </time>
                  </div>
                  <p className="text-[0.8rem] leading-snug text-veda-text">{a.subtitle}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-veda-muted">Your lessons, live classes and certificates will show up here.</p>
      )}
    </section>
  );
}