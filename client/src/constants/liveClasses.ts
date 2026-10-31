// ---------------------------------------------------------------------------------------------
// Live Classes page data. Used directly by the page today; swap for an API call later.
// Images go in client/public/images/live-classes/<file>.png and client/public/images/teachers/<file>.png
// (a missing image falls back to a gradient / initials, so nothing breaks).
// `status` drives the tabs: upcoming -> "Upcoming Classes", ongoing -> "Ongoing Now",
// completed -> "Class Recordings". joinUrl / recordingUrl are placeholders: put the real links here.
// ---------------------------------------------------------------------------------------------

export type LiveStatus = 'upcoming' | 'ongoing' | 'completed';
export type LiveLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type LivePlatform = 'Zoom' | 'YouTube';

export interface LiveTeacher {
  id: string;
  name: string;
  role: string;
  years: string;
  bio: string;
  avatar: string;
  students: string;
  classes: string;
  rating: number;
}

export interface LiveClass {
  id: string;
  title: string;
  category: string; // slug from COURSE_TABS
  teacherId: string;
  level: LiveLevel;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm (IST)
  end: string; // HH:mm (IST)
  platform: LivePlatform;
  joinUrl: string;
  recordingUrl?: string;
  registered: number;
  status: LiveStatus;
  image: string;
  tags: string[];
  about: string;
  learn: string[];
}

export const LIVE_BANNER_SRC = '/images/live-classes-banner.png';

const IMG = '/images/live-classes';
const TEACHER_IMG = '/images/teachers';

export const LIVE_TEACHERS: LiveTeacher[] = [
  {
    id: 'devendra-shastri',
    name: 'Acharya Devendra Shastri',
    role: 'Vedic Philosophy Expert',
    years: '15+ Years of Experience',
    bio: 'Specializes in Vedic philosophy, meditation and spiritual practices. Has guided thousands of students on their journey of self-discovery.',
    avatar: `${TEACHER_IMG}/devendra-shastri.png`,
    students: '50K+',
    classes: '1,000+',
    rating: 4.9,
  },
  {
    id: 'meera-sharma',
    name: 'Dr. Meera Sharma',
    role: 'Vedic Astrology Scholar',
    years: '12+ Years of Experience',
    bio: 'Teaches Jyotish with a practical, chart-reading approach rooted in classical texts such as Brihat Parashara Hora Shastra.',
    avatar: `${TEACHER_IMG}/meera-sharma.png`,
    students: '32K+',
    classes: '700+',
    rating: 4.8,
  },
  {
    id: 'raghav-ji',
    name: 'Acharya Raghav Ji',
    role: 'Bhagavad Gita Scholar',
    years: '18+ Years of Experience',
    bio: 'A lifelong student of the Gita who brings its verses to life with simple explanations and everyday examples.',
    avatar: `${TEACHER_IMG}/raghav-ji.png`,
    students: '41K+',
    classes: '900+',
    rating: 4.9,
  },
  {
    id: 'kavita-devi',
    name: 'Smt. Kavita Devi',
    role: 'Mantra & Sound Healing Guide',
    years: '10+ Years of Experience',
    bio: 'Guides students through mantra chanting, nada yoga and sound practices for calm, focus and healing.',
    avatar: `${TEACHER_IMG}/kavita-devi.png`,
    students: '18K+',
    classes: '450+',
    rating: 4.8,
  },
  {
    id: 'nitin-sharma',
    name: 'Acharya Nitin Sharma',
    role: 'Vastu Shastra Consultant',
    years: '14+ Years of Experience',
    bio: 'Helps families and professionals apply Vastu principles to create balanced, harmonious homes and workplaces.',
    avatar: `${TEACHER_IMG}/nitin-sharma.png`,
    students: '22K+',
    classes: '520+',
    rating: 4.7,
  },
  {
    id: 'radhika-ji',
    name: 'Smt. Radhika Ji',
    role: 'Yoga & Wellness Teacher',
    years: '11+ Years of Experience',
    bio: 'Makes traditional yoga and pranayama simple and sustainable for busy modern routines.',
    avatar: `${TEACHER_IMG}/radhika-ji.png`,
    students: '27K+',
    classes: '640+',
    rating: 4.9,
  },
];

