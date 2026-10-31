// About page content + image paths. Images go in client/public/images/ (a missing image falls back to a warm gradient).
export const ABOUT_BANNER_SRC = '/images/about-banner.png'; // hero: temple, diya, manuscripts (art on the right)
export const ABOUT_QUOTE_SRC = '/images/about-quote.png'; // banyan tree + meditating figure (art on the left)
export const ABOUT_LANDSCAPE_SRC = '/images/about-landscape.png'; // soft hills + temple strip at the very bottom

export const ABOUT_PURPOSE = [
  {
    key: 'mission',
    title: 'Our Mission',
    text: 'To make authentic Vedic knowledge accessible to everyone through structured courses, live classes, and practical learning.',
  },
  {
    key: 'vision',
    title: 'Our Vision',
    text: "To build a global community of learners connected to India's eternal wisdom for a more balanced, mindful, and meaningful life.",
  },
] as const;

export const ABOUT_DIFFERENT = [
  { key: 'knowledge', title: 'Authentic Knowledge', text: 'Learn from trusted texts and expert teachers.' },
  { key: 'flexible', title: 'Flexible Learning', text: 'Online courses & live classes, at your own pace.' },
  { key: 'practical', title: 'Practical & Modern', text: "Apply ancient wisdom to today's life." },
  { key: 'community', title: 'Community Focused', text: 'A growing family of seekers and learners.' },
] as const;

export const ABOUT_VALUES = [
  { key: 'tradition', title: 'Tradition', text: 'Rooted in authentic Vedic teachings' },
  { key: 'integrity', title: 'Integrity', text: 'Truthful, unbiased and reliable content' },
  { key: 'service', title: 'Service', text: 'Spreading knowledge for the well-being of all' },
  { key: 'growth', title: 'Holistic Growth', text: 'For a healthier, happier and more conscious life' },
] as const;