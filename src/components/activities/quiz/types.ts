import { 
  QuizQuestion as BaseQuizQuestion, 
  QuestionType as BaseQuestionType,
  QuizQuestionConcept as BaseQuizQuestionConcept,
  DifficultyLevel as BaseDifficultyLevel
} from '../../../types/questions';

export namespace types {
  export type QuestionType = BaseQuestionType;
  export type DifficultyLevel = BaseDifficultyLevel;
  export type QuizQuestionConcept = BaseQuizQuestionConcept;

  export interface QuizQuestion extends Omit<BaseQuizQuestion, 'type'> {
    type: QuestionType;
    concept?: QuizQuestionConcept;
  }

  export interface QuizResult {
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    timeTaken: number;
  }

  export interface ConceptStats {
    concept: string;
    explanation: string;
    totalQuestions: number;
    correctAnswers: number;
    masteryPercentage: number;
  }
}