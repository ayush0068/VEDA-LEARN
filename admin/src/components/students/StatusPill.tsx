import type { Student } from '@/types';

export type StudentStatus = 'active' | 'pending' | 'disabled';

export const statusOf = (s: Pick<Student, 'isActive' | 'mustChangePassword'>): StudentStatus => (!s.isActive ? 'disabled' : s.mustChangePassword ? 'pending' : 'active');

const STYLES: Record<StudentStatus, { label: string; box: string; dot: string }> = {
  active: { label: 'Active', box: 'bg-[#E4F4DC] text-ok', dot: 'bg-ok' },
  pending: { label: 'Password pending', box: 'bg-[#FDE6C8] text-[#C9701B]', dot: 'bg-[#F28C28]' },
  disabled: { label: 'Disabled', box: 'bg-[#EFE6DA] text-veda-muted', dot: 'bg-[#A8998A]' },
};

export default function StatusPill({ student }: { student: Pick<Student, 'isActive' | 'mustChangePassword'> }) {
  const style = STYLES[statusOf(student)];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[0.72rem] font-semibold ${style.box}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}