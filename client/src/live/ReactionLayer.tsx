import type { FloatingReaction } from './useLiveRoom';

export const EMOJIS = ['👏', '🙏', '❤️', '👍', '😊', '🔥'];

/** emoji that float up over the video */
export default function ReactionLayer({ items }: { items: FloatingReaction[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((r) => (
        <span key={r.id} className="absolute bottom-6 flex flex-col items-center" style={{ left: `${r.left}%`, animation: 'live-float 3.1s ease-out forwards' }}>
          <span className="text-[2rem] drop-shadow-lg">{r.emoji}</span>
          <span className="mt-0.5 max-w-24 truncate rounded-full bg-black/50 px-2 text-[0.62rem] text-white">{r.name}</span>
        </span>
      ))}
    </div>
  );
}