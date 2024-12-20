export namespace types {
  export interface Concept {
    id: string;
    concept: string;
    vulgarisation: string;
    who?: string;
    what?: string;
    why?: string;
    how?: string;
    when?: string;
    where?: string;
    keyPoints?: string;
  }

  export interface ConceptField {
    key: string;
    label: string;
    userAnswer: string;
    referenceAnswer: string;
    score: number;
    feedback: {
      correct: string[];
      missing: string[];
      wrong: string[];
    };
  }

  export interface ValidatedConcept {
    conceptId: string;
    concept: string;
    fields: ConceptField[];
    isExpanded?: boolean;
  }

  export interface FoundConcept {
    concept: string;
    isValidated: boolean;
    validatedData?: ValidatedConcept;
  }

  export interface ConceptProgress {
    userId: string;
    stepId: string;
    foundConcepts: FoundConcept[];
    validatedConcepts: ValidatedConcept[];
    phase: 'identification' | 'explanation';
    currentIndex: number;
    updatedAt: string;
  }

  export interface IdentificationPhaseProps {
    concepts: Concept[];
    foundConcepts: FoundConcept[];
    currentConceptIndex: number;
    setFoundConcepts: (concepts: FoundConcept[]) => void;
    setCurrentConceptIndex: (index: number) => void;
    setPhase: (phase: 'identification' | 'explanation') => void;
    saveProgress: () => Promise<void>;
  }

  export interface ExplanationPhaseProps {
    concepts: Concept[];
    foundConcepts: FoundConcept[];
    setFoundConcepts: (concepts: FoundConcept[]) => void;
    saveProgress: () => Promise<void>;
    handleComplete: () => Promise<void>;
    setPhase: (phase: 'identification' | 'explanation') => void;
  }
}