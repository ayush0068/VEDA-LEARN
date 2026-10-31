// Contact page content + image paths. Images go in client/public/images/ (a missing image falls back to a warm gradient).
export const CONTACT_BANNER_SRC = '/images/contact-banner.png'; // hero: diya, quill and old books (art on the right)
export const CONTACT_LANDSCAPE_SRC = '/images/contact-landscape.png'; // soft hills, trees + temple strip at the very bottom

export const CONTACT_INFO = {
  phone: { label: '+91 98765 43210', href: 'tel:+919876543210', hours: 'Mon – Sat, 10 AM – 7 PM' },
  email: { label: 'support@vedalearn.com', href: 'mailto:support@vedalearn.com' },
  location: { lines: ['Prayagraj, Uttar Pradesh,', 'India'] },
} as const;

export const QUERY_TYPES = [
  'Course Enquiry',
  'Live Classes',
  'Payments & Refunds',
  'Technical Support',
  'Become a Teacher',
  'Other',
] as const;

export type QueryType = (typeof QUERY_TYPES)[number];

export const CONTACT_PROMISES = [
  { key: 'response', title: 'Quick Response', text: 'We usually reply within 24 hours.' },
  { key: 'privacy', title: 'Your Privacy Matters', text: 'Your information is always safe with us.' },
  { key: 'support', title: 'Student Support', text: 'Guidance at every step of your learning journey.' },
] as const;

export const MESSAGE_MAX = 2000;