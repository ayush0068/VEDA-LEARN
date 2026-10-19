import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-display text-4xl font-semibold text-veda-bark">{title}</h1>
      <p className="mt-3 text-veda-muted">This page is coming in a later milestone.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </section>
  );
}
