export interface Concept {
  id: string;
  name: string;
  who?: string;
  what?: string;
  why?: string;
  how?: string;
  when?: string;
  where?: string;
  keyPoints?: string;
  illustration?: string;
  illustrationExplanation?: string;
  userId: string;
  chapterId: string;
  createdAt: string;
  customFields: CustomField[];
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface ConceptEvaluation {
  elementName: string;
  score: number;
  feedback: {
    correct: string[];
    missing: string[];
    wrong: string[];
  };
  detailedScores: {
    who?: number;
    what?: number;
    why?: number;
    how?: number;
    when?: number;
    where?: number;
    keyPoints?: number;
    schemaExplanation?: number;
  };
}

export interface ConceptEvaluationResult {
  isCorrect: boolean;
  score: number;
  masteringLevel: 'total' | 'partial' | 'insufficient';
  feedback: {
    correct: string[];
    missing: string[];
    wrong: string[];
  };
  detailedScores: {
    who?: number;
    what?: number;
    why?: number;
    how?: number;
    when?: number;
    where?: number;
    keyPoints?: number;
    schemaExplanation?: number;
  };
}

export interface ConceptAttempt {
  userId: string;
  stepId: string;
  conceptId: string;
  phase: 'identification' | 'explanation';
  foundConcepts?: string[];
  evaluations?: ConceptEvaluation[];
  timestamp: string;
}