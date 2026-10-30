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

export interface ApiItemResponse<T> {
  success: boolean;
  message?: string;
  data: T;
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
  instructor?: string; // teacher name (cart page)
  weeks?: number;
  lessons?: number;
  level?: string; // Beginner | Intermediate | Advanced | All Levels
  language?: string; // English | Hindi
  createdAt?: string; // ISO date, used by "Newest"
}

// Auth
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt?: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

// Cart
export interface CartSummary {
  itemCount: number;
  /** sum of the original (before-discount) prices */
  listTotal: number;
  courseDiscount: number;
  couponDiscount: number;
  total: number;
  savings: number;
  savingsPercent: number;
}

export interface CartCoupon {
  code: string;
  label: string;
  /** rupees taken off */
  amount: number;
}

/** Everything the cart page shows (GET /cart for signed-in users, POST /cart/preview for guests). */
export interface CartView {
  items: Course[];
  summary: CartSummary;
  coupon: CartCoupon | null;
  couponError?: string;
  recommended: Course[];
}

/** Light response of the cart mutation endpoints. */
export interface CartState {
  slugs: string[];
  count: number;
  couponCode: string | null;
}