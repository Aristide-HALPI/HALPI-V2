import { openai } from '../lib/openai';
import { Concept } from '../types/concepts';

interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: {
    correct: string[];
    missing: string[];
    wrong: string[];
    customFields?: string[];
  };
}

export async function evaluateExplanation(
  userAnswers: Partial<Concept>,
  concept: Concept
): Promise<{ isCorrect: boolean; score: number; feedback: string }> {
  try {
    // Construire un texte formaté pour l'évaluation
    const formattedUserAnswer = formatAnswersForEvaluation(userAnswers);
    const formattedReferenceAnswer = formatAnswersForEvaluation(concept);

    const systemPrompt = `
    Évaluez cette explication d'un concept en comparant avec la référence.
    
    Réponse de l'apprenant :
    ${formattedUserAnswer}

    Réponse de référence :
    ${formattedReferenceAnswer}

    Instructions d'évaluation :
    1. Vérifiez si l'explication est globalement correcte
    2. Identifiez les éléments corrects et les erreurs
    3. Donnez une note sur 10 selon ces critères :
       - Exactitude des informations (3 points)
       - Complétude de l'explication (3 points)
       - Clarté et précision (2 points)
       - Qualité des champs personnalisés (2 points)
    4. Fournissez un feedback constructif et encourageant, en incluant des commentaires spécifiques sur les champs personnalisés

    Répondez avec un JSON contenant :
    {
      "isCorrect": boolean (true si score >= 7),
      "score": number (note sur 10),
      "feedback": {
        "correct": string[] (points forts),
        "missing": string[] (éléments manquants),
        "wrong": string[] (erreurs à corriger),
        "customFields": string[] (feedback sur les champs personnalisés)
      }
    }`;

    const result = await evaluateOpenEndedAnswer(formattedUserAnswer, formattedReferenceAnswer);

    const feedback = [
      ...result.feedback.correct,
      ...(result.feedback.missing || []),
      ...(result.feedback.wrong || []),
      ...(result.feedback.customFields || [])
    ].join('\n');

    return {
      isCorrect: result.isCorrect,
      score: result.score,
      feedback
    };
  } catch (error) {
    console.error('Error evaluating explanation:', error);
    throw error;
  }
}

function formatAnswersForEvaluation(answers: Partial<Concept>): string {
  const fields = [
    { key: 'who', label: 'Qui' },
    { key: 'what', label: 'Quoi' },
    { key: 'why', label: 'Pourquoi' },
    { key: 'how', label: 'Comment' },
    { key: 'when', label: 'Quand' },
    { key: 'where', label: 'Où' },
    { key: 'keyPoints', label: 'Points clés' }
  ];

  let formatted = '';
  fields.forEach(({ key, label }) => {
    if (answers[key as keyof Concept]) {
      formatted += `${label} : ${answers[key as keyof Concept]}\n`;
    }
  });

  if (answers.customFields?.length) {
    formatted += '\nChamps personnalisés :\n';
    answers.customFields.forEach(field => {
      formatted += `${field.label} : ${field.value}\n`;
    });
  }

  return formatted;
}

async function evaluateOpenEndedAnswer(
  userAnswer: string,
  referenceAnswer: string
): Promise<EvaluationResult> {
  // Mock de l'évaluation pour le développement
  return {
    isCorrect: true,
    score: 8,
    feedback: {
      correct: ['Bonne compréhension générale'],
      missing: [],
      wrong: [],
      customFields: ['Bonne utilisation des champs personnalisés']
    }
  };
}
