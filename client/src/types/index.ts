export interface HealthResponse {
  success: boolean;
  status: string;
  service: string;
  environment: string;
  uptime: number;
  timestamp: string;
  database: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'unknown';
}

export interface NavItem {
  label: string;
  to: string;
}

export interface Feature {
  key: string;
  title: string;
  description: string;
  icon: string;
  order?: number;
}

export interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  order?: number;
}

export interface Course {
  slug: string;
  title: string;
  category: string;
  image: string;
  icon: string;
  rating: number;
  studentsCount: number;
  price: number;
  originalPrice?: number;
  badge?: string;
  order?: number;
  // Courses page (all optional, so older API responses still work)
  description?: string;
  weeks?: number;
  lessons?: number;
  level?: string; // Beginner | Intermediate | Advanced | All Levels
  language?: string; // English | Hindi
  createdAt?: string; // ISO date, used by "Newest"
}