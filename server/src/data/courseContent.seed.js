const { COURSE_SEEDS } = require('./courses.seed');

// SAMPLE CONTENT for the Course Details page. Replace / edit it from the admin panel later.
// Every course gets generated content; the courses in OVERRIDES get hand-written content.

const CATEGORY_LABELS = {
  'sanatan-lifestyle': 'Sanatan Lifestyle',
  'vedic-astrology': 'Vedic Astrology',
  'vastu-shastra': 'Vastu Shastra',
  'bhagavad-gita': 'Bhagavad Gita',
  'mantra-science-healing': 'Mantra Science & Healing',
  'yoga-meditation': 'Yoga & Meditation',
  'ancient-texts': 'Ancient Texts',
  'lifestyle-wellbeing': 'Lifestyle & Wellbeing',
};

const DEFAULT_HIGHLIGHTS = [
  { key: 'steps', label: 'Step-by-Step Learning' },
  { key: 'examples', label: 'Real-Life Examples' },
  { key: 'assignments', label: 'Practical Assignments' },
  { key: 'doubts', label: 'Doubt Solving Sessions' },
  { key: 'community', label: 'Supportive Community' },
];

const GENERIC_MODULE_TITLES = [
  'Introduction and Foundations',
  'Core Concepts Explained',
  'Going Deeper',
  'Practical Applications',
  'Guided Practice and Case Studies',
  'Advanced Insights and Next Steps',
];

const GENERIC_FAQS = [
  { q: 'Do I need any prior knowledge?', a: 'No special background is needed for beginner courses. Each lesson builds on the previous one, and you can ask your teacher anything in the live doubt-solving sessions.' },
  { q: 'How long do I have access to the course?', a: 'You get lifetime access to all recorded lessons and study material, so you can learn at your own pace and revisit anytime.' },
  { q: 'Will I get a certificate?', a: 'Yes. You receive a certificate of completion once you finish all the lessons.' },
  { q: 'Can I attend live sessions?', a: 'Yes, live Q&A and doubt-solving sessions are included. Recordings are available if you miss one.' },
  { q: 'Is there a refund policy?', a: 'Yes, we offer a 30-day money-back guarantee. Please see our Refund Policy for details.' },
];

/** 32 split in 6 -> [6, 6, 5, 5, 5, 5] */
const distribute = (total, parts) => Array.from({ length: parts }, (_, i) => Math.floor(total / parts) + (i < total % parts ? 1 : 0));

const buildCurriculum = (lessons, weeks) => {
  const count = Math.max(1, Math.min(6, weeks, lessons));
  const lessonSplit = distribute(lessons, count);
  const weekSplit = distribute(weeks, count);
  return GENERIC_MODULE_TITLES.slice(0, count).map((title, i) => ({ title, lessons: lessonSplit[i], weeks: Math.max(1, weekSplit[i]), topics: [] }));
};

const generic = (course) => {
  const topic = CATEGORY_LABELS[course.category] || 'Vedic Learning';
  return {
    slug: course.slug,
    tagline: course.description || `Learn ${course.title} with authentic Vedic wisdom.`,
    about: `${course.title} is a guided course from VedaLearn's experienced teachers. ${course.description} You will learn step by step through recorded lessons, live doubt-solving sessions and practical exercises, so you can apply the knowledge in your everyday life.`,
    tags: [topic, course.level, `${course.weeks} Weeks`, 'Live Classes', 'Certificate'],
    highlights: DEFAULT_HIGHLIGHTS,
    learn: [
      `The foundations and key ideas of ${course.title}`,
      'Authentic concepts explained in simple language',
      'Step-by-step practical exercises you can follow at home',
      'How to apply the teachings in daily life',
      'Common questions answered by your teacher',
      'Guided practices, notes and revision material',
      'Confidence to continue with advanced study',
      'A certificate to mark your learning journey',
    ],
    audience: [
      `Anyone who wants to learn ${topic} the authentic way`,
      'Spiritual seekers and self-learners',
      'Students who want a strong base to build on',
      'Busy people who prefer learning at their own pace',
    ],
    curriculum: buildCurriculum(course.lessons, course.weeks),
    instructor: {
      title: `${topic} Expert`,
      experience: '15+ Years of Experience',
      bio: '{name} has been teaching for over 15 years, helping thousands of students understand and apply this timeless knowledge in everyday life.',
      coursesConducted: 50,
      students: 10000,
      rating: course.rating,
    },
    ratingCount: Math.max(20, Math.round(course.studentsCount * 0.8)),
    faqs: GENERIC_FAQS,
    bannerTitle: 'Transform Your Life with Ancient Wisdom',
  };
};

