import { KeyConceptsPhase, KeyConcepts2ActivityData } from '../../../types/shared';

export namespace types {
  export type Phase = KeyConceptsPhase;

  export interface CustomField {
    id: string;
    label: string;
    value: string;
  }

  export interface Concept {
    id?: string;
    concept: string;
    vulgarisation: string;
    who?: string;
    what?: string;
    why?: string;
    how?: string;
    when?: string;
    where?: string;
    keyPoints?: string;
    image?: string;  // URL de l'image
    customFields?: CustomField[];
  }

  export interface FoundConcept {
    concept: string;
    explanation?: string;
    isCorrect?: boolean;
    feedback?: {
      correct: string[];
      missing: string[];
      wrong: string[];
    };
    score?: number;
  }

  export interface ValidatedConcept {
    concept: string;
    explanation: string;
    score: number;
    feedback: string;
    timestamp: string;
    fields: Array<{
      key: string;
      label: string;
      userAnswer: string;
      referenceAnswer: string;
      score: number;
      feedback: string[];
    }>;
  }

  export interface ConceptProgress {
    foundConcepts: FoundConcept[];
    validatedConcepts: ValidatedConcept[];
    phase: Phase;
    userId: string;
    stepId: string;
    updatedAt: Date;
  }

  export interface KeyConcepts2ActivityProps {
    data: KeyConcepts2ActivityData;
  }

  export interface HeaderProps {
    navigate: (path: string) => void;
    isCompleting: boolean;
    evaluationError: string | null;
  }

  export interface IdentificationPhaseProps {
    concepts: Concept[];
    foundConcepts: FoundConcept[];
    setFoundConcepts: (concepts: FoundConcept[]) => void;
    setPhase: (phase: Phase) => void;
    saveProgress: () => Promise<void>;
    resetProgress: () => Promise<void>;
  }

  export interface ExplanationPhaseProps {
    concepts: Concept[];
    foundConcepts: FoundConcept[];
    validatedConcepts: ValidatedConcept[];
    onConceptValidated: (concept: ValidatedConcept) => void;
    setFoundConcepts: (concepts: FoundConcept[]) => void;
    saveProgress: () => Promise<void>;
    handleComplete: () => Promise<void>;
    setPhase: (phase: Phase) => void;
    resetProgress: () => Promise<void>;
  }
}