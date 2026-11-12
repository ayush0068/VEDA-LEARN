import type { InstructorRole } from '@/types/instructor';
import { ROLE_LABEL, ROLE_STYLE } from '@/utils/schedule';

export default function RoleBadge({ role }: { role: InstructorRole }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-[0.72rem] font-semibold ${ROLE_STYLE[role]}`}>{ROLE_LABEL[role]}</span>;
}