import { QuestionType } from './questions';

export type DifficultyLevel = 'level_1' | 'level_2' | 'level_3';

export type AspectType = 
  | 'name'
  | 'what'
  | 'when'
  | 'where'
  | 'why'
  | 'how'
  | 'who'
  | 'key_points'
  | 'custom_field';

export interface ScoringRubric {
  criteria: string[];
  maxPoints: number;
  passingScore: number;
}

export interface MatchingItem {
  left: string;
  right: string;
}

export interface QuizQuestionConcept {
  id: string;
  name: string;
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  concept: string;
  conceptExplanation: string;
  questionType: QuestionType;
  difficultyLevel: DifficultyLevel;
  question: string;
  correctAnswer: string | string[];
  options: string[];
  feedback: string;
  explanation: string;
  points: number;
  expectedAnswers: string[];
  aspect: AspectType;
  customField?: string;
  evaluationCriteria: string[];
  scoringRubric: ScoringRubric;
  userId?: string;
  courseId?: string;
  createdAt?: string;
  items?: MatchingItem[];
}

export interface QuizQuestionUpdated {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  items?: string[] | MatchingItem[];
  feedback?: string;
  explanation?: string;
  concept?: QuizQuestionConcept;
  points: number;
  aspect?: string;
  conceptId: string;
  evaluationCriteria?: string[];
  difficultyLevel?: 'level_1' | 'level_2' | 'level_3';
  // Propriétés additionnelles pour différents types de questions
  pairs?: Array<{ term: string; definition: string }>;
  assertion?: string;
  reason?: string;
  matrix?: Array<Array<string>>;
  term?: string;
  definition?: string;
  groups?: { [key: string]: string[] };
  diagram?: string;
  blanks?: Array<{
    label?: string;
    placeholder?: string;
    hint?: string;
    answer: string;
  }>;
  scoringRubric?: {
    criteria: string[];
    maxPoints: number;
    passingScore: number;
  };
}

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  timeTaken: number;
  aiEvaluation?: {
    score: number;
    feedback: {
      strengths: string[];
      improvements: string[];
    };
  };
}

export interface ConceptStats {
  concept: string;
  explanation: string;
  totalQuestions: number;
  correctAnswers: number;
  masteryPercentage: number;
}

export interface QuizScore {
  correct: number;
  total: number;
}