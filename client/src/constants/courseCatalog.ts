import type { Course } from '@/types';

// ---------------------------------------------------------------------------------------------
// Courses page data. Shown instantly and used as a fallback when the API / database is unavailable.
// Course images go in client/public/images/courses/<file>.png
// ---------------------------------------------------------------------------------------------

export interface CourseTab {
  slug: string; // 'all' = no filter
  label: string;
}

// Category chips under the banner (order = display order)
export const COURSE_TABS: CourseTab[] = [
  { slug: 'all', label: 'All Courses' },
  { slug: 'sanatan-lifestyle', label: 'Sanatan Lifestyle' },
  { slug: 'vedic-astrology', label: 'Vedic Astrology' },
  { slug: 'vastu-shastra', label: 'Vastu Shastra' },
  { slug: 'bhagavad-gita', label: 'Bhagavad Gita' },
  { slug: 'mantra-science-healing', label: 'Mantra Science & Healing' },
  { slug: 'yoga-meditation', label: 'Yoga & Meditation' },
  { slug: 'ancient-texts', label: 'Ancient Texts' },
  { slug: 'lifestyle-wellbeing', label: 'Lifestyle & Wellbeing' },
];

// Category links used elsewhere on the site (home page cards) -> chip on this page
export const CATEGORY_ALIASES: Record<string, string> = {
  'vedic-scriptures': 'ancient-texts',
  'spiritual-growth': 'mantra-science-healing',
};

export interface Option {
  value: string;
  label: string;
}

export const LEVEL_OPTIONS: Option[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'All Levels', label: 'All Levels' },
];

export const DURATION_OPTIONS: Option[] = [
  { value: 'short', label: 'Up to 8 weeks' },
  { value: 'medium', label: '9 – 12 weeks' },
  { value: 'long', label: '13+ weeks' },
];

export const PRICE_OPTIONS: Option[] = [
  { value: 'low', label: 'Under ₹1,500' },
  { value: 'mid', label: '₹1,500 – ₹2,500' },
  { value: 'high', label: 'Above ₹2,500' },
];

export const LANGUAGE_OPTIONS: Option[] = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
];

export const SORT_OPTIONS: Option[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export const CATALOG_PAGE_SIZE = 8;

export const DEFAULT_CATALOG: Course[] = [
  {
    slug: 'sanatan-lifestyle', title: 'Sanatan Lifestyle', category: 'sanatan-lifestyle',
    image: '/images/courses/sanatan-lifestyle.png', icon: 'sprout',
    description: 'Live a balanced and meaningful life with Vedic wisdom.',
    weeks: 8, lessons: 24, level: 'Beginner', language: 'English',
    rating: 4.9, studentsCount: 1200, price: 1499, originalPrice: 2499, badge: 'Bestseller', order: 1,
  },
  {
    slug: 'vedic-astrology-for-beginners', title: 'Vedic Astrology for Beginners', category: 'vedic-astrology',
    image: '/images/courses/vedic-astrology-for-beginners.png', icon: 'orbit',
    description: "Understand your life's blueprint with ancient Jyotish wisdom.",
    weeks: 10, lessons: 32, level: 'Beginner', language: 'English',
    rating: 4.8, studentsCount: 980, price: 1999, originalPrice: 3499, badge: 'Popular', order: 2,
  },
  {
    slug: 'vastu-shastra-complete-course', title: 'Vastu Shastra Complete Course', category: 'vastu-shastra',
    image: '/images/courses/vastu-shastra-complete-course.png', icon: 'landmark',
    description: 'Create harmony, prosperity and positive energy in your space.',
    weeks: 12, lessons: 36, level: 'All Levels', language: 'English',
    rating: 4.9, studentsCount: 850, price: 2499, originalPrice: 3999, badge: 'New', order: 3,
  },
  {
    slug: 'bhagavad-gita-in-depth-study', title: 'Bhagavad Gita – In-Depth Study', category: 'bhagavad-gita',
    image: '/images/courses/bhagavad-gita-in-depth-study.png', icon: 'book-open',
    description: 'Dive deep into the timeless wisdom of the Gita.',
    weeks: 16, lessons: 48, level: 'Intermediate', language: 'Hindi',
    rating: 4.9, studentsCount: 1500, price: 2999, originalPrice: 4999, order: 4,
  },
  {
    slug: 'mantra-science-and-healing', title: 'Mantra Science & Healing', category: 'mantra-science-healing',
    image: '/images/courses/mantra-science-and-healing.png', icon: 'flower',
    description: 'Experience the power of sacred sounds for health and well-being.',
    weeks: 8, lessons: 28, level: 'Beginner', language: 'Hindi',
    rating: 4.8, studentsCount: 760, price: 1999, originalPrice: 3499, order: 5,
  },
  {
    slug: 'yoga-and-meditation', title: 'Yoga & Meditation', category: 'yoga-meditation',
    image: '/images/courses/yoga-and-meditation.png', icon: 'flower',
    description: 'Build a calm mind, healthy body and higher awareness.',
    weeks: 10, lessons: 30, level: 'Beginner', language: 'English',
    rating: 4.8, studentsCount: 920, price: 1499, originalPrice: 2499, order: 6,
  },
  {
    slug: 'ancient-scriptures', title: 'Ancient Scriptures', category: 'ancient-texts',
    image: '/images/courses/ancient-scriptures.png', icon: 'scroll-text',
    description: 'Explore the wisdom of Vedas, Upanishads and more.',
    weeks: 12, lessons: 40, level: 'All Levels', language: 'Hindi',
    rating: 4.8, studentsCount: 640, price: 2499, originalPrice: 3999, order: 7,
  },
  {
    slug: 'ayurveda-and-natural-healing', title: 'Ayurveda & Natural Healing', category: 'lifestyle-wellbeing',
    image: '/images/courses/ayurveda-and-natural-healing.png', icon: 'leaf',
    description: 'Learn ancient Ayurvedic knowledge for modern life.',
    weeks: 8, lessons: 26, level: 'Beginner', language: 'English',
    rating: 4.7, studentsCount: 530, price: 1799, originalPrice: 2999, order: 8,
  },
];