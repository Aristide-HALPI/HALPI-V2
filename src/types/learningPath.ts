export interface Step {
  id: string;
  title: string;
  completed: boolean;
  chapterId?: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  steps: Step[];
}

export interface Phase {
  id: string;
  title: string;
  description: string;
  chapters?: Chapter[];
  steps?: Step[];
}

export interface LearningPath {
  id: string;
  courseId: string;
  userId: string;
  phases: Phase[];
  createdAt: string;
  updatedAt: string;
}