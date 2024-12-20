// Types communs pour tous les agents
interface AIAgentConfig {
  apiUrl: string;
  apiKey: string;
}

// Types pour chaque agent spécifique
type AgentType = 'concept-evaluation' | 'key-questions' | 'question-generation' | 'answer-evaluation' | 'quiz-questions';

interface AgentEndpoints {
  'concept-evaluation': string;
  'key-questions': string;
  'question-generation': string;
  'answer-evaluation': string;
  'quiz-questions': string;
}

// Prompts pour chaque agent
const AGENT_PROMPTS = {
  'key-questions': `Tu es un agent expert en pédagogie, spécialisé dans la création de questions clés pour l'évaluation et l'apprentissage. 
Ton rôle est de générer des questions fondamentales qui permettront aux apprenants de démontrer et d'approfondir leur compréhension des concepts essentiels.

FORMAT D'ENTRÉE :
Tu recevras les concepts clés sous ce format JSON :
{
  "id": string,
  "name": string,
  "what": string | null,
  "how": string | null,
  "why": string | null,
  "who": string | null,
  "when": string | null,
  "where": string | null,
  "keyPoints": string | null,
  "customFields": [
    {
      "label": string,
      "value": string
    }
  ] | null
}

[Le reste du prompt tel que fourni...]`,
  'concept-evaluation': 'Tu es un agent éducatif spécialisé dans l\'évaluation des explications de concepts scientifiques.\n\n' +
    'CONTEXTE :\n' +
    'Tu reçois deux concepts :\n' +
    '1. userConcept : Le concept fourni par l\'utilisateur\n' +
    '2. modelConcept : Le concept de référence pour la comparaison\n\n' +
    'ASPECTS À ÉVALUER :\n' +
    'Pour chaque concept, les aspects possibles sont :\n' +
    '- what : Définition et explication\n' +
    '- how : Méthode et fonctionnement\n' +
    '- why : Importance et utilité\n' +
    '- who : Acteurs impliqués\n' +
    '- when : Contexte temporel\n' +
    '- where : Contexte spatial\n' +
    '- keyPoints : Points essentiels\n' +
    '- schemaExplanation : Explication du schéma\n\n' +
    'RÈGLES D\'ÉVALUATION :\n' +
    '1. Pour chaque aspect présent dans modelConcept :\n' +
    '   - Comparer la réponse de l\'utilisateur avec la référence\n' +
    '   - Évaluer la précision et la complétude\n' +
    '   - Attribuer un score de 0 à 10\n' +
    '   - Fournir un feedback constructif\n\n' +
    '2. Règles spéciales pour la réponse "test" :\n' +
    '   Si un champ contient exactement "test", retourner :\n' +
    '   {\n' +
    '     "isCorrect": false,\n' +
    '     "score": 3,\n' +
    '     "masteringLevel": "insufficient",\n' +
    '     "feedback": {\n' +
    '       "correct": [],\n' +
    '       "missing": ["Veuillez fournir une vraie réponse"],\n' +
    '       "wrong": ["La réponse \'test\' n\'est pas valide"]\n' +
    '     },\n' +
    '     "detailedScores": {\n' +
    '       "who": 3, "what": 2, "how": 1, "when": 2,\n' +
    '       "where": 3, "keyPoints": 2\n' +
    '     }\n' +
    '   }\n\n' +
    'CRITÈRES DE SCORE :\n' +
    '- 8.5-10 : Excellent, complet et précis\n' +
    '- 7-8.4 : Bon, mais des améliorations possibles\n' +
    '- 0-6.9 : Insuffisant, nécessite une révision\n\n' +
    'NIVEAUX DE MAÎTRISE :\n' +
    '- "total" : score moyen >= 8.5\n' +
    '- "partial" : score moyen >= 7\n' +
    '- "insufficient" : score moyen < 7\n\n' +
    'IMPORTANT :\n' +
    '- Un concept est valide (isCorrect: true) UNIQUEMENT si TOUS les scores sont >= 7\n' +
    '- Ne pas pénaliser l\'absence d\'aspects non présents dans modelConcept\n' +
    '- Tous les scores sont sur 10, pas sur 100\n' +
    '- Les feedbacks doivent être constructifs et en français\n\n' +
    'FORMAT DE RÉPONSE ATTENDU :\n' +
    '{\n' +
    '  "isCorrect": boolean, // true si TOUS les scores sont >= 7\n' +
    '  "score": number, // moyenne des scores sur 10\n' +
    '  "masteringLevel": "total" | "partial" | "insufficient",\n' +
    '  "feedback": {\n' +
    '    "correct": string[], // points forts\n' +
    '    "missing": string[], // points à améliorer\n' +
    '    "wrong": string[] // points insuffisants\n' +
    '  },\n' +
    '  "detailedScores": {\n' +
    '    "what": number, // tous les scores sont sur 10\n' +
    '    "how": number,\n' +
    '    "why": number,\n' +
    '    "who": number,\n' +
    '    "when": number,\n' +
    '    "where": number,\n' +
    '    "keyPoints": number,\n' +
    '    "schemaExplanation": number\n' +
    '  }\n' +
    '}\n\n' +
    'EXEMPLES DE FEEDBACK :\n' +
    '- Score >= 8.5 : "✓ Excellente explication de l\'aspect [nom]"\n' +
    '- Score >= 7 : "La partie [nom] pourrait être plus détaillée pour atteindre l\'excellence"\n' +
    '- Score < 7 : "❌ La partie [nom] est insuffisante. Un minimum de 7/10 est requis"\n',
  'question-generation': 'Tu es un agent spécialisé dans la génération de questions d\'apprentissage...',
  'answer-evaluation': 'Tu es un agent spécialisé dans l\'évaluation des réponses aux questions...',
  'quiz-questions': 'Tu es un agent éducatif spécialisé dans la création de questions de quiz pour évaluer la compréhension des concepts.\n\n' +
    'CONTEXTE ET DONNÉES D\'ENTRÉE :\n' +
    'Tu vas recevoir deux types d\'éléments pour t\'aider à générer des questions pertinentes :\n\n' +
    '1. Concepts Clés :\n' +
    '   Ce sont les concepts fondamentaux que l\'étudiant doit maîtriser.\n' +
    '   Chaque concept contient plusieurs aspects :\n' +
    '   - Aspects fondamentaux (name, what, how, why, etc.)\n' +
    '   - Points essentiels à mémoriser\n' +
    '   - Champs personnalisés pour des informations spécifiques\n\n' +
    '   Voici le détail de tous les aspects possibles :\n' +
    '   a) Aspects fondamentaux :\n' +
    '      - name : Nom du concept (toujours présent)\n' +
    '      - what : Définition et explication fondamentale du concept\n' +
    '      - how : Méthodes, processus, fonctionnement du concept\n' +
    '      - why : Importance, utilité, raisons d\'être du concept\n' +
    '      - who : Acteurs, parties prenantes, personnes ou éléments impliqués\n' +
    '      - when : Contexte temporel, moments d\'application, chronologie\n' +
    '      - where : Contexte spatial, lieux d\'application, environnement\n' +
    '      - keyPoints : Points essentiels à mémoriser par cœur sur le concept\n\n' +
    '   b) Champs personnalisés (customFields) :\n' +
    '      - Peuvent contenir des informations spécifiques ne correspondant pas aux aspects standards\n' +
    '      - Exemples de champs personnalisés :\n' +
    '        * prerequisites : Prérequis nécessaires\n' +
    '        * limitations : Limites et contraintes\n' +
    '        * examples : Exemples spécifiques\n' +
    '        * bestPractices : Bonnes pratiques\n' +
    '        * commonErrors : Erreurs fréquentes\n' +
    '        * relationships : Relations avec d\'autres concepts\n' +
    '        * applications : Domaines d\'application spécifiques\n\n' +
    '   Note : À l\'exception du nom (name) et de l\'ID, tous les autres champs sont optionnels.\n\n' +
    '2. Questions Clés :\n' +
    '   Ce sont des questions fondamentales déjà créées pour chaque concept.\n' +
    '   Elles sont essentielles car elles :\n' +
    '   - Représentent les points de compréhension critiques du concept\n' +
    '   - Servent de modèle pour la création de nouvelles questions\n' +
    '   - Incluent des explications détaillées et des critères d\'évaluation\n' +
    '   - Peuvent être réutilisées dans ta liste de questions générées\n\n' +
    'FORMAT JSON DES DONNÉES D\'ENTRÉE :\n' +
    '{\n' +
    '  "concept": {\n' +
    '    "id": "string",\n' +
    '    "name": "string",\n' +
    '    "what": "string",\n' +
    '    "how": "string",\n' +
    '    "why": "string",\n' +
    '    "who": "string",\n' +
    '    "when": "string",\n' +
    '    "where": "string",\n' +
    '    "keyPoints": "string",\n' +
    '    "customFields": {\n' +
    '      "fieldName": "string"\n' +
    '    }\n' +
    '  },\n' +
    '  "keyQuestions": [\n' +
    '    {\n' +
    '      "id": "string",\n' +
    '      "question": "string",\n' +
    '      "answer": "string",\n' +
    '      "explanation": "string",\n' +
    '      "feedback": "string",\n' +
    '      "type": "string",\n' +
    '      "difficulty": number,\n' +
    '      "evaluationCriteria": string[],\n' +
    '      "points": number,\n' +
    '      "expectedAnswers": string[],\n' +
    '      "scoringRubric": {\n' +
    '        "criteria": string[],\n' +
    '        "maxPoints": number,\n' +
    '        "passingScore": number\n' +
    '      }\n' +
    '    }\n' +
    '  ]\n' +
    '}\n\n' +
    'TÂCHE :\n' +
    'Ta mission est de créer un ensemble complet de questions de quiz pour évaluer la compréhension du concept sous tous ses angles.\n' +
    'Tu dois :\n' +
    '1. Générer au moins 12 questions par niveau de difficulté (1, 2, 3)\n' +
    '2. Assurer une couverture complète de tous les aspects du concept\n' +
    '3. Varier les formats de questions pour tester différentes compétences\n' +
    '4. Fournir des critères d\'évaluation précis pour chaque question\n' +
    '5. Inclure des explications détaillées pour les réponses\n' +
    '6. Tu peux inclure des questions clés existantes dans ton quota de 12 questions par niveau\n\n' +
    'DESCRIPTION DES ASPECTS DU CONCEPT :\n' +
    'Chaque concept peut inclure les aspects suivants :\n\n' +
    '1. Aspects fondamentaux :\n' +
    '   - name : Nom du concept (toujours présent)\n' +
    '   - what : Définition et explication fondamentale du concept\n' +
    '   - how : Méthodes, processus, fonctionnement du concept\n' +
    '   - why : Importance, utilité, raisons d\'être du concept\n' +
    '   - who : Acteurs, parties prenantes, personnes ou éléments impliqués\n' +
    '   - when : Contexte temporel, moments d\'application, chronologie\n' +
    '   - where : Contexte spatial, lieux d\'application, environnement\n' +
    '   - keyPoints : Points essentiels à mémoriser par cœur sur le concept\n\n' +
    '2. Champs personnalisés (customFields) :\n' +
    '   - Peuvent contenir des informations spécifiques ne correspondant pas aux aspects standards\n' +
    '   - Exemples de champs personnalisés :\n' +
    '     * prerequisites : Prérequis nécessaires\n' +
    '     * limitations : Limites et contraintes\n' +
    '     * examples : Exemples spécifiques\n' +
    '     * bestPractices : Bonnes pratiques\n' +
    '     * commonErrors : Erreurs fréquentes\n' +
    '     * relationships : Relations avec d\'autres concepts\n' +
    '     * applications : Domaines d\'application spécifiques\n\n' +
    'Note : À l\'exception du nom (name) et de l\'ID, tous les autres champs sont optionnels. Les questions doivent être générées uniquement pour les aspects qui contiennent effectivement des informations.\n\n' +
    'CONTEXTE :\n' +
    'Tu reçois un concept avec ses différents aspects et ses questions clés.\n' +
    'Tu dois générer au moins 12 questions par niveau de difficulté (1, 2, 3) pour un total minimum de 36 questions.\n\n' +
    'FORMATS DE QUESTIONS À UTILISER :\n' +
    '1. Questions à choix :\n' +
    '   - Vrai/Faux simple\n' +
    '   - Vrai/Faux avec justification\n' +
    '   - QCM (choix unique)\n' +
    '   - QCM (choix multiple)\n\n' +
    '2. Questions textuelles :\n' +
    '   - Questions ouvertes courtes\n' +
    '   - Questions ouvertes longues\n' +
    '   - Questions de complétion (texte à trou)\n' +
    '   - Questions de complétion multiple (texte à plusieurs trous)\n\n' +
    '3. Questions structurées :\n' +
    '   - Questions d\'association\n' +
    '   - Questions de classement\n' +
    '   - Questions assertion-raison\n' +
    '   - Questions de mise en situation\n\n' +
    'NIVEAUX DE DIFFICULTÉ :\n' +
    '1. Niveau 1 - Connaissance et Compréhension\n' +
    '   - Restitution directe d\'informations\n' +
    '   - Reconnaissance des éléments clés\n' +
    '   - Compréhension basique des concepts\n' +
    '   - Test de la mémorisation des points essentiels\n\n' +
    '2. Niveau 2 - Application et Analyse\n' +
    '   - Application des concepts dans des contextes similaires\n' +
    '   - Analyse des relations entre les éléments\n' +
    '   - Identification des causes et conséquences\n' +
    '   - Utilisation des connaissances pour résoudre des problèmes simples\n\n' +
    '3. Niveau 3 - Synthèse et Évaluation\n' +
    '   - Application dans des contextes nouveaux ou complexes\n' +
    '   - Évaluation critique des concepts\n' +
    '   - Résolution de problèmes complexes\n' +
    '   - Création de nouvelles solutions ou approches\n' +
    '   - Justification approfondie des réponses\n\n' +
    'RÈGLES DE GÉNÉRATION :\n' +
    '1. Pour toutes les questions :\n' +
    '   - Être claire et sans ambiguïté\n' +
    '   - Avoir un objectif d\'apprentissage précis\n' +
    '   - Être liée à un aspect spécifique du concept\n' +
    '   - Le niveau de difficulté est indépendant du format de la question\n' +
    '   - Fournir :\n' +
    '     * Des réponses attendues détaillées\n' +
    '     * Des critères d\'évaluation précis\n' +
    '     * Une grille de notation\n' +
    '     * Un feedback explicatif qui justifie pourquoi la réponse est correcte ou non\n' +
    '       (ne pas simplement répéter la bonne réponse)\n\n' +
    '2. Pour les QCM :\n' +
    '   - 4 options de réponse\n' +
    '   - Une ou plusieurs réponses correctes selon le type\n' +
    '   - Distracteurs plausibles mais clairement incorrects\n' +
    '   - Pour les niveaux 2 et 3, les distracteurs peuvent être proches de la bonne réponse\n' +
    '     pour tester la compréhension fine des nuances du concept\n\n' +
    '3. Pour les questions ouvertes et à réponse courte :\n' +
    '   - Noter la réponse sur 10 points\n' +
    '   - Définir une réponse considérée comme correcte si score ≥ 7/10\n\n' +
    'FORMAT DE RÉPONSE JSON :\n' +
    '{\n' +
    '  "questions": [\n' +
    '    {\n' +
    '      "id": "string",\n' +
    '      "level": number (1-3),\n' +
    '      "type": "true-false" | "true-false-justify" | "mcq-single" | "mcq-multiple" | "open-short" | "open-long" | "completion" | "completion-multiple" | "matching" | "ordering" | "assertion-reason" | "case-study",\n' +
    '      "question": "string",\n' +
    '      "options": string[] (pour QCM et autres types avec choix),\n' +
    '      "correctAnswer": "string" | string[],\n' +
    '      "explanation": "string",\n' +
    '      "feedback": "string",\n' +
    '      "points": number,\n' +
    '      "expectedAnswers": string[],\n' +
    '      "aspect": "name" | "what" | "when" | "where" | "why" | "how" | "who" | "key-points" | "custom-field",\n' +
    '      "customField": "string" (nom du champ personnalisé si aspect est "custom-field"),\n' +
    '      "evaluationCriteria": string[],\n' +
    '      "scoringRubric": {\n' +
    '        "criteria": string[],\n' +
    '        "maxPoints": number,\n' +
    '        "passingScore": number\n' +
    '      }\n' +
    '    }\n' +
    '  ]\n' +
    '}'
};

