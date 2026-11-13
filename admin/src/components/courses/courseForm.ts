import type { CoursePayload } from '@/services/courses.service';
import type { AdminCourse, CourseContent } from '@/types/course';

/** The course form keeps every number / list as plain text while it is being typed. */
export interface ContentForm {
  tagline: string;
  about: string;
  tags: string; // one per line
  highlights: string[];
  learn: string; // one per line
  audience: string; // one per line
  curriculum: { title: string; lessons: string; weeks: string; topics: string }[];
  faqs: { q: string; a: string }[];
  instructor: { title: string; experience: string; bio: string; coursesConducted: string; students: string; rating: string };
  ratingCount: string;
  bannerTitle: string;
}

export interface CourseForm {
  title: string;
  slug: string;
  category: string;
  instructor: string;
  description: string;
  badge: string;
  level: string;
  language: string;
  weeks: string;
  lessons: string;
  originalPrice: string;
  discount: string; // % - derived from the two prices, editable
  price: string;
  rating: string;
  studentsCount: string;
  order: string;
  isPopular: boolean;
  isActive: boolean;
  image: string;
  previewVideo: string;
  syllabus: string;
  content: ContentForm;
}

const lines = (text: string): string[] => text.split('\n').map((l) => l.trim()).filter(Boolean);
const text = (n: number | null | undefined): string => (n === null || n === undefined || n === 0 ? '' : String(n));
const orNull = (s: string): number | null => (s.trim() === '' ? null : Number(s));

/** 1499 of 2499 -> "40" ; '' when there is no original price */
export const discountOf = (price: string, original: string): string => {
  const p = Number(price);
  const o = Number(original);
  if (!original.trim() || !price.trim() || !(o > 0) || !(p >= 0) || p >= o) return '';
  return String(Math.round((1 - p / o) * 100));
};

/** original 2499, 40% off -> "1499" */
export const priceFromDiscount = (original: string, discount: string): string => {
  const o = Number(original);
  const d = Number(discount);
  if (!(o > 0) || !(d >= 0) || d > 100) return '';
  return String(Math.round(o * (1 - d / 100)));
};

export const emptyContent = (): ContentForm => ({
  tagline: '',
  about: '',
  tags: '',
  highlights: [],
  learn: '',
  audience: '',
  curriculum: [],
  faqs: [],
  instructor: { title: '', experience: '', bio: '', coursesConducted: '', students: '', rating: '' },
  ratingCount: '',
  bannerTitle: '',
});

export const emptyForm = (): CourseForm => ({
  title: '',
  slug: '',
  category: '',
  instructor: '',
  description: '',
  badge: '',
  level: 'All Levels',
  language: 'English',
  weeks: '',
  lessons: '',
  originalPrice: '',
  discount: '',
  price: '',
  rating: '',
  studentsCount: '',
  order: '',
  isPopular: false,
  isActive: true,
  image: '',
  previewVideo: '',
  syllabus: '',
  content: emptyContent(),
});

export const toForm = (c: AdminCourse, content: CourseContent): CourseForm => {
  const price = String(c.price);
  const originalPrice = text(c.originalPrice);
  return {
    title: c.title,
    slug: c.slug,
    category: c.category,
    instructor: c.instructor,
    description: c.description,
    badge: c.badge,
    level: c.level,
    language: c.language,
    weeks: text(c.weeks),
    lessons: text(c.lessons),
    originalPrice,
    discount: discountOf(price, originalPrice),
    price,
    rating: text(c.rating),
    studentsCount: text(c.studentsCount),
    order: String(c.order),
    isPopular: c.isPopular,
    isActive: c.isActive,
    image: c.image,
    previewVideo: c.previewVideo,
    syllabus: c.syllabus,
    content: {
      tagline: content.tagline,
      about: content.about,
      tags: content.tags.join('\n'),
      highlights: content.highlights,
      learn: content.learn.join('\n'),
      audience: content.audience.join('\n'),
      curriculum: content.curriculum.map((m) => ({ title: m.title, lessons: text(m.lessons), weeks: text(m.weeks), topics: m.topics.join('\n') })),
      faqs: content.faqs,
      instructor: {
        title: content.instructor.title,
        experience: content.instructor.experience,
        bio: content.instructor.bio,
        coursesConducted: text(content.instructor.coursesConducted),
        students: text(content.instructor.students),
        rating: text(content.instructor.rating),
      },
      ratingCount: text(content.ratingCount),
      bannerTitle: content.bannerTitle,
    },
  };
};

