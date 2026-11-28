/** none = hidden, view = read, edit = view + create / change, full = edit + delete */
export type AccessLevel = 'none' | 'view' | 'edit' | 'full';
export type ModuleKey = 'students' | 'instructors' | 'courses' | 'curriculum' | 'assessments' | 'liveClasses';
export type Permissions = Record<ModuleKey, AccessLevel>;

/** what the signed-in admin may do (sent with /auth/me) */
export interface AdminAccess {
  isSuper: boolean;
  title: string;
  permissions: Permissions;
}

export interface ModuleInfo {
  key: ModuleKey;
  label: string;
  group: string;
  description: string;
}

export interface PresetInfo {
  value: string;
  label: string;
  description: string;
  permissions: Permissions;
}

export interface TeamOptions {
  modules: ModuleInfo[];
  levels: { value: AccessLevel; label: string }[];
  presets: PresetInfo[];
  maxAdmins: number;
  emailConfigured: boolean;
}

export type MemberStatus = 'active' | 'pending' | 'suspended';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isSuper: boolean;
  title: string;
  preset: string;
  status: MemberStatus;
  isActive: boolean;
  mustChangePassword: boolean;
  permissions: Permissions;
  modulesCount: number;
  createdAt: string;
  createdByName: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  online: boolean;
  actions7d: number;
  activeMin7d: number;
}

export interface DayPoint {
  date: string;
  actions: number;
  activeMin: number;
}

export type Outcome = 'success' | 'denied' | 'failed';

export interface ActivityItem {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  type: 'auth' | 'change';
  action: string;
  module: string;
  summary: string;
  outcome: Outcome;
  status: number;
  method: string;
  path: string;
  targetLabel: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface TeamOverview {
  stats: { total: number; active: number; pending: number; suspended: number; online: number; actionsToday: number; actions7d: number; denied7d: number };
  online: { id: string; name: string }[];
  days: (DayPoint & { admins: number })[];
  top: { id: string; name: string; actions: number }[];
  attention: ActivityItem[];
}

export interface MemberDetails {
  admin: Member;
  stats: {
    actions30d: number;
    actionsAllTime: number;
    denied30d: number;
    failed30d: number;
    logins30d: number;
    failedLogins30d: number;
    activeDays30d: number;
    activeMin30d: number;
  };
  days: (DayPoint & { requests: number })[];
  hours: { hour: number; count: number }[];
  modules: { module: string; count: number }[];
  topActions: { action: string; count: number }[];
}

export interface ActivityFilters {
  admin?: string;
  module?: string;
  outcome?: Outcome | '';
  type?: 'auth' | 'change' | '';
  q?: string;
  from?: string;
  to?: string;
}

export interface ActivityList {
  items: ActivityItem[];
  pagination: { page: number; pages: number; total: number; limit: number };
}

export interface MemberCredentials {
  admin: Member;
  temporaryPassword: string;
}

export interface MemberInput {
  name: string;
  email: string;
  phone: string;
  title: string;
  preset: string;
  permissions: Permissions;
}