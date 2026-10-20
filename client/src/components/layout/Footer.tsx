import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LotusMark } from '@/components/common/Logo';
import Mandala from '@/components/common/Mandala';
import FooterColumn from '@/components/footer/FooterColumn';
import NewsletterForm from '@/components/footer/NewsletterForm';
import { SOCIAL_ICONS } from '@/components/footer/SocialIcons';
import { FOOTER_HELP_LINKS, FOOTER_QUICK_LINKS, SITE, SOCIAL_LINKS } from '@/constants/site';
import { useCategories } from '@/hooks/useCategories';

const linkClass = 'text-[0.85rem] text-ivory/70 transition-colors hover:text-gold-soft';

export default function Footer() {
  const { categories } = useCategories();

  return (
    <footer className="relative isolate overflow-hidden bg-veda-bark text-ivory" aria-label="Site footer">
      <Mandala className="pointer-events-none absolute -bottom-24 -right-20 -z-10 hidden h-[26rem] w-[26rem] text-gold/10 md:block" />

      <div className="mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 md:pb-6 md:pt-14 lg:px-8">
        <div className="grid gap-y-5 md:grid-cols-6 md:gap-x-8 md:gap-y-10 lg:grid-cols-12 lg:gap-x-6">
          {/* Brand */}
          <div className="md:col-span-6 lg:col-span-3">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
              <LotusMark className="h-10 w-10 shrink-0" />
              <span className="leading-none">
                <span className="block font-display text-2xl font-semibold text-ivory">{SITE.name}</span>
                <span className="mt-1 block text-[0.62rem] tracking-wide text-ivory/60">{SITE.tagline}</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-[0.8rem] md:mt-4 md:text-[0.85rem] leading-relaxed text-ivory/70">{SITE.description}</p>

            <ul className="mt-4 flex gap-2.5 md:mt-5">
              {SOCIAL_LINKS.map(({ name, href }) => {
                const Icon = SOCIAL_ICONS[name];
                return (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/25 text-ivory/80 transition-colors hover:border-gold hover:bg-gold hover:text-veda-bark"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <FooterColumn title="Quick Links">
              <ul className="space-y-2.5">
                {FOOTER_QUICK_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterColumn>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <FooterColumn title="Course Categories">
              <ul className="space-y-2.5">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link to={`/courses?category=${encodeURIComponent(category.slug)}`} className={linkClass}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterColumn>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <FooterColumn title="Help">
              <ul className="space-y-2.5">
                {FOOTER_HELP_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterColumn>
          </div>

          {/* Newsletter */}
          <div className="pt-1 md:col-span-6 md:pt-0 lg:col-span-3">
            <h3 className="text-sm font-semibold text-ivory">Stay Updated</h3>
            <p className="mb-3 mt-1.5 text-[0.85rem] text-ivory/70">Get the latest courses and updates.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-1 border-t border-ivory/10 pt-4 md:mt-8 md:pt-5 text-center text-xs text-ivory/55 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            Designed with <Heart size={13} className="fill-[#D9455F] text-[#D9455F]" aria-label="love" /> for Vedic
            Wisdom
          </p>
        </div>
      </div>
    </footer>
  );
}