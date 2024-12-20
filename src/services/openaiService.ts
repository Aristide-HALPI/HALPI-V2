import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true
});

export async function evaluateConceptAnswer(
  userAnswer: string,
  referenceAnswer: string,
  isTitle: boolean = false
): Promise<{
  isCorrect: boolean;
  hasTypo: boolean;
  score: number;
  feedback: {
    correct: string[];
    missing: string[];
    wrong: string[];
  };
}> {
  if (!apiKey) {
    throw new Error('Configuration de l\'API OpenAI manquante');
  }

  try {
    const prompt = isTitle 
      ? `Compare ces deux titres de concept en analysant plusieurs aspects:
         Titre attendu: "${referenceAnswer}"
         Titre donné: "${userAnswer}"
         
         Instructions:
         1. Vérifie si les titres sont équivalents en ignorant:
            - différences de casse
            - apostrophes
            - accents
            - singulier/pluriel
         2. Si les titres ne sont pas exactement identiques mais très proches:
            - vérifie s'il y a des fautes de frappe évidentes
            - vérifie si des lettres sont inversées
            - vérifie si des lettres sont manquantes ou en trop
         
         Réponds uniquement avec un JSON contenant:
         {
           "isCorrect": boolean (true si équivalent ou faute de frappe évidente),
           "hasTypo": boolean (true si la réponse est correcte mais contient une faute de frappe),
           "score": number (10 si correct, 0 sinon),
           "feedback": {
             "correct": string[],
             "missing": string[],
             "wrong": string[]
           }
         }`
      : `Compare cette réponse avec la réponse de référence :

         Réponse de référence : "${referenceAnswer}"
         Réponse donnée : "${userAnswer}"

         Instructions pour l'évaluation :
         1. Compare UNIQUEMENT avec la réponse de référence fournie
         2. Attribue un score sur 10 basé sur la précision et la complétude par rapport à la référence
         3. Identifie les éléments corrects par rapport à la référence
         4. Suggère des améliorations sans révéler le contenu de la référence
         5. Identifie les points erronés sans donner la bonne réponse

         RÈGLES IMPORTANTES :
         - Utilise UNIQUEMENT la réponse de référence comme base de comparaison
         - Ne fais PAS appel à des connaissances externes
         - Ne révèle JAMAIS le contenu exact de la réponse de référence
         - Guide l'apprenant vers la bonne réponse sans la donner

         Réponds uniquement avec un JSON contenant :
         {
           "isCorrect": boolean (true si score >= 7),
           "hasTypo": boolean (true si la réponse est correcte mais contient une faute de frappe),
           "score": number (note sur 10),
           "feedback": {
             "correct": string[] (points bien compris par rapport à la référence),
             "missing": string[] (suggestions d'amélioration sans donner la réponse),
             "wrong": string[] (points erronés à revoir)
           }
         }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "Tu es un évaluateur expert qui compare STRICTEMENT avec la réponse de référence fournie. Tu ne dois utiliser AUCUNE connaissance externe et te baser UNIQUEMENT sur la réponse de référence pour l'évaluation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Réponse vide de l\'API OpenAI');
    }

    const result = JSON.parse(content);
    
    if (typeof result.isCorrect !== 'boolean' || 
        typeof result.hasTypo !== 'boolean' || 
        typeof result.score !== 'number' || 
        !Array.isArray(result.feedback?.correct) || 
        !Array.isArray(result.feedback?.missing) || 
        !Array.isArray(result.feedback?.wrong)) {
      throw new Error('Format de réponse invalide de l\'API OpenAI');
    }

    if (isTitle) {
      result.score = result.isCorrect ? 10 : 0;
    } else {
      result.score = Math.min(Math.max(Math.round(result.score), 0), 10);
      result.isCorrect = result.score >= 7;
    }

    if (!isTitle) {
      result.feedback.missing = result.feedback.missing.map((suggestion: string) => 
        suggestion.startsWith('Pensez à') || suggestion.startsWith('N\'oubliez pas') 
          ? suggestion 
          : `Pensez à ${suggestion.toLowerCase()}`
      );

      result.feedback.wrong = result.feedback.wrong.map((point: string) =>
        point.startsWith('Revoyez') || point.startsWith('Clarifiez')
          ? point
          : `Revoyez ${point.toLowerCase()}`
      );
    }

    return result;
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw error;
  }
}

export async function evaluateOpenEndedAnswer(userAnswer: string, referenceAnswer: string) {
  // Version temporaire sans OpenAI pour les tests
  const simplifiedEvaluation = {
    isCorrect: true, // Pour les tests, on considère toutes les réponses comme correctes
    score: 8,
    feedback: {
      correct: ["✓ Votre explication est claire et bien structurée"],
      missing: [],
      wrong: []
    }
  };

  return simplifiedEvaluation;
}