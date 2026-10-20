import {
  Award,
  BookOpen,
  Flower2,
  Landmark,
  Leaf,
  Orbit,
  ScrollText,
  Sparkles,
  SquarePlay,
  Sprout,
  Users,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icon keys sent by the API -> lucide components. Add new keys here when the backend adds new icons.
export const ICON_MAP: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  'play-square': SquarePlay,
  users: Users,
  'users-round': UsersRound,
  leaf: Leaf,
  award: Award,
  orbit: Orbit,
  landmark: Landmark,
  'scroll-text': ScrollText,
  flower: Flower2,
  sprout: Sprout,
};

export const getIcon = (key: string): LucideIcon => ICON_MAP[key] ?? Sparkles;