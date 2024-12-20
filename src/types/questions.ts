export interface KeyQuestion {
  id: string;
  type: 'key_question';
  level: 1 | 2 | 3;
  question: string;
  targetAspect: string;
  modelAnswer: string;
  feedback: string;
  expectedAnswer: string;
  evaluationCriteria: string[];
  conceptId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KeyQuestionInput {
  type: 'key_question';
  level: 1 | 2 | 3;
  question: string;
  targetAspect: string;
  modelAnswer: string;
  feedback: string;
  expectedAnswer: string;
  evaluationCriteria: string[];
  conceptId: string;
}

export interface QuestionMetadata {
  conceptId: string;
  aspectsCovered: string[];
  totalQuestions: number;
}

export interface GeneratedQuestionsResponse {
  questions: KeyQuestion[];
  metadata: QuestionMetadata;
}

export interface ScoringRubric {
  maxPoints: number;
  passingScore: number;
  criteria: string[];
}

export type QuestionType = 
  // Questions basiques
  | 'true_false'                    // Vrai/Faux simple
  | 'true_false_justify'            // Vrai/Faux avec justification
  | 'multiple_choice'               // QCM classique
  | 'mcq_single'                    // QCM à réponse unique
  | 'mcq_multiple'                  // QCM à réponses multiples
  
  // Questions à compléter
  | 'fill_blank'                    // Question à trou simple
  | 'fill_blank_complex'            // Question à trous multiples
  | 'fill_in_blank'                 // Texte à trous
  
  // Questions d'association et d'ordre
  | 'matching'                      // Association simple
  | 'matching_complex'              // Association complexe
  | 'ordering'                      // Mise en ordre/Classement
  | 'grouping'                      // Regroupement/Classification
  | 'sorting'                       // Tri/Organisation
  
  // Questions de raisonnement
  | 'assertion_reason'              // Question assertion-raison
  | 'cause_effect'                  // Cause et effet
  | 'comparison'                    // Comparaison
  | 'analysis'                      // Analyse
  
  // Questions ouvertes
  | 'open_ended'                    // Question ouverte générale
  | 'open_short'                    // Réponse courte
  | 'open_long'                     // Réponse longue/développement
  | 'case_study'                    // Étude de cas
  
  // Questions spéciales
  | 'diagram'                       // Interprétation de diagramme
  | 'calculation'                   // Calcul/Problème numérique
  | 'sequence'                      // Séquence/Suite logique
  | 'matrix'                        // Matrice de réponses
  | 'key_points'                    // Points clés à identifier
  | 'key_question';

export interface QuizQuestionConcept {
  id: string;
  name: string;
  explanation: string;
  what: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  pairs?: Array<{ term: string; definition: string }>;  // Pour matching
  items?: string[];                                     // Pour ordering/sorting
  groups?: { [key: string]: string[] };                // Pour grouping
  assertion?: string;                                  // Pour assertion_reason
  reason?: string;                                     // Pour assertion_reason
  diagram?: string;                                    // Pour diagram
  matrix?: Array<Array<string>>;                      // Pour matrix
  feedback?: string;
  explanation?: string;
  concept?: QuizQuestionConcept;
  points: number;
  aspect: string;
  conceptId: string;
  chapterId?: string;
  difficultyLevel?: 'level_1' | 'level_2' | 'level_3';
  scoringRubric?: {
    criteria: string[];
    maxPoints: number;
    passingScore: number;
  };
  blanks?: Array<{                                    // Pour fill_blank et variantes
    label?: string;
    placeholder?: string;
    hint?: string;
    answer: string;
  }>;
  criteria?: string[];                                // Pour cause_effect, comparison, analysis
  sequence?: string[];                                // Pour sequence
  numberOfPoints?: number;                            // Pour key_points
  evaluationCriteria?: string[];                      // Pour questions ouvertes
}

export interface GeneratedQuestion extends QuizQuestion {
  chapterId: string;
  concept: QuizQuestionConcept;
  difficultyLevel: 'level_1' | 'level_2' | 'level_3';
}

export interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  timeTaken: number;
}