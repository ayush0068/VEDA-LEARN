// What an admin can give an instructor. Kept on the server so the admin panel always shows the same options.

/** each one is a yes/no switch the admin turns on for an instructor */
const PERMISSIONS = [
  { key: 'editCourses', label: 'Edit course content', description: 'Add and update lessons, notes and materials of their courses' },
  { key: 'hostLiveClasses', label: 'Host live classes', description: 'Start and run live sessions on their schedule' },
  { key: 'viewStudents', label: 'See enrolled students', description: 'View the learners and progress of their courses' },
  { key: 'gradeAssessments', label: 'Grade quizzes & assignments', description: 'Review submissions and give marks and feedback' },
  { key: 'issueCertificates', label: 'Issue certificates', description: 'Approve completion certificates for their students' },
  { key: 'moderateCommunity', label: 'Answer & moderate discussions', description: 'Reply to questions and manage the course community' },
];

const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

const preset = (...on) => Object.fromEntries(PERMISSION_KEYS.map((key) => [key, on.includes(key)]));

/** the role is a starting point: the admin can still switch single permissions on or off afterwards */
const ROLES = [
  {
    value: 'lead',
    label: 'Lead Instructor',
    description: 'Owns courses end to end, including certificates.',
    permissions: preset(...PERMISSION_KEYS),
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'Teaches, grades and supports students in assigned courses.',
    permissions: preset('editCourses', 'hostLiveClasses', 'viewStudents', 'gradeAssessments', 'moderateCommunity'),
  },
  {
    value: 'assistant',
    label: 'Teaching Assistant',
    description: 'Helps with doubts, grading and discussions.',
    permissions: preset('viewStudents', 'gradeAssessments', 'moderateCommunity'),
  },
  {
    value: 'guest',
    label: 'Guest Speaker',
    description: 'Only takes the live sessions the admin schedules.',
    permissions: preset('hostLiveClasses'),
  },
];

const ROLE_VALUES = ROLES.map((r) => r.value);

const SLOT_KINDS = [
  { value: 'live-class', label: 'Live class' },
  { value: 'office-hours', label: 'Doubt-clearing hours' },
  { value: 'mentoring', label: '1:1 mentoring' },
  { value: 'review', label: 'Assignment review' },
];

const SLOT_KIND_VALUES = SLOT_KINDS.map((k) => k.value);

const presetFor = (role) => ({ ...(ROLES.find((r) => r.value === role) || ROLES[1]).permissions });

module.exports = { PERMISSIONS, PERMISSION_KEYS, ROLES, ROLE_VALUES, SLOT_KINDS, SLOT_KIND_VALUES, presetFor };