const isNumber = (s: string) => s.trim() === '' || Number.isFinite(Number(s));

/** First problem found, or '' when the form can be saved. (The server checks everything again.) */
export const validate = (f: CourseForm): { tab: 'basic' | 'price' | 'page'; message: string } | null => {
  if (f.title.trim().length < 3) return { tab: 'basic', message: 'Please enter the course name (at least 3 characters).' };
  if (!f.category) return { tab: 'basic', message: 'Please choose a category.' };
  if (f.price.trim() === '' || !(Number(f.price) >= 0)) return { tab: 'price', message: 'Please enter the selling price (use 0 for a free course).' };
  if (f.originalPrice.trim() !== '' && Number(f.originalPrice) < Number(f.price)) return { tab: 'price', message: 'Original price must be higher than the selling price (or leave it empty).' };
  if (![f.weeks, f.lessons, f.rating, f.studentsCount, f.order, f.originalPrice].every(isNumber)) return { tab: 'price', message: 'Please use numbers only in the number fields.' };
  if (f.rating.trim() !== '' && (Number(f.rating) < 0 || Number(f.rating) > 5)) return { tab: 'price', message: 'Rating must be between 0 and 5.' };

  const { curriculum, faqs } = f.content;
  const badModule = curriculum.findIndex((m) => m.title.trim() === '' && (m.topics.trim() || m.lessons.trim() || m.weeks.trim()));
  if (badModule >= 0) return { tab: 'page', message: `Curriculum module ${badModule + 1} needs a title.` };
  const badFaq = faqs.findIndex((x) => Boolean(x.q.trim()) !== Boolean(x.a.trim()));
  if (badFaq >= 0) return { tab: 'page', message: `FAQ ${badFaq + 1} needs both a question and an answer.` };
  return null;
};

export const toPayload = (f: CourseForm, { create }: { create: boolean }): CoursePayload => {
  const c = f.content;
  const payload: CoursePayload = {
    title: f.title.trim().replace(/\s+/g, ' '),
    category: f.category,
    instructor: f.instructor.trim(),
    description: f.description.trim(),
    badge: f.badge.trim(),
    level: f.level,
    language: f.language,
    weeks: orNull(f.weeks),
    lessons: orNull(f.lessons),
    price: Number(f.price),
    originalPrice: orNull(f.originalPrice),
    rating: Number(f.rating || 0),
    studentsCount: Number(f.studentsCount || 0),
    isPopular: f.isPopular,
    isActive: f.isActive,
    image: f.image.trim(),
    previewVideo: f.previewVideo.trim(),
    syllabus: f.syllabus.trim(),
    content: {
      tagline: c.tagline.trim(),
      about: c.about.trim(),
      tags: lines(c.tags),
      highlights: c.highlights,
      learn: lines(c.learn),
      audience: lines(c.audience),
      curriculum: c.curriculum
        .filter((m) => m.title.trim())
        .map((m) => ({ title: m.title.trim(), lessons: Number(m.lessons || 0), weeks: Number(m.weeks || 1), topics: lines(m.topics) })),
      faqs: c.faqs.filter((x) => x.q.trim() && x.a.trim()).map((x) => ({ q: x.q.trim(), a: x.a.trim() })),
      instructor: {
        title: c.instructor.title.trim(),
        experience: c.instructor.experience.trim(),
        bio: c.instructor.bio.trim(),
        coursesConducted: Number(c.instructor.coursesConducted || 0),
        students: Number(c.instructor.students || 0),
        rating: Number(c.instructor.rating || 0),
      },
      ratingCount: Number(c.ratingCount || 0),
      bannerTitle: c.bannerTitle.trim(),
    },
  };

  if (f.order.trim() !== '') payload.order = Number(f.order);
  if (create && f.slug.trim()) payload.slug = f.slug.trim().toLowerCase();
  return payload;
};