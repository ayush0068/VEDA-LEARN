import { Bookmark, BookOpen, ClipboardList, FileText, LayoutDashboard, PlayCircle, Settings, StickyNote, UsersRound, Award, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------------------------
// Student Dashboard. Images are served from client/public/images/ (a missing file falls back to a
// warm gradient, so nothing breaks). Course / teacher / live-class pictures reuse the existing folders:
//   /images/courses/<slug>.png   /images/teachers/<id>.png   /images/live-classes/<file>.png
// ---------------------------------------------------------------------------------------------
export const DASH_AVATAR_SRC = '/images/dashboard/student-avatar.png'; // round photo next to "Welcome Back" (initials if missing)
export const DASH_HEADER_ART_SRC = '/images/dashboard/header-temple.png'; // temple skyline, top-right of the desktop welcome area
export const DASH_SIDEBAR_ART_SRC = '/images/dashboard/sidebar-art.png'; // student with laptop by the ghat, bottom of the sidebar
export const DASH_QUOTE_BANNER_SRC = '/images/dashboard/quote-banner.png'; // "A Step Towards Higher Knowledge" banner (mobile)

export interface DashNavItem {
  key: string;
  label: string;
  to: string;
  Icon: LucideIcon;
  end?: boolean;
}

export const DASH_SIDEBAR_ITEMS: DashNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard, end: true },
  { key: 'my-courses', label: 'My Courses', to: '/dashboard/my-courses', Icon: BookOpen },
  { key: 'live', label: 'Live Classes', to: '/live-classes', Icon: PlayCircle },
  { key: 'certificates', label: 'My Certificates', to: '/dashboard/certificates', Icon: Award },
  { key: 'bookmarks', label: 'Bookmarks', to: '/dashboard/bookmarks', Icon: Bookmark },
  { key: 'notes', label: 'Notes', to: '/dashboard/notes', Icon: StickyNote },
  { key: 'assignments', label: 'Assignments', to: '/dashboard/assignments', Icon: ClipboardList },
  { key: 'community', label: 'Community', to: '/community', Icon: UsersRound },
  { key: 'settings', label: 'Settings', to: '/dashboard/settings', Icon: Settings },
];

/** top links of the desktop header */
export const DASH_TOP_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Courses', to: '/courses' },
  { label: 'Live Classes', to: '/live-classes' },
  { label: 'Community', to: '/community' },
  { label: 'About', to: '/about' },
];

/** phone tab bar */
export const DASH_BOTTOM_ITEMS: DashNavItem[] = [
  { key: 'home', label: 'Home', to: '/', Icon: Home, end: true },
  { key: 'courses', label: 'Courses', to: '/courses', Icon: BookOpen },
  { key: 'live', label: 'Live Classes', to: '/live-classes', Icon: PlayCircle },
  { key: 'community', label: 'Community', to: '/community', Icon: UsersRound },
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', Icon: FileText, end: true },
];

export const DASH_SECTION_TITLES: Record<string, string> = {
  'my-courses': 'My Courses',
  certificates: 'My Certificates',
  bookmarks: 'Bookmarks',
  notes: 'Notes',
  assignments: 'Assignments',
  settings: 'Settings',
};

export const DASH_QUOTE_SANSKRIT = 'ज्ञानं परमं बलम्';
export const DASH_QUOTE_EN = 'Knowledge is the highest strength.';
export const DASH_SIDEBAR_QUOTE_SANSKRIT = 'विद्या ददाति विनयम्';
export const DASH_SIDEBAR_QUOTE_EN = 'True knowledge gives humility.';

export const DASH_PLATFORM_LABEL: Record<string, string> = { Zoom: 'Live on Zoom', YouTube: 'Live on YouTube' };