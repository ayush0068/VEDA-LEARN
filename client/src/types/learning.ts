export type LessonKind = 'video' | 'article' | 'document';

export interface OutlineLesson {
  id: string;
  title: string;
  type: LessonKind;
  durationMin: number;
  isPreview: boolean;
  completed: boolean;
}

export interface OutlineModule {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: OutlineLesson[];
}

export interface LearningProgress {
  completed: number;
  total: number;
  percent: number;
}

export interface CourseLearning {
  course: { slug: string; title: string; image: string; category: string; instructor: string };
  enrolled: boolean;
  hasCurriculum: boolean;
  progress: LearningProgress;
  resumeLessonId: string | null;
  modules: OutlineModule[];
}

export interface LessonDetail {
  course: { slug: string; title: string };
  module: { id: string; number: number; title: string };
  lesson: {
    id: string;
    title: string;
    description: string;
    type: LessonKind;
    mediaUrl: string;
    content: string;
    durationMin: number;
    resources: { title: string; url: string }[];
    isPreview: boolean;
    completed: boolean;
  };
  prevId: string | null;
  nextId: string | null;
  position: { index: number; total: number };
  /** false for free-preview visitors and admins: they can watch but their progress is not saved */
  canTrack: boolean;
}

export interface CompleteResult {
  completed: boolean;
  progress: LearningProgress;
  nextLessonId: string | null;
  courseCompleted: boolean;
}