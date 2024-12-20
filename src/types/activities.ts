export interface Step {
  id: string;
  title: string;
  completed: boolean;
  chapterId?: string;
  [key: string]: any;
}

export interface Chapter {
  steps: Step[];
}

export interface Phase {
  chapters?: Chapter[];
  steps?: Step[];
}

export interface ActivityData {
  step: Step;
  phase: Phase;
  pathId: string;
  pathData: any;
}