const ZOOM = 'https://zoom.us/join';
const YT = 'https://www.youtube.com/';

export const LIVE_CLASSES: LiveClass[] = [
  // ---- upcoming (the six cards of the design) ----
  {
    id: 'intro-meditation-breathwork',
    title: 'Introduction to Meditation & Breathwork',
    category: 'yoga-meditation',
    teacherId: 'devendra-shastri',
    level: 'Beginner',
    date: '2026-10-25',
    start: '18:00',
    end: '19:30',
    platform: 'Zoom',
    joinUrl: ZOOM,
    registered: 500,
    status: 'upcoming',
    image: `${IMG}/meditation.png`,
    tags: ['Meditation', 'Mindfulness', 'Wellbeing'],
    about:
      'In this live session, Acharya Devendra Shastri will guide you through the fundamentals of meditation and breathwork based on ancient Vedic wisdom. Learn practical techniques to calm the mind, reduce stress and bring more awareness into your daily life.',
    learn: [
      'Proper sitting posture and breathing techniques',
      'Different meditation methods from Vedic tradition',
      'How to deal with a distracted mind',
      'Practical tips for daily practice',
      'Live Q&A with the teacher',
    ],
  },
  {
    id: 'understanding-your-birth-chart',
    title: 'Understanding Your Birth Chart',
    category: 'vedic-astrology',
    teacherId: 'meera-sharma',
    level: 'Intermediate',
    date: '2026-10-27',
    start: '19:00',
    end: '20:30',
    platform: 'Zoom',
    joinUrl: ZOOM,
    registered: 320,
    status: 'upcoming',
    image: `${IMG}/birth-chart.png`,
    tags: ['Vedic Astrology', 'Jyotish', 'Kundli'],
    about:
      'Dr. Meera Sharma walks you through the structure of a Vedic birth chart: houses, planets and signs. You will learn how to read the key placements and what they say about personality, strengths and life themes.',
    learn: [
      'The 12 houses and what each one represents',
      'Reading planets, signs and nakshatras',
      'Identifying your ascendant and moon sign',
      'Common yogas and what they indicate',
      'Live chart reading Q&A',
    ],
  },
  {
    id: 'bhagavad-gita-discussion-series',
    title: 'Bhagavad Gita Discussion Series',
    category: 'bhagavad-gita',
    teacherId: 'raghav-ji',
    level: 'All Levels',
    date: '2026-10-29',
    start: '18:30',
    end: '20:00',
    platform: 'YouTube',
    joinUrl: YT,
    registered: 1200,
    status: 'upcoming',
    image: `${IMG}/bhagavad-gita.png`,
    tags: ['Bhagavad Gita', 'Philosophy', 'Discussion'],
    about:
      'An open discussion series on the timeless teachings of the Bhagavad Gita. Each session explores a theme, reads the key verses and connects them with the challenges of modern life.',
    learn: [
      'Meaning of key shlokas in simple language',
      'Karma, dharma and detached action',
      'Applying the Gita to work and relationships',
      'Discussion with fellow learners',
      'Live Q&A with the teacher',
    ],
  },
  {
    id: 'mantra-chanting-for-healing',
    title: 'Mantra Chanting for Healing',
    category: 'mantra-science-healing',
    teacherId: 'kavita-devi',
    level: 'Beginner',
    date: '2026-11-01',
    start: '18:00',
    end: '19:00',
    platform: 'Zoom',
    joinUrl: ZOOM,
    registered: 280,
    status: 'upcoming',
    image: `${IMG}/mantra-chanting.png`,
    tags: ['Mantra', 'Sound Healing', 'Wellbeing'],
    about:
      'Experience the calming power of mantra. Smt. Kavita Devi teaches correct pronunciation, rhythm and breath so you can chant with confidence and feel the effect on mind and body.',
    learn: [
      'Correct pronunciation of core mantras',
      'Using breath and rhythm while chanting',
      'Setting an intention for your practice',
      'A simple daily chanting routine',
      'Live Q&A with the teacher',
    ],
  },
  {
    id: 'vastu-for-a-harmonious-home',
    title: 'Vastu for a Harmonious Home',
    category: 'vastu-shastra',
    teacherId: 'nitin-sharma',
    level: 'Intermediate',
    date: '2026-11-03',
    start: '19:00',
    end: '20:30',
    platform: 'Zoom',
    joinUrl: ZOOM,
    registered: 410,
    status: 'upcoming',
    image: `${IMG}/vastu.png`,
    tags: ['Vastu Shastra', 'Home', 'Harmony'],
    about:
      'Learn how direction, space and the five elements shape the energy of your home. Acharya Nitin Sharma shares simple, practical Vastu corrections that need no major renovation.',
    learn: [
      'Directions and their ruling energies',
      'Ideal placement of rooms and key objects',
      'Simple, low-cost Vastu remedies',
      'Common Vastu mistakes to avoid',
      'Live Q&A with floor-plan questions',
    ],
  },
  {
    id: 'yoga-for-daily-life',
    title: 'Yoga for Daily Life',
    category: 'yoga-meditation',
    teacherId: 'radhika-ji',
    level: 'Beginner',
    date: '2026-11-05',
    start: '18:00',
    end: '19:15',
    platform: 'Zoom',
    joinUrl: ZOOM,
    registered: 360,
    status: 'upcoming',
    image: `${IMG}/yoga.png`,
    tags: ['Yoga', 'Pranayama', 'Wellbeing'],
    about:
      'A gentle, guided session to help you build a yoga routine you can actually keep. Smt. Radhika Ji combines easy asanas, pranayama and relaxation for energy and calm through the day.',
    learn: [
      'A 15-minute morning flow for beginners',
      'Pranayama to manage stress and fatigue',
      'Posture tips for desk-based work',
      'Relaxation for better sleep',
      'Live Q&A with the teacher',
    ],
  },

  // ---- ongoing now ----
  {
    id: 'sandhya-satsang-live',
    title: 'Evening Satsang & Bhajan Live',
    category: 'mantra-science-healing',
    teacherId: 'kavita-devi',
    level: 'All Levels',
    date: '2026-10-25',
    start: '16:30',
    end: '18:00',
    platform: 'YouTube',
    joinUrl: YT,
    registered: 860,
    status: 'ongoing',
    image: `${IMG}/mantra-chanting.png`,
    tags: ['Satsang', 'Bhajan', 'Mantra'],
    about:
      'A live evening satsang of bhajans, mantra and short reflections. Join in from anywhere and sing along in a peaceful, devotional space.',
    learn: ['Simple bhajans to sing along', 'Mantra repetition with the group', 'Short reflections on devotion', 'Live Q&A with the teacher'],
  },

  // ---- completed (class recordings) ----
  {
    id: 'pranayama-foundations',
    title: 'Pranayama Foundations',
    category: 'yoga-meditation',
    teacherId: 'radhika-ji',
    level: 'Beginner',
    date: '2026-10-01',
    start: '18:00',
    end: '19:00',
    platform: 'Zoom',
    joinUrl: ZOOM,
    recordingUrl: YT,
    registered: 640,
    status: 'completed',
    image: `${IMG}/yoga.png`,
    tags: ['Pranayama', 'Breathwork', 'Yoga'],
    about: 'A foundation session on the main pranayama techniques, with guided practice and safety tips for beginners.',
    learn: ['Nadi Shodhana step by step', 'Kapalabhati basics', 'Breath ratios and counting', 'When to avoid certain techniques'],
  },
  {
    id: 'navagraha-introduction',
    title: 'Navagraha: The Nine Planets',
    category: 'vedic-astrology',
    teacherId: 'meera-sharma',
    level: 'Beginner',
    date: '2026-10-02',
    start: '19:00',
    end: '20:15',
    platform: 'Zoom',
    joinUrl: ZOOM,
    recordingUrl: YT,
    registered: 540,
    status: 'completed',
    image: `${IMG}/birth-chart.png`,
    tags: ['Navagraha', 'Jyotish', 'Planets'],
    about: 'An introduction to the nine grahas, their natures, significations and how they influence the chart.',
    learn: ['Nature and significations of each graha', 'Friendly and enemy planets', 'Exaltation and debilitation', 'Basic remedies'],
  },
  {
    id: 'gita-chapter-two',
    title: 'Gita Chapter 2: Sankhya Yoga',
    category: 'bhagavad-gita',
    teacherId: 'raghav-ji',
    level: 'All Levels',
    date: '2026-10-03',
    start: '18:30',
    end: '20:00',
    platform: 'YouTube',
    joinUrl: YT,
    recordingUrl: YT,
    registered: 1500,
    status: 'completed',
    image: `${IMG}/bhagavad-gita.png`,
    tags: ['Bhagavad Gita', 'Chapter 2', 'Philosophy'],
    about: 'A deep dive into the second chapter of the Gita: the nature of the self, duty and steady wisdom.',
    learn: ['The eternal nature of the atman', 'Understanding svadharma', 'Qualities of a steady-minded person', 'Discussion and Q&A'],
  },
  {
    id: 'vastu-kitchen-pooja-room',
    title: 'Vastu for Kitchen & Pooja Room',
    category: 'vastu-shastra',
    teacherId: 'nitin-sharma',
    level: 'Intermediate',
    date: '2026-10-08',
    start: '19:00',
    end: '20:00',
    platform: 'Zoom',
    joinUrl: ZOOM,
    recordingUrl: YT,
    registered: 470,
    status: 'completed',
    image: `${IMG}/vastu.png`,
    tags: ['Vastu', 'Kitchen', 'Pooja Room'],
    about: 'How to place and set up the kitchen and pooja room according to Vastu, with easy fixes for existing homes.',
    learn: ['Best directions for kitchen and stove', 'Pooja room placement and idols', 'Colours and materials', 'Remedies for common doshas'],
  },
  {
    id: 'om-chanting-workshop',
    title: 'Om Chanting Workshop',
    category: 'mantra-science-healing',
    teacherId: 'kavita-devi',
    level: 'Beginner',
    date: '2026-10-09',
    start: '18:00',
    end: '19:00',
    platform: 'Zoom',
    joinUrl: ZOOM,
    recordingUrl: YT,
    registered: 390,
    status: 'completed',
    image: `${IMG}/mantra-chanting.png`,
    tags: ['Om', 'Chanting', 'Meditation'],
    about: 'A hands-on workshop on chanting Om: the sound, the breath and the stillness that follows.',
    learn: ['Pronouncing A-U-M correctly', 'Breath control while chanting', 'Chanting before meditation', 'Group practice'],
  },
];

export const LIVE_LEVEL_OPTIONS: LiveLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export interface TimeBucket {
  value: 'morning' | 'afternoon' | 'evening';
  label: string;
  /** start-time hour range [from, to) */
  from: number;
  to: number;
}

export const LIVE_TIME_OPTIONS: TimeBucket[] = [
  { value: 'morning', label: 'Morning (before 12 PM)', from: 0, to: 12 },
  { value: 'afternoon', label: 'Afternoon (12 – 5 PM)', from: 12, to: 17 },
  { value: 'evening', label: 'Evening (after 5 PM)', from: 17, to: 24 },
];

export const getLiveTeacher = (id: string): LiveTeacher => LIVE_TEACHERS.find((t) => t.id === id) ?? LIVE_TEACHERS[0];
export const getLiveClass = (id: string | undefined): LiveClass | undefined => LIVE_CLASSES.find((c) => c.id === id);