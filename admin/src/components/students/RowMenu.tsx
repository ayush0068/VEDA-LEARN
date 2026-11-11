import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

const MENU_WIDTH = 208;

/** "..." button with a small action menu. The menu is fixed-positioned so the table's scroll area never clips it. */
export default function RowMenu({ items, label }: { items: MenuItem[]; label: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => setPos(null);

  const toggle = () => {
    if (pos) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const height = items.length * 40 + 12;
    const openUp = rect.bottom + height > window.innerHeight - 8 && rect.top > height;
    setPos({
      top: openUp ? rect.top - height - 4 : rect.bottom + 4,
      left: Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8),
    });
  };

  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setPos(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null);
    const onMove = () => setPos(null);

    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={Boolean(pos)}
        aria-label={`Actions for ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-veda-muted transition hover:bg-peach hover:text-veda-bark"
      >
        <Ellipsis size={18} />
      </button>

      {pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          className="fixed z-[60] animate-pop-in rounded-xl border border-line bg-ivory p-1.5 shadow-xl shadow-veda-brown/20"
        >
          {items.map(({ label: text, icon: Icon, onClick, danger }) => (
            <button
              key={text}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onClick();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[0.85rem] transition hover:bg-cream ${danger ? 'text-red-700' : 'text-veda-bark'}`}
            >
              <Icon size={16} className={danger ? 'text-red-600' : 'text-veda-muted'} aria-hidden />
              {text}
            </button>
          ))}
        </div>
      )}
    </>
  );
}