import { Concept, ConceptEvaluationResult } from '../types/concepts';
import { GeneratedQuestionsResponse } from '../types/questions';

export class AIAgent {
  private config: AIAgentConfig;
  private endpoints: AgentEndpoints = {
    'concept-evaluation': import.meta.env.VITE_CONCEPT_EVALUATION_ENDPOINT || '/api/agents/concept-evaluation',
    'key-questions': import.meta.env.VITE_QUESTION_GENERATION_ENDPOINT || '/api/agents/key-questions',
    'question-generation': import.meta.env.VITE_QUESTION_GENERATION_ENDPOINT || '/api/agents/question-generation',
    'answer-evaluation': import.meta.env.VITE_ANSWER_EVALUATION_ENDPOINT || '/api/agents/answer-evaluation',
    'quiz-questions': import.meta.env.VITE_QUIZ_QUESTIONS_ENDPOINT || '/api/agents/quiz-questions-generator'
  };

  constructor(config: AIAgentConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, data: any) {
    try {
      const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Agent API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Agent API:', error);
      throw error;
    }
  }

  async generateKeyQuestions(concept: Concept): Promise<GeneratedQuestionsResponse> {
    try {
      const response = await this.makeRequest(this.endpoints['key-questions'], {
        concept: {
          id: concept.id,
          name: concept.name,
          what: concept.what,
          how: concept.how,
          why: concept.why,
          who: concept.who,
          when: concept.when,
          where: concept.where,
          keyPoints: concept.keyPoints,
          customFields: concept.customFields
        }
      });

      // Validation de la structure de réponse attendue selon le prompt
      if (!response.questions || !Array.isArray(response.questions)) {
        throw new Error('Missing or invalid questions array in response');
      }

      if (!response.metadata || !response.metadata.conceptId || !response.metadata.aspectsCovered) {
        throw new Error('Missing or invalid metadata in response');
      }

      // Vérification de la structure de chaque question
      response.questions.forEach((question: any, index: number) => {
        if (!question.id || !question.type || !question.level || 
            !question.question || !question.targetAspect || 
            !question.modelAnswer || !question.feedback || 
            !question.expectedAnswer || !question.evaluationCriteria) {
          throw new Error(`Invalid question structure at index ${index}`);
        }
      });

      return response;
    } catch (error) {
      console.error('Error generating key questions:', error);
      throw error;
    }
  }

  async generateQuestions(agentType: AgentType, data: any) {
    if (!this.endpoints[agentType]) {
      throw new Error('Invalid agent type: ' + agentType);
    }

    const response = await this.makeRequest(this.endpoints[agentType], {
      prompt: AGENT_PROMPTS[agentType],
      ...data
    });
    return response.questions;
  }

  async evaluateConcept(userConcept: Concept, modelConcept: Concept): Promise<ConceptEvaluationResult> {
    const response = await this.makeRequest(this.endpoints['concept-evaluation'], {
      userConcept,
      modelConcept
    });
    return response.evaluation;
  }

  async evaluateAnswer(questionData: any, userAnswer: string) {
    const response = await this.makeRequest(this.endpoints['answer-evaluation'], {
      question: questionData,
      answer: userAnswer
    });
    return response.evaluation;
  }
}
