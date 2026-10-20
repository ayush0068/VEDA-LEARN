import type { Course } from '@/types';

// Sample data. Shown instantly and used as a fallback when the API / database is unavailable.
// Images go in client/public/images/courses/<slug>.jpg
export const DEFAULT_COURSES: Course[] = [
  { slug: 'vedic-astrology-for-beginners', title: 'Vedic Astrology for Beginners', category: 'vedic-astrology', image: '/images/courses/vedic-astrology-for-beginners.png', icon: 'orbit', rating: 4.8, studentsCount: 1200, price: 2999, originalPrice: 4999, badge: 'Bestseller', order: 1 },
  { slug: 'vastu-shastra-complete-course', title: 'Vastu Shastra Complete Course', category: 'vastu-shastra', image: '/images/courses/vastu-shastra-complete-course.png', icon: 'landmark', rating: 4.7, studentsCount: 980, price: 3499, originalPrice: 3999, order: 2 },
  { slug: 'bhagavad-gita-in-depth-study', title: 'Bhagavad Gita In-Depth Study', category: 'vedic-scriptures', image: '/images/courses/bhagavad-gita-in-depth-study.png', icon: 'book-open', rating: 4.9, studentsCount: 1500, price: 1999, originalPrice: 3999, order: 3 },
  { slug: 'mantra-science-and-healing', title: 'Mantra Science and Healing', category: 'spiritual-growth', image: '/images/courses/mantra-science-and-healing.png', icon: 'flower', rating: 4.8, studentsCount: 860, price: 2499, originalPrice: 4499, order: 4 },
];