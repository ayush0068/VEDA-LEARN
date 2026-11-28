// What the super admin can give to an admin. Kept on the server so the panel always shows the same options.
//
// Every admin-panel module has one level of access:
//   none  -> the module is hidden and its API refuses every call
//   view  -> can open and read it (GET)
//   edit  -> view + create / change things (POST, PATCH, PUT)
//   full  -> edit + delete things (DELETE)

const LEVELS = ['none', 'view', 'edit', 'full'];
const RANK = Object.fromEntries(LEVELS.map((level, i) => [level, i]));

/** add one line here when a new admin screen gets built (and guard its routes with requirePermission) */
const MODULES = [
  { key: 'students', label: 'Students', group: 'User Management', description: 'Student accounts, passwords, enrolments and payment history' },
  { key: 'instructors', label: 'Instructors', group: 'User Management', description: 'Instructor accounts, their access, courses and weekly schedule' },
  { key: 'courses', label: 'Courses', group: 'Course Management', description: 'Create and edit courses, prices, free / paid, images and videos' },
  { key: 'curriculum', label: 'Modules & Lessons', group: 'Course Management', description: 'Build the modules and lessons of a course' },
  { key: 'assessments', label: 'Quizzes & Assignments', group: 'Course Management', description: 'Build quizzes, set assignments, see results and grade student work' },
  { key: 'liveClasses', label: 'Live Classes', group: 'Live Classes', description: 'Schedule, host and record live classes' },
];

const MODULE_KEYS = MODULES.map((m) => m.key);

const LEVEL_INFO = [
  { value: 'none', label: 'No access' },
  { value: 'view', label: 'View only' },
  { value: 'edit', label: 'View & edit' },
  { value: 'full', label: 'Full (can delete)' },
];

const emptyPermissions = () => Object.fromEntries(MODULE_KEYS.map((key) => [key, 'none']));

const grant = (map) => ({ ...emptyPermissions(), ...map });
const all = (level) => Object.fromEntries(MODULE_KEYS.map((key) => [key, level]));

/** starting points: the super admin can still change every single module afterwards */
const PRESETS = [
  { value: 'content', label: 'Content Manager', description: 'Builds courses, modules and lessons.', permissions: grant({ courses: 'full', curriculum: 'full', assessments: 'full', instructors: 'view' }) },
  { value: 'live', label: 'Live Class Manager', description: 'Schedules and runs live classes.', permissions: grant({ liveClasses: 'full', courses: 'view', instructors: 'view' }) },
  { value: 'support', label: 'Student Support', description: 'Helps students with accounts and passwords.', permissions: grant({ students: 'edit', courses: 'view' }) },
  { value: 'people', label: 'People Manager', description: 'Manages students and instructors.', permissions: grant({ students: 'full', instructors: 'full', liveClasses: 'view' }) },
  { value: 'viewer', label: 'Viewer / Auditor', description: 'Can look at everything, change nothing.', permissions: all('view') },
  { value: 'custom', label: 'Custom', description: 'Start empty and pick the modules yourself.', permissions: emptyPermissions() },
];

const PRESET_VALUES = PRESETS.map((p) => p.value);

const isLevel = (value) => typeof value === 'string' && LEVELS.includes(value);

/** the level an HTTP method needs */
const levelForMethod = (method) => {
  const m = String(method || 'GET').toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return 'view';
  if (m === 'DELETE') return 'full';
  return 'edit';
};

/** { students: 'view', ... } with every module present and only valid levels */
const normalizePermissions = (raw) => {
  const out = emptyPermissions();
  if (raw && typeof raw === 'object') {
    MODULE_KEYS.forEach((key) => {
      if (isLevel(raw[key])) out[key] = raw[key];
    });
  }
  return out;
};

/** the level this user has in a module. Super admins have everything. */
const levelOf = (user, moduleKey) => {
  if (!user || user.role !== 'admin') return 'none';
  if (user.isSuperAdmin) return 'full';
  const level = user.adminAccess && user.adminAccess.permissions && user.adminAccess.permissions[moduleKey];
  return isLevel(level) ? level : 'none';
};

const can = (user, moduleKey, needed = 'view') => RANK[levelOf(user, moduleKey)] >= RANK[needed];

/** what the panel needs to know about the signed-in admin (sidebar, buttons...) */
const accessOf = (user) => ({
  isSuper: Boolean(user.isSuperAdmin),
  title: user.isSuperAdmin ? 'Super Admin' : (user.adminAccess && user.adminAccess.title) || 'Admin',
  permissions: user.isSuperAdmin ? all('full') : normalizePermissions(user.adminAccess && user.adminAccess.permissions),
});

const presetFor = (value) => ({ ...(PRESETS.find((p) => p.value === value) || PRESETS[PRESETS.length - 1]).permissions });

module.exports = { LEVELS, RANK, LEVEL_INFO, MODULES, MODULE_KEYS, PRESETS, PRESET_VALUES, levelForMethod, normalizePermissions, levelOf, can, accessOf, presetFor, emptyPermissions };