import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Mandala from '@/components/common/Mandala';
import { getIcon } from '@/constants/icons';
import type { Category } from '@/types';

// Used behind the icon when a category image is missing / fails to load
const FALLBACK_BG = [
  'from-veda-bark to-veda-brown',
  'from-gold-soft to-saffron',
  'from-veda-brown to-saffron',
  'from-saffron to-gold',
  'from-gold to-veda-brown',
];

/** "/images/x.jpg" <-> "/images/x.png": the database and the files in /public can disagree on the extension. */
const otherExtension = (src: string): string => src.replace(/\.(jpe?g|png)$/i, (_, ext: string) => (ext.toLowerCase() === 'png' ? '.jpg' : '.png'));

interface CategoryCardProps {
  category: Category;
  index: number;
}

export default function CategoryCard({ category, index }: CategoryCardProps) {
  // 0 = image as given, 1 = same file with the other extension, 2 = give up -> icon fallback
  const [attempt, setAttempt] = useState(0);
  const Icon = getIcon(category.icon);

  useEffect(() => setAttempt(0), [category.image]);

  const src = attempt === 0 ? category.image : otherExtension(category.image);
  const showImage = Boolean(category.image) && attempt < 2;

  return (
    <Link
      to={`/courses?category=${encodeURIComponent(category.slug)}`}
      className="group flex h-full flex-col rounded-xl border border-gold/20 bg-ivory p-2 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold/50"
      aria-label={`${category.name}: ${category.description}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
        {showImage ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setAttempt((a) => a + 1)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${FALLBACK_BG[index % FALLBACK_BG.length]}`}
          >
            <Mandala className="absolute inset-0 m-auto h-[130%] w-[130%] text-ivory/20" />
            <Icon size={44} strokeWidth={1.3} className="relative text-ivory" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 items-end justify-between gap-2 px-2 pb-2 pt-3">
        <div>
          <h3 className="text-[0.95rem] font-semibold text-veda-bark">{category.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-veda-muted">{category.description}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/50 text-saffron transition-colors group-hover:bg-veda-brown group-hover:text-ivory">
          <ArrowRight size={15} aria-hidden />
        </span>
      </div>
    </Link>
  );
}