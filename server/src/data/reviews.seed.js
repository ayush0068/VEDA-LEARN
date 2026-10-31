const { COURSE_SEEDS } = require('./courses.seed');

// SAMPLE REVIEWS (names are made up). Real students will be able to add reviews later.
// daysAgo -> the review date is calculated when the review is first inserted.
const GENERIC = [
  { name: 'Priya Sharma', rating: 5, daysAgo: 14, text: 'The explanations are very clear and easy to understand. This course gave me a strong foundation.' },
  { name: 'Rohit Verma', rating: 5, daysAgo: 30, text: 'Excellent course! Practical examples and real-life applications make it very valuable for beginners.' },
  { name: 'Ananya Singh', rating: 5, daysAgo: 35, text: 'The teacher explains complex concepts in a simple way. Highly recommended for anyone interested.' },
];

const BY_COURSE = {
  'vedic-astrology-for-beginners': [
    { name: 'Priya Sharma', rating: 5, daysAgo: 14, text: 'The explanations are very clear and easy to understand. This course gave me a strong foundation in Vedic Astrology.' },
    { name: 'Rohit Verma', rating: 5, daysAgo: 30, text: 'Excellent course! Practical examples and real-life applications make it very valuable for beginners.' },
    { name: 'Ananya Singh', rating: 5, daysAgo: 35, text: 'The teacher explains complex concepts in a simple way. Highly recommended for anyone interested in astrology.' },
    { name: 'Karan Mehta', rating: 4, daysAgo: 60, text: 'Very well structured. The birth chart module finally made everything click for me.' },
    { name: 'Sneha Iyer', rating: 5, daysAgo: 65, text: 'I loved the live doubt sessions. Every question was answered patiently.' },
    { name: 'Vikram Rao', rating: 5, daysAgo: 90, text: 'A perfect starting point. Now I can read basic charts for my family with confidence.' },
  ],
  'bhagavad-gita-in-depth-study': [
    { name: 'Priya Sharma', rating: 5, daysAgo: 14, text: 'The explanations are so clear and practical. This course has truly changed my perspective on life. Highly recommended!' },
    { name: 'Rahul Gupta', rating: 5, daysAgo: 30, text: 'Verse-by-verse study with real-life examples. I now read the Gita with so much more understanding.' },
    { name: 'Meena Pillai', rating: 5, daysAgo: 33, text: 'Calm, patient teaching. The daily practices have brought real peace into my routine.' },
    { name: 'Aditya Joshi', rating: 4, daysAgo: 60, text: 'Deep and well organised. The notes and PDFs are a great help for revision.' },
  ],
};

const REVIEW_SEEDS = COURSE_SEEDS.flatMap((course) => (BY_COURSE[course.slug] || GENERIC).map((review) => ({ courseSlug: course.slug, ...review })));

module.exports = { REVIEW_SEEDS };