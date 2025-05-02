/**
 * Service centralisé pour les interactions avec l'IA Fabrile
 */
import { interactWithAI, AIInteractionType } from '../../api/ai/routes/fabrileInteraction';

// Types de réponses pour les différentes interactions IA

// 1. Évaluation avec notation
export interface ConceptIdentificationResponse {
  isCorrect: boolean;
  similarity: number;
  feedback: string;
}

export interface ConceptRestitutionField {
  note_sur_10: number;
  type_erreur: string | null;
  commentaire: string;
}

export interface ConceptRestitutionResponse {
  concept: string;
  champs: Record<string, ConceptRestitutionField>;
  note_globale_sur_30: number;
  est_validee: boolean;
  commentaire_general: string;
}

export interface QuizEvaluationResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
}

export interface QuizEvaluationResponse {
  score: number;
  feedback: string;
  questionResults: QuizEvaluationResult[];
  totalScore: number;
  maxPossibleScore: number;
}

// 2. Feedback sans notation
export interface ContentFeedbackResponse {
  feedback: string;
  strengths: string[];
  improvements: string[];
  [key: string]: any; // Pour les champs spécifiques à chaque type de feedback
}

// 3. Recommandations et progression
export interface StudyPlanningDay {
  day: string;
  duration: string;
  focus: string;
  activities: string[];
}

export interface StudyPlanningResponse {
  recommendation: string;
  planning: StudyPlanningDay[];
  priorities: string[];
  tips: string[];
}

export interface ProgressReportResponse {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  trends: string;
  recommendations: string[];
  nextSteps: string;
}

// Union type pour toutes les réponses possibles
export type AIResponse = 
  | ConceptIdentificationResponse 
  | ConceptRestitutionResponse 
  | QuizEvaluationResponse
  | ContentFeedbackResponse
  | StudyPlanningResponse
  | ProgressReportResponse;

/**
 * Service centralisé pour les interactions avec l'IA Fabrile
 */
export const AIService = {
  /**
   * Interaction générique avec l'IA
   * @param type Type d'interaction avec l'IA
   * @param content Contenu à analyser ou évaluer
   * @param organizationId ID de l'organisation Fabrile
   * @returns Réponse formatée de l'IA
   */
  interact: async <T extends AIResponse>(
    type: AIInteractionType,
    content: string | object,
    organizationId: string = import.meta.env.VITE_FABRILE_ORG_ID
  ): Promise<T> => {
    // Vérifier que l'ID d'organisation est défini
    if (!organizationId) {
      throw new Error("ID d'organisation Fabrile manquant dans les variables d'environnement");
    }
    
    // Convertir le contenu en string s'il s'agit d'un objet
    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
    
    // Appeler l'API Fabrile
    const result = await interactWithAI(organizationId, contentStr, type);
    
    return result as T;
  },

  /**
   * Vérifie si un concept identifié par l'utilisateur est correct
   * @param userResponse Réponse de l'utilisateur
   * @param expectedConcept Concept attendu
   * @param organizationId ID de l'organisation
   * @returns Réponse indiquant si le concept est correctement identifié
   */
  identifyConcept: async (
    userResponse: string, 
    expectedConcept: string,
    organizationId: string
  ): Promise<ConceptIdentificationResponse> => {
    return AIService.interact<ConceptIdentificationResponse>(
      'concept_identification',
      {
        userResponse,
        expectedConcept
      },
      organizationId
    );
  },

  /**
   * Évalue la restitution d'un concept par l'utilisateur
   * @param userResponses Réponses de l'utilisateur pour chaque section du concept
   * @param referenceConcept Concept de référence
   * @param organizationId ID de l'organisation
   * @returns Évaluation détaillée de la restitution
   */
  /**
   * Évalue la restitution d'un concept par l'utilisateur en utilisant le bot spécifique à la restitution
   * @param userResponses Réponses de l'utilisateur pour chaque section du concept
   * @param referenceConcept Concept de référence créé dans l'activité 2
   * @param organizationId ID de l'organisation
   * @returns Évaluation détaillée de la restitution
   */
  evaluateConceptRestitution: async (
    userResponses: Record<string, string>,
    referenceConcept: Record<string, string>,
    organizationId: string = import.meta.env.VITE_FABRILE_ORG_ID
  ): Promise<ConceptRestitutionResponse> => {
    // Récupérer l'ID du bot spécifique pour la restitution
    // Utiliser directement la valeur fournie si elle est disponible dans l'environnement
    const botId = import.meta.env.VITE_Restitution_BOT_ID || 'bot_CHnxzWJ59zu6W2gH7E9gb';
    
    console.log('Bot ID utilisé pour la restitution:', botId);
    
    if (!botId) {
      throw new Error("ID du bot de restitution manquant dans les variables d'environnement");
    }
    
    // Préparer les données à envoyer
    // Inclure explicitement les cartes de concepts originales pour la comparaison
    const content = {
      userResponses,
      referenceConcept,
      botId
    };
    
    console.log("Envoi des données pour évaluation de restitution:", {
      ...content,
      botId: "[REDACTED]" // Pour la sécurité dans les logs
    });
    
    return AIService.interact<ConceptRestitutionResponse>(
      'concept_restitution',
      content,
      organizationId
    );
  },
  
  /**
   * Obtient un feedback sur les notes prises par l'apprenant
   * @param notes Contenu des notes
   * @param context Contexte d'apprentissage (chapitre, cours, etc.)
   * @param organizationId ID de l'organisation
   * @returns Feedback détaillé sur les notes
   */
  getNotesFeedback: async (
    notes: string,
    context: { chapter: string, course: string },
    organizationId: string
  ): Promise<ContentFeedbackResponse> => {
    return AIService.interact<ContentFeedbackResponse>(
      'note_feedback',
      {
        notes,
        context
      },
      organizationId
    );
  },
  
  /**
   * Évalue les réponses à un quiz
   * @param userAnswers Réponses de l'utilisateur
   * @param correctAnswers Réponses correctes
   * @param organizationId ID de l'organisation
   * @returns Évaluation détaillée du quiz
   */
  evaluateQuiz: async (
    userAnswers: Record<string, any>,
    correctAnswers: Record<string, any>,
    organizationId: string
  ): Promise<QuizEvaluationResponse> => {
    return AIService.interact<QuizEvaluationResponse>(
      'quiz_evaluation',
      {
        userAnswers,
        correctAnswers
      },
      organizationId
    );
  }
};

export default AIService;
