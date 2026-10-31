import { BookOpen, ChartNoAxesCombined, ClipboardList, FileText, Leaf, MessagesSquare, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Highlight, HighlightKey } from '@/constants/courseDetails';

const ICONS: Record<HighlightKey, LucideIcon> = {
  steps: BookOpen,
  verses: BookOpen,
  examples: ChartNoAxesCombined,
  assignments: ClipboardList,
  practice: Leaf,
  doubts: MessagesSquare,
  notes: FileText,
  community: UsersRound,
};

/** Small icon tiles under "About This Course". */
export default function Highlights({ items }: { items: Highlight[] }) {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gold/20 bg-gold/20 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ key, label }) => {
        const Icon = ICONS[key];
        return (
          <li key={label} className="flex flex-col items-center gap-2.5 bg-cream px-3 py-5 text-center">
            <Icon size={28} strokeWidth={1.3} className="text-saffron" aria-hidden />
            <span className="text-[0.8rem] leading-snug text-veda-text">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}