const OVERRIDES = {
  'vedic-astrology-for-beginners': {
    tagline: "Understand Your Life's Blueprint with Ancient Jyotish Wisdom",
    about:
      'This Vedic Astrology for Beginners course is designed to give you a strong foundation in Jyotish Shastra. You will learn the core concepts, planetary influences, houses, signs, and how to read a birth chart with practical examples. The course is structured in a simple and easy-to-follow way, making it perfect for beginners who want to explore the depth of Vedic Astrology.',
    tags: ['Vedic Astrology', 'Birth Chart', 'Planets & Houses', 'Remedies', 'Practical Learning'],
    learn: [
      'Basics of Vedic Astrology and its history',
      'Planets, signs, houses and their significations',
      'How to read and understand a birth chart',
      'Dashas and timing of events (introduction)',
      'Remedies and practical applications',
      'Insight into career, relationships and health',
      'Use of astrology for self-growth',
      'Build a strong foundation for advanced learning',
    ],
    curriculum: [
      { title: 'Introduction to Vedic Astrology', lessons: 5, weeks: 1, topics: ['What is Jyotish Shastra?', 'History and the Vedic roots of astrology', 'Vedic vs Western astrology', 'How to use this course'] },
      { title: 'Planets and Their Influence', lessons: 6, weeks: 2, topics: ['The nine Grahas', 'Natural benefics and malefics', 'Friendship, exaltation and debilitation', 'Planetary significations'] },
      { title: 'Zodiac Signs (Rashis)', lessons: 5, weeks: 1, topics: ['The twelve Rashis', 'Elements, qualities and rulers', 'Nature of each sign', 'Moon sign and Lagna'] },
      { title: 'Houses (Bhavas) in Astrology', lessons: 5, weeks: 2, topics: ['The twelve Bhavas', 'Kendra, Trikona and Dusthana', 'House lords and their results', 'Key life areas by house'] },
      { title: 'Reading a Birth Chart', lessons: 6, weeks: 2, topics: ['Anatomy of a Kundli', 'Step-by-step chart reading', 'Planetary aspects and conjunctions', 'Introduction to Dashas'] },
      { title: 'Remedies and Practical Applications', lessons: 5, weeks: 2, topics: ['Mantra, charity and gemstone basics', 'Choosing the right remedy', 'Case studies and practice charts', 'Ethical astrology'] },
    ],
    audience: [
      'Beginners interested in Vedic Astrology',
      'Spiritual seekers and self-learners',
      'Students of astrology wanting a strong base',
      "Anyone curious about understanding life's patterns",
    ],
    instructor: {
      title: 'Vedic Astrology Expert',
      experience: '15+ Years of Experience',
      bio: '{name} has been teaching Vedic Astrology for over 15 years, helping thousands of students understand the profound wisdom of Jyotish Shastra.',
      coursesConducted: 50,
      students: 10000,
      rating: 4.8,
    },
    ratingCount: 980,
    bannerTitle: "Read Your Life's Blueprint",
  },

  'bhagavad-gita-in-depth-study': {
    tagline: 'Dive deep into the timeless wisdom of the Gita for a purposeful life.',
    about:
      'This course takes you on a deep and practical exploration of the Bhagavad Gita. You will understand its teachings, real-life applications and how to bring its wisdom into your daily life with clarity and confidence.',
    tags: ['Bhagavad Gita', 'Karma Yoga', 'Bhakti Yoga', 'Jnana Yoga', 'Daily Practice'],
    highlights: [
      { key: 'verses', label: 'Verse-by-Verse Explanation' },
      { key: 'examples', label: 'Real-Life Applications' },
      { key: 'practice', label: 'Guided Practices' },
      { key: 'doubts', label: 'Doubt Solving Sessions' },
      { key: 'notes', label: 'Study Notes & PDFs' },
      { key: 'community', label: 'Supportive Community' },
    ],
    learn: [
      'The setting, characters and message of the Gita',
      'Verse-by-verse meaning of the key chapters',
      'Karma Yoga: acting without attachment to results',
      'Bhakti Yoga and Jnana Yoga explained simply',
      'Handling stress, doubt and difficult decisions',
      'Daily practices to bring the Gita into life',
      'Connecting the Gita with other Vedic texts',
      'A calm, clear and purposeful outlook on life',
    ],
    curriculum: [
      { title: 'Introduction to Bhagavad Gita', lessons: 4, weeks: 1, topics: ['The Mahabharata background', "Arjuna's dilemma", 'How to study the Gita', 'Sanskrit pronunciation basics'] },
      { title: 'Historical and Cultural Context', lessons: 6, weeks: 2, topics: ['Kurukshetra and its meaning', 'Dharma in ancient society', 'The Gita in Indian philosophy', 'Major commentaries'] },
      { title: 'Core Teachings (Chapters 1-6)', lessons: 12, weeks: 3, topics: ['Sankhya Yoga', 'Karma Yoga', 'The nature of the self', 'Meditation and self-control'] },
      { title: 'Karma, Bhakti and Jnana Yoga', lessons: 10, weeks: 3, topics: ['The path of devotion', 'The path of knowledge', 'Balancing the three paths', 'Qualities of a steady mind'] },
      { title: 'Practical Life Applications', lessons: 10, weeks: 4, topics: ['Work, duty and stress', 'Relationships and ego', 'Decision making with clarity', 'Daily sadhana plan'] },
      { title: 'Advanced Insights and Conclusion', lessons: 6, weeks: 3, topics: ['Chapters 13-18 overview', 'The divine and demoniac natures', 'Surrender and freedom', 'Where to go next'] },
    ],
    audience: [
      'Seekers who want a deeper understanding of the Gita',
      'Professionals looking for calm and clarity',
      'Students of Vedic philosophy',
      'Anyone who wants practical wisdom for daily life',
    ],
    instructor: {
      title: 'Vedic Philosophy Expert',
      experience: '15+ Years of Experience',
      bio: '{name} has been teaching the Bhagavad Gita for over 15 years, helping thousands of students understand and apply its wisdom in daily life.',
      coursesConducted: 1000,
      students: 50000,
      rating: 4.9,
    },
    ratingCount: 1500,
    bannerTitle: "Transform Your Life with Gita's Wisdom",
  },
};

const COURSE_CONTENT_SEEDS = COURSE_SEEDS.map((course) => ({ ...generic(course), ...(OVERRIDES[course.slug] || {}) }));

module.exports = { COURSE_CONTENT_SEEDS };