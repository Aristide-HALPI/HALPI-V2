// Types partagés entre les différentes activités
export interface Step {
  id: string;
  title: string;
  completed: boolean;
  chapterId?: string;
}

export interface Chapter {
  steps: Step[];
}

export interface ActivityPhase {
  chapters?: Chapter[];
  steps?: Step[];
}

// Type pour les phases spécifiques à KeyConcepts2Activity
export type KeyConceptsPhase = 'identification' | 'explanation';

// Type générique pour les données d'activité
export interface BaseActivityData {
  step: Step;
  pathId: string;
  pathData: any;
}

// Type spécifique pour KeyConcepts2Activity
export interface KeyConcepts2ActivityData extends BaseActivityData {
  phase: KeyConceptsPhase;
}

// Type spécifique pour les autres activités
export interface StandardActivityData extends BaseActivityData {
  phase: ActivityPhase;
}
