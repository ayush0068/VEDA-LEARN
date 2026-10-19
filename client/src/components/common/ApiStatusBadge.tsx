import { useHealth } from '@/hooks/useHealth';

/** Dev-only indicator proving the client <-> API connection. Hidden in production builds. */
export default function ApiStatusBadge() {
  const { data, error, loading } = useHealth();

  const ok = Boolean(data?.status === 'ok');
  const label = loading
    ? 'Checking API…'
    : ok
      ? `API online · DB ${data?.database}`
      : `API offline · ${error ?? 'unknown error'}`;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full border border-gold/40 bg-ivory/95 px-3 py-1.5 text-xs text-veda-text shadow-soft"
    >
      <span
        className={`h-2 w-2 rounded-full ${loading ? 'bg-gold animate-pulse' : ok ? 'bg-emerald-600' : 'bg-red-600'}`}
        aria-hidden
      />
      {label}
    </div>
  );
}
