export type AssessStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'single' | 'multiple' | 'truefalse' | 'short';
export type ShowAnswers = 'after_submit' | 'after_pass' | 'never';
export type SubmissionType = 'text' | 'file' | 'link';

export interface CourseOption {
  slug: string;
  title: string;
}

export interface Overview {
  quizzes: { total: number; published: number; draft: number; archived: number };
  assignments: { total: number; published: number; draft: number; archived: number };
  attempts: { total: number; avgPercent: number; passRate: number };
  needsGrading: number;
  recentSubmissions: { id: string; assignmentId: string; assignmentTitle: string; student: string; submittedAt: string; late: boolean }[];
}

export interface QuizRow {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  status: AssessStatus;
  questionCount: number;
  totalPoints: number;
  timeLimitMin: number;
  passPercent: number;
  maxAttempts: number;
  attempts: number;
  students: number;
  avgPercent: number;
  passRate: number;
  updatedAt: string;
}

export interface OptionDraft {
  id?: string;
  text: string;
  correct: boolean;
}

export interface QuestionDraft {
  /** local key for React lists (never sent) */
  key: string;
  id?: string;
  type: QuestionType;
  text: string;
  image: string;
  points: number;
  explanation: string;
  options: OptionDraft[];
  acceptedAnswers: string[];
}

export interface QuizFull {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  status: AssessStatus;
  timeLimitMin: number;
  passPercent: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswers: ShowAnswers;
  availableFrom: string | null;
  availableUntil: string | null;
  questions: Omit<QuestionDraft, 'key'>[];
  questionCount: number;
  totalPoints: number;
}

export interface QuizInput {
  courseSlug: string;
  title: string;
  description: string;
  status: AssessStatus;
  timeLimitMin: number;
  passPercent: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswers: ShowAnswers;
  availableFrom: string | null;
  availableUntil: string | null;
  questions: Omit<QuestionDraft, 'key'>[];
}

export interface AttemptRow {
  id: string;
  student: string;
  email: string;
  attemptNo: number;
  percent: number;
  score: number;
  total: number;
  passed: boolean;
  timeTakenSec: number;
  submittedAt: string;
}

export interface QuizAnalytics {
  quiz: { id: string; title: string; courseTitle: string; passPercent: number; questionCount: number };
  summary: { attempts: number; students: number; avgPercent: number; passRate: number; highest: number; lowest: number; avgTimeSec: number };
  distribution: { from: number; to: number; count: number }[];
  questions: { id: string; number: number; text: string; type: QuestionType; answered: number; skipped: number; correct: number; correctRate: number; options: { id: string; text: string; correct: boolean; picked: number }[] }[];
  leaderboard: AttemptRow[];
  recent: AttemptRow[];
}

export interface Resource {
  title: string;
  url: string;
}

export interface AssignmentRow {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  status: AssessStatus;
  dueAt: string | null;
  maxPoints: number;
  allowLate: boolean;
  submissionTypes: SubmissionType[];
  maxFiles: number;
  resources: Resource[];
  submitted: number;
  pending: number;
  graded: number;
  avgGrade: number;
  updatedAt: string;
}

export type AssignmentFull = Omit<AssignmentRow, 'submitted' | 'pending' | 'graded' | 'avgGrade'>;

export interface AssignmentInput {
  courseSlug: string;
  title: string;
  description: string;
  status: AssessStatus;
  dueAt: string | null;
  maxPoints: number;
  allowLate: boolean;
  submissionTypes: SubmissionType[];
  maxFiles: number;
  resources: Resource[];
}

export interface SubmissionRow {
  id: string;
  assignmentId: string;
  studentId: string;
  student: string;
  email: string;
  text: string;
  link: string;
  files: { name: string; url: string; size: number; type: string }[];
  status: 'submitted' | 'graded' | 'returned';
  late: boolean;
  version: number;
  submittedAt: string;
  grade: number | null;
  feedback: string;
  gradedAt: string | null;
}

export interface SubmissionList {
  assignment: AssignmentFull;
  summary: { enrolled: number; submitted: number; pending: number; graded: number; late: number; avgGrade: number };
  submissions: SubmissionRow[];
  notSubmitted: { studentId: string; student: string; email: string }[];
}