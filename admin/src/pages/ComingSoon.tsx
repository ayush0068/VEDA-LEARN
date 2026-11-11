import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { TempleSilhouette } from '@/components/common/Art';
import { Card } from '@/components/common/Card';
import { titleForPath } from '@/constants/navigation';

/** Placeholder for every screen that is not built yet (the sidebar links already point here). */
export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = titleForPath(pathname);

  return (
    <Card className="relative mx-auto mt-4 flex max-w-2xl flex-col items-center overflow-hidden px-6 py-14 text-center">
      <TempleSilhouette className="pointer-events-none absolute -bottom-3 left-1/2 h-40 w-64 -translate-x-1/2 text-[#C98A4A]/25" />
      <p className="relative text-[0.72rem] font-bold uppercase tracking-[0.18em] text-saffron">Coming soon</p>
      <h1 className="relative mt-2 font-display text-3xl font-bold text-veda-bark">{title}</h1>
      <p className="relative mt-2 max-w-md text-sm text-veda-muted">This section of the admin panel is being built. The dashboard is ready; this screen will follow.</p>
      <Link to="/" className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-veda-brown px-5 py-2.5 text-sm font-semibold text-ivory shadow-card transition hover:bg-veda-bark">
        <ArrowLeft size={16} aria-hidden /> Back to Dashboard
      </Link>
    </Card>
  );
}