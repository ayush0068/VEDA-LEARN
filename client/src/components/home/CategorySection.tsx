import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionMandalas from '@/components/common/SectionMandalas';
import { LotusMark } from '@/components/common/Logo';
import { useCategories } from '@/hooks/useCategories';
import CategoryCard from './CategoryCard';

export default function CategorySection() {
  const { categories } = useCategories();

  return (
    <section className="relative overflow-hidden bg-cream/60 py-14 sm:py-20" aria-labelledby="categories-heading">
      <SectionMandalas sides="right" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-saffron">EXPLORE OUR</p>
            <h2 id="categories-heading" className="mt-1 font-display text-3xl font-semibold text-veda-bark sm:text-4xl">
              Course Categories
            </h2>
            <div className="mt-3 flex items-center gap-2" aria-hidden>
              <LotusMark className="h-4 w-4" />
              <span className="h-px w-16 bg-gradient-to-r from-gold/60 to-transparent" />
            </div>
          </div>


            <Link
            to="/courses"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-veda-brown/20 px-3.5 py-1.5 text-sm font-medium text-veda-brown transition-all duration-200 hover:border-saffron/50 hover:bg-saffron/10 hover:text-saffron"
            >
            View All <span className="hidden sm:inline">Categories</span>
            <ArrowRight
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
            />
            </Link>
        </div>

        {/* mobile: swipeable row, tablet: 3 columns, desktop: 5 columns */}
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
          {categories.map((category, index) => (
            <li key={category.slug} className="w-[68%] shrink-0 snap-start sm:w-auto">
              <CategoryCard category={category} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}