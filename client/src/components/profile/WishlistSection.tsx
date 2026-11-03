import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseImage } from '@/components/dashboard/DashParts';
import { useCart } from '@/context/CartContext';
import { useSavedCourses } from '@/hooks/useSavedCourses';
import { getCourses } from '@/services/course.service';
import type { Course } from '@/types';
import { formatPrice } from '@/utils/format';
import { SectionCard } from './ProfileParts';

/** Courses bookmarked on the course cards. */
export default function WishlistSection() {
  const { saved, toggleSaved } = useSavedCourses();
  const cart = useCart();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCourses()
      .then((list) => active && setCourses(list))
      .catch(() => active && setError('Could not load your wishlist'));
    return () => {
      active = false;
    };
  }, []);

  const items = (courses ?? []).filter((c) => saved.includes(c.slug));

  return (
    <SectionCard Icon={Heart} title="Wishlist" subtitle="Courses you saved for later.">
      {error ? (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      ) : !courses ? (
        <div className="h-24 animate-pulse rounded-xl bg-gold-pale/50" aria-busy="true" />
      ) : items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="font-display text-[1.2rem] font-bold text-veda-bark">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-veda-muted">Tap the bookmark on a course to save it here.</p>
          <Link to="/courses" className="btn-primary mt-4 px-6">
            Explore courses
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <li key={c.slug} className="flex gap-3 rounded-xl border border-gold/25 bg-white/50 p-3">
              <Link to={`/courses/${c.slug}`} className="block h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                <CourseImage src={c.image} category={c.category} className="h-full w-full" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/courses/${c.slug}`} className="line-clamp-2 text-[0.92rem] font-semibold leading-snug text-veda-bark hover:text-saffron">
                  {c.title}
                </Link>
                <p className="mt-0.5 text-[0.85rem] text-veda-text">{formatPrice(c.price)}</p>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => cart.add(c.slug)}
                    disabled={cart.has(c.slug)}
                    className="btn-primary gap-1.5 px-3 py-1.5 text-[0.78rem] disabled:opacity-60"
                  >
                    <ShoppingCart size={14} aria-hidden /> {cart.has(c.slug) ? 'In cart' : 'Add to cart'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSaved(c.slug)}
                    aria-label={`Remove ${c.title} from wishlist`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-veda-muted hover:bg-gold-pale/60 hover:text-veda-bark"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}