export type ContentStatus = 'draft' | 'published';
export type LessonType = 'video' | 'article' | 'document';

export interface LessonResource {
  title: string;
  url: string;
}

export interface CurriculumLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: LessonType;
  mediaUrl: string;
  content: string;
  durationMin: number;
  resources: LessonResource[];
  isPreview: boolean;
  order: number;
  status: ContentStatus;
  updatedAt?: string;
}

export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  weeks: number;
  order: number;
  status: ContentStatus;
  lessons: CurriculumLesson[];
}

export interface CurriculumCourseInfo {
  slug: string;
  title: string;
  image: string;
  category: string;
  instructor: string;
  isActive: boolean;
  lessonsOnSite: number;
  weeks: number;
}

export interface CurriculumStats {
  modules: number;
  lessons: number;
  published: number;
  drafts: number;
  previews: number;
  minutes: number;
}

export interface Curriculum {
  course: CurriculumCourseInfo;
  modules: CurriculumModule[];
  stats: CurriculumStats;
}

export interface CurriculumCourseRow extends CurriculumCourseInfo {
  modules: number;
  lessons: number;
  published: number;
  minutes: number;
}

export interface CurriculumCourseList {
  courses: CurriculumCourseRow[];
  stats: { courses: number; withContent: number; modules: number; lessons: number };
}

export interface ModuleInput {
  title: string;
  description: string;
  weeks: number;
  status: ContentStatus;
}

export interface LessonInput {
  title: string;
  description: string;
  type: LessonType;
  mediaUrl: string;
  content: string;
  durationMin: number;
  resources: LessonResource[];
  isPreview: boolean;
  status: ContentStatus;
}