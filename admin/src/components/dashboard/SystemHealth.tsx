import { Server } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { SYSTEM_HEALTH } from '@/data/dashboard';

export default function SystemHealth() {
  return (
    <Card className="p-4">
      <CardHeader icon={Server} title="System Health" />

      <ul className="mt-3.5 space-y-3">
        {SYSTEM_HEALTH.map(({ label, value, tone, icon: Icon, progress }) => (
          <li key={label} className="flex items-center gap-3 text-[0.8rem]">
            <Icon size={20} strokeWidth={1.8} className="shrink-0 text-ok" aria-hidden />
            <span className="w-[6.4rem] shrink-0 leading-tight text-veda-bark">{label}</span>

            {progress !== undefined ? (
              <span className="flex flex-1 flex-col items-end gap-1">
                <span className="text-[0.8rem] text-veda-bark">{value}</span>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7DBC4]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
                  <span className="block h-full rounded-full bg-ok" style={{ width: `${progress}%` }} />
                </span>
              </span>
            ) : (
              <span className={`min-w-0 flex-1 text-right leading-tight font-semibold ${tone === 'ok' ? 'text-ok' : 'text-veda-bark'}`}>{value}</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}