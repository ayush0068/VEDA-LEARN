// SAMPLE DATA ONLY (ratings / student counts / prices are placeholders from the design).
// Replace with real values from the admin panel later.
const COURSE_SEEDS = [
  { slug: 'vedic-astrology-for-beginners', title: 'Vedic Astrology for Beginners', category: 'vedic-astrology', image: '/images/courses/vedic-astrology-for-beginners.jpg', icon: 'orbit', rating: 4.8, studentsCount: 1200, price: 2999, originalPrice: 4999, badge: 'Bestseller', isPopular: true, order: 1 },
  { slug: 'vastu-shastra-complete-course', title: 'Vastu Shastra Complete Course', category: 'vastu-shastra', image: '/images/courses/vastu-shastra-complete-course.jpg', icon: 'landmark', rating: 4.7, studentsCount: 980, price: 3499, originalPrice: 3999, badge: '', isPopular: true, order: 2 },
  { slug: 'bhagavad-gita-in-depth-study', title: 'Bhagavad Gita In-Depth Study', category: 'vedic-scriptures', image: '/images/courses/bhagavad-gita-in-depth-study.jpg', icon: 'book-open', rating: 4.9, studentsCount: 1500, price: 1999, originalPrice: 3999, badge: '', isPopular: true, order: 3 },
  { slug: 'mantra-science-and-healing', title: 'Mantra Science and Healing', category: 'spiritual-growth', image: '/images/courses/mantra-science-and-healing.jpg', icon: 'flower', rating: 4.8, studentsCount: 860, price: 2499, originalPrice: 4499, badge: '', isPopular: true, order: 4 },
];

module.exports = { COURSE_SEEDS };