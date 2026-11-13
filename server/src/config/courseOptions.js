// Choices offered by the admin "Courses" form. Category slugs match the chips on the website's Explore Courses page
// (client/src/constants/courseCatalog.ts) - add a chip there too if you add a category here.
const COURSE_CATEGORIES = [
  { value: 'sanatan-lifestyle', label: 'Sanatan Lifestyle' },
  { value: 'vedic-astrology', label: 'Vedic Astrology' },
  { value: 'vastu-shastra', label: 'Vastu Shastra' },
  { value: 'bhagavad-gita', label: 'Bhagavad Gita' },
  { value: 'mantra-science-healing', label: 'Mantra Science & Healing' },
  { value: 'yoga-meditation', label: 'Yoga & Meditation' },
  { value: 'ancient-texts', label: 'Ancient Texts' },
  { value: 'lifestyle-wellbeing', label: 'Lifestyle & Wellbeing' },
];

const COURSE_LANGUAGES = ['English', 'Hindi'];
// Badges the website card already has a colour for (any other text also works)
const COURSE_BADGES = ['Bestseller', 'Popular', 'New'];

// Checkmarks of the "About This Course" section on the course page
const HIGHLIGHT_LABELS = {
  steps: 'Step-by-Step Learning',
  examples: 'Real-Life Examples',
  assignments: 'Practical Assignments',
  doubts: 'Doubt Solving Sessions',
  community: 'Supportive Community',
  verses: 'Verse-by-Verse Study',
  practice: 'Guided Practice',
  notes: 'Downloadable Notes',
};

module.exports = { COURSE_CATEGORIES, COURSE_LANGUAGES, COURSE_BADGES, HIGHLIGHT_LABELS };