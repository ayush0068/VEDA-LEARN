interface Bar {
  key: string;
  label: string;
  value: number;
  /** full text for hover / screen readers */
  tip: string;
}

/** Simple responsive column chart (no chart library). The last bar is highlighted; labels show on every `labelEvery` bar. */
export default function BarChart({ data, labelEvery = 1, heightClass = 'h-36', emptyText = 'No activity yet' }: { data: Bar[]; labelEvery?: number; heightClass?: string; emptyText?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div className={`relative flex items-end gap-[3px] border-b border-line/80 ${heightClass}`} role="img" aria-label={data.map((d) => d.tip).join('; ')}>
        {total === 0 && <p className="absolute inset-0 flex items-center justify-center text-[0.8rem] text-veda-muted">{emptyText}</p>}
        {data.map((d, i) => (
          <div key={d.key} title={d.tip} className="group flex h-full min-w-0 flex-1 items-end">
            <div
              className={`w-full rounded-t-[4px] transition-colors ${i === data.length - 1 ? 'bg-saffron' : 'bg-[#E8B47A] group-hover:bg-saffron'}`}
              style={{ height: d.value ? `${Math.max(4, (d.value / max) * 100)}%` : '2px', opacity: d.value ? 1 : 0.35 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[3px] text-[0.64rem] text-veda-muted" aria-hidden>
        {data.map((d, i) => (
          <span key={d.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
            {i % labelEvery === 0 || i === data.length - 1 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}