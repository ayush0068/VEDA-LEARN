export type QuizState = 'new' | 'in_progress' | 'passed' | 'failed';
export type QuestionType = 'single' | 'multiple' | 'truefalse' | 'short';

export interface QuizCard {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  questionCount: number;
  totalPoints: number;
  timeLimitMin: number;
  passPercent: number;
  maxAttempts: number;
  availableFrom: string | null;
  availableUntil: string | null;
  status: QuizState;
  window: 'open' | 'upcoming' | 'closed';
  attemptsUsed: number;
  attemptsLeft: number | null;
  bestPercent: number | null;
  inProgressId: string | null;
  canStart: boolean;
}

export type AssignmentState = 'todo' | 'overdue' | 'closed' | 'submitted' | 'graded' | 'returned';

export interface AssignmentCard {
  id: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  dueAt: string | null;
  maxPoints: number;
  allowLate: boolean;
  state: AssignmentState;
  grade: number | null;
  submittedAt: string | null;
  late: boolean;
}

export interface Hub {
  quizzes: QuizCard[];
  assignments: AssignmentCard[];
  stats: { quizzesTaken: number; quizzesPassed: number; avgQuizPercent: number; assignmentsDone: number; assignmentsPending: number; avgAssignmentPercent: number };
}

export interface AttemptSummary {
  id: string;
  attemptNo: number;
  status: string;
  percent: number;
  score: number;
  total: number;
  passed: boolean;
  timeTakenSec: number;
  submittedAt: string;
  timedOut: boolean;
}

export interface QuizIntro {
  quiz: QuizCard & { instructions: string };
  attempts: AttemptSummary[];
}

export interface RunQuestion {
  id: string;
  type: QuestionType;
  text: string;
  image: string;
  points: number;
  multiple: boolean;
  options: { id: string; text: string }[];
}

export interface SavedAnswer {
  question: string;
  selected: string[];
  text: string;
}

export interface RunPayload {
  attempt: { id: string; attemptNo: number; startedAt: string; expiresAt: string | null; serverNow: string };
  quiz: { id: string; title: string; courseTitle: string; timeLimitMin: number; passPercent: number };
  questions: RunQuestion[];
  saved: SavedAnswer[];
}

export interface ReviewQuestion extends RunQuestion {
  number: number;
  answered: boolean;
  yourSelected: string[];
  yourText: string;
  correct: boolean;
  earned: number;
  correctOptionIds?: string[];
  acceptedAnswers?: string[];
  explanation?: string;
}

export interface Review {
  attempt: AttemptSummary & { startedAt: string };
  quiz: { id: string; title: string; courseSlug: string; courseTitle: string; passPercent: number; maxAttempts: number; showAnswers: string };
  revealed: boolean;
  counts: { correct: number; wrong: number; skipped: number; total: number };
  questions: ReviewQuestion[];
}

export type AttemptView = ({ inProgress: true } & RunPayload) | ({ inProgress: false } & Review);

export interface MySubmission {
  id: string;
  text: string;
  link: string;
  files: UploadedFile[];
  status: 'submitted' | 'graded' | 'returned';
  late: boolean;
  version: number;
  submittedAt: string;
  grade: number | null;
  feedback: string;
  gradedAt: string | null;
}

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface AssignmentDetail {
  assignment: AssignmentCard & {
    description: string;
    submissionTypes: ('text' | 'file' | 'link')[];
    maxFiles: number;
    resources: { title: string; url: string }[];
    canSubmit: boolean;
  };
  submission: MySubmission | null;
}