import { Concept } from '../types/concepts';
import { GeneratedQuestionsResponse, KeyQuestion } from '../types/questions';

function generateQuestionId(conceptId: string, targetAspect: string, level: number, sequence: number): string {
  const aspectShort = targetAspect.startsWith('custom_field:') 
    ? `custom_${targetAspect.split(':')[1]}`
    : targetAspect;
  return `Q_${conceptId}_${aspectShort}_${level}_${sequence.toString().padStart(2, '0')}_key`;
}

export async function generateQuestionsForConcept(concept: Concept): Promise<GeneratedQuestionsResponse> {
  try {
    const questions: KeyQuestion[] = [];
    const aspectsCovered: Set<string> = new Set();
    let sequence = 1;

    // Questions de niveau 1 - Compréhension fondamentale
    if (concept.what) {
      const questionId = generateQuestionId(concept.id, 'what', 1, sequence++);
      questions.push({
        id: questionId,
        type: 'key_question',
        level: 1,
        question: `Expliquez en détail ce qu'est ${concept.name}.`,
        targetAspect: 'what',
        modelAnswer: concept.what,
        expectedAnswer: `Une réponse complète devrait expliquer que ${concept.what}`,
        feedback: "Cette question vise à évaluer la compréhension fondamentale du concept.",
        evaluationCriteria: [
          "Définition claire et précise",
          "Utilisation des termes appropriés",
          "Explication des éléments essentiels"
        ],
        conceptId: concept.id
      });
      aspectsCovered.add('what');
    }

    // Questions de niveau 2 - Application
    if (concept.how) {
      const questionId = generateQuestionId(concept.id, 'how', 2, sequence++);
      questions.push({
        id: questionId,
        type: 'key_question',
        level: 2,
        question: `Comment ${concept.name} fonctionne-t-il en pratique ?`,
        targetAspect: 'how',
        modelAnswer: concept.how,
        expectedAnswer: `Une réponse complète devrait expliquer que ${concept.how}`,
        feedback: "Cette question évalue la compréhension du fonctionnement pratique du concept.",
        evaluationCriteria: [
          "Description claire du processus",
          "Identification des étapes clés",
          "Compréhension des mécanismes"
        ],
        conceptId: concept.id
      });
      aspectsCovered.add('how');
    }

    // Questions de niveau 3 - Analyse
    if (concept.why) {
      const questionId = generateQuestionId(concept.id, 'why', 3, sequence++);
      questions.push({
        id: questionId,
        type: 'key_question',
        level: 3,
        question: `Pourquoi ${concept.name} est-il important et quelles sont ses implications ?`,
        targetAspect: 'why',
        modelAnswer: concept.why,
        expectedAnswer: `Une réponse complète devrait expliquer que ${concept.why}`,
        feedback: "Cette question pousse à une réflexion approfondie sur l'importance et les implications du concept.",
        evaluationCriteria: [
          "Analyse des implications",
          "Justification de l'importance",
          "Liens avec d'autres concepts"
        ],
        conceptId: concept.id
      });
      aspectsCovered.add('why');
    }

    // Questions basées sur les champs personnalisés
    if (concept.customFields?.length) {
      concept.customFields.forEach((field, index) => {
        const questionId = generateQuestionId(concept.id, `custom_field:${field.label}`, 3, sequence++);
        questions.push({
          id: questionId,
          type: 'key_question',
          level: 3,
          question: `Comment ${field.label} influence-t-il ou se rapporte-t-il à ${concept.name} ?`,
          targetAspect: `custom_field:${field.label}`,
          modelAnswer: field.value,
          expectedAnswer: `Une réponse complète devrait expliquer que ${field.value}`,
          feedback: `Cette question explore l'aspect spécifique de ${field.label} en relation avec le concept.`,
          evaluationCriteria: [
            "Compréhension de l'aspect spécifique",
            "Liens avec le concept principal",
            "Application pratique"
          ],
          conceptId: concept.id
        });
        aspectsCovered.add(`custom_field:${field.label}`);
      });
    }

    return {
      questions,
      metadata: {
        conceptId: concept.id,
        aspectsCovered: Array.from(aspectsCovered),
        totalQuestions: questions.length
      }
    };
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}