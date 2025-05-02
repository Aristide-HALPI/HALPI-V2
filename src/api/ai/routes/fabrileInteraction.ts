/**
 * Logique d'interaction avec l'API Fabrile pour différents types d'évaluations et feedbacks
 */
import { createThread, createThreadMessage } from './thread';

// Types d'interactions IA supportés dans HALPI
export type AIInteractionType = 
  // 1. Évaluation avec notation
  | 'concept_restitution'      // Évaluation de la restitution des concepts (activité 3)
  | 'concept_identification'   // Vérification de l'identification des concepts (activité 3)
  | 'quiz_evaluation'          // Évaluation des réponses aux quiz (futur)
  
  // 2. Feedback sans notation
  | 'note_feedback'            // Feedback sur les notes prises
  | 'mindmap_feedback'         // Feedback sur les cartes mentales (futur)
  
  // 3. Recommandations et progression
  | 'study_planning'           // Recommandations de planning d'étude
  | 'progress_report';         // Rapport de progression de l'apprenant

// Définition des prompts par type d'interaction
const AI_PROMPTS: Record<string, string> = {
  // 1. ÉVALUATIONS AVEC NOTATION
  concept_restitution: `
🤖 Agent IA HALPI – Activité 3 : Reconstitution des Concepts Clés (Mémorisation active)
🎯 Mission
Tu es HALPI Concepts Mémo+, une IA pédagogique spécialisée dans l'évaluation de la restitution de mémoire des cartes d'identité de concepts clés dans l'activité 3 du parcours HALPI.
Ton objectif est de comparer les réponses actuelles de l'étudiant avec ses cartes d'origine (créées en activité 2), puis d'attribuer une note par champ, une note globale sur 30, un feedback pédagogique par champ, et un commentaire global.

📚 Objectif pédagogique
Tester l'ancrage mémoriel actif de l'étudiant
Renforcer l'apprentissage par restitution sans support
Aider à corriger les oublis et imprécisions sans jamais donner la bonne réponse

⚙️ Fonctionnement
L'étudiant tente de reconstituer de mémoire les champs d'un concept clé.
Tu compares chaque champ renseigné avec la carte initiale (activité 2).
Tu évalues chaque champ sur 10, selon les critères définis ci-dessous.
Tu calcules une note globale sur 30.
Tu valides la carte uniquement si tous les champs renseignés ont une note ≥ 7/10.

📋 Évaluation par champ
🎯 Critères de notation
Critère | Sur | Description
Fidélité | 3.5 | L'idée correspond à la version d'origine
Contenu clé | 3.5 | Les éléments essentiels sont présents
Clarté | 3 | La formulation est compréhensible, structurée et logique

Chaque champ renseigné est noté sur 10, en te basant sur ces critères.

🔍 Types d'erreurs à identifier (obligatoires)
Dans chaque commentaire de champ, tu dois indiquer le type d'erreur parmi :
Erreur manifeste : idée fausse ou contradictoire
Inexactitude : contenu partiellement juste, flou ou imprécis
Manque d'information : oubli d'éléments importants
Champ non complété : réponse vide ou trop vague
Confusion entre concepts : amalgame avec une autre notion

💬 Commentaires pédagogiques
Tu dois fournir un feedback formateur par champ, sans jamais donner la bonne réponse. Utilise un ou plusieurs formats suivants :
✍️ Reformulation partielle
Rappelle une partie floue ou manquante
 Ex : "Tu évoques la lumière, mais tu oublies l'énergie chimique produite."
❓ Question de relance
Guide l'étudiant avec une question ciblée
 Ex : "Quel rôle ce concept joue-t-il dans le mécanisme décrit dans le chapitre ?"
💡 Indice ou piste indirecte
Donne un mot-clé, une étape ou une structure partielle
 Ex : "Tu avais mentionné deux phases distinctes dans ta fiche initiale…"
⛔ Tu ne dois jamais fournir directement la bonne réponse, même si le champ est totalement incorrect.

📊 Règles de validation
✅ Une carte est validée uniquement si tous les champs notés ont une note ≥ 7/10
❌ Si un seul champ < 7, la carte est non validée
Tu dois fournir un commentaire général de remédiation, avec encouragements

🧮 Calcul de la note globale (sur 30)
La note globale est obtenue en faisant la moyenne des notes sur 10 attribuées aux champs renseignés, puis en la multipliant par 3.
Étapes :
Additionne toutes les notes sur 10 des champs renseignés
Divise par le nombre de champs notés → moyenne sur 10
Multiplie cette moyenne par 3 → note finale sur 30
⚠️ N'inclus pas les champs non renseignés dans le calcul.

🧾 Format de sortie attendu

{
  "concept": "Équation chimique de la photosynthèse",
  "champs": {
    "Quoi": {
      "note_sur_10": 8,
      "type_erreur": "Inexactitude",
      "commentaire": "Tu restitues bien le principe, mais l'équation n'est pas complète. Quel réactif as-tu oublié ?"
    },
    "Pourquoi": {
      "note_sur_10": 6.5,
      "type_erreur": "Manque d'information",
      "commentaire": "Tu évoques l'utilité générale, mais oublies le lien énergétique. Revois l'impact dans la chaîne alimentaire."
    },
    "Comment": {
      "note_sur_10": 7.5,
      "type_erreur": null,
      "commentaire": "Bonne structure générale. Tu as bien différencié les deux phases, même si c'est un peu flou."
    }
  },
  "note_globale_sur_30": 21.9,
  "est_validee": false,
  "commentaire_general": "Tu as bien retenu les grandes idées, mais certains détails restent flous. Reprends la partie 'Pourquoi' avant de retenter."
}
`,
  
  concept_identification: `
Tu es un assistant pédagogique qui aide à identifier des concepts clés.
Compare la réponse de l'utilisateur avec le concept attendu et détermine si la réponse est correcte.
Prends en compte les variations orthographiques, les synonymes et les formulations alternatives.

Considère les points suivants dans ton évaluation :
1. Synonymes et termes équivalents
2. Variations orthographiques mineures
3. Formulations alternatives mais sémantiquement équivalentes
4. Présence des mots-clés essentiels

Réponds au format JSON avec les champs suivants:
{
  "isCorrect": (true/false), // true si la réponse est correcte, false sinon
  "similarity": (nombre entre 0 et 1 indiquant le degré de similarité),
  "feedback": "Commentaire sur la réponse" // Feedback constructif et encourageant
}
`,

  quiz_evaluation: `
Tu es un assistant pédagogique qui évalue les réponses aux quiz.
Compare les réponses de l'utilisateur avec les réponses correctes et évalue leur exactitude.

Réponds au format JSON avec les champs suivants:
{
  "score": (nombre entre 0 et 100),
  "feedback": "Commentaire général sur les réponses",
  "questionResults": [
    {
      "questionId": "id_de_la_question",
      "isCorrect": (true/false),
      "score": (nombre entre 0 et 100),
      "feedback": "Commentaire spécifique sur cette réponse"
    }
  ],
  "totalScore": (somme des scores),
  "maxPossibleScore": (somme des points maximum possibles)
}
`,

  // 2. FEEDBACK SANS NOTATION
  note_feedback: `
Tu es un assistant pédagogique qui fournit des retours constructifs sur les notes prises par l'apprenant.
Analyse les notes et suggère des améliorations sans attribuer de note.

Réponds au format JSON avec les champs suivants:
{
  "feedback": "Commentaire général sur les notes",
  "strengths": ["Point fort 1", "Point fort 2"],
  "improvements": ["Suggestion d'amélioration 1", "Suggestion d'amélioration 2"],
  "structure": "Commentaire sur la structure des notes",
  "completeness": "Commentaire sur l'exhaustivité des notes"
}
`,

  mindmap_feedback: `
Tu es un assistant pédagogique qui fournit des retours constructifs sur les cartes mentales créées par l'apprenant.
Analyse la structure, les connexions et la pertinence du contenu sans attribuer de note.

Réponds au format JSON avec les champs suivants:
{
  "feedback": "Commentaire général sur la carte mentale",
  "strengths": ["Point fort 1", "Point fort 2"],
  "improvements": ["Suggestion d'amélioration 1", "Suggestion d'amélioration 2"],
  "structure": "Commentaire sur la structure de la carte",
  "connections": "Commentaire sur les connexions entre les concepts"
}
`,

  // 3. RECOMMANDATIONS ET PROGRESSION
  study_planning: `
Tu es un assistant pédagogique qui recommande un planning d'étude personnalisé.
Analyse les performances passées, les objectifs et les contraintes de l'apprenant pour proposer un planning optimal.

Réponds au format JSON avec les champs suivants:
{
  "recommendation": "Recommandation générale",
  "planning": [
    {
      "day": "Jour de la semaine",
      "duration": "Durée recommandée en minutes",
      "focus": "Sujet ou compétence à travailler",
      "activities": ["Activité 1", "Activité 2"]
    }
  ],
  "priorities": ["Priorité 1", "Priorité 2"],
  "tips": ["Conseil 1", "Conseil 2"]
}
`,

  progress_report: `
Tu es un assistant pédagogique qui analyse la progression de l'apprenant.
Analyse les performances dans les différentes activités et identifie les forces, faiblesses et tendances.

Réponds au format JSON avec les champs suivants:
{
  "overview": "Vue d'ensemble de la progression",
  "strengths": ["Point fort 1", "Point fort 2"],
  "weaknesses": ["Point faible 1", "Point faible 2"],
  "trends": "Analyse des tendances de progression",
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "nextSteps": "Prochaines étapes suggérées"
}
`
};

/**
 * Extrait le contenu JSON d'une réponse markdown
 * @param content Contenu de la réponse
 * @returns Contenu JSON nettoyé
 */
const extractJsonFromMarkdown = (content: string): string => {
  // Extraire le JSON entre les balises ```json si présentes
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  let jsonContent = jsonMatch ? jsonMatch[1] : content;
 
  // Nettoyer le contenu avant le parsing
  jsonContent = jsonContent.trim();
 
  // Si le JSON est tronqué, essayons de le réparer
  try {
    JSON.parse(jsonContent);
    return jsonContent;
  } catch (e) {
    console.log('JSON tronqué, tentative de réparation...');
   
    // Compter les accolades/crochets ouvrants et fermants
    const openBraces = (jsonContent.match(/{/g) || []).length;
    const closeBraces = (jsonContent.match(/}/g) || []).length;
    const openBrackets = (jsonContent.match(/\[/g) || []).length;
    const closeBrackets = (jsonContent.match(/]/g) || []).length;
   
    // Vérifier si le JSON est tronqué au milieu d'une propriété
    const lastChar = jsonContent.trim().slice(-1);
    if (lastChar === '"' || lastChar === ':' || lastChar === ',') {
      // Supprimer la dernière ligne incomplète
      jsonContent = jsonContent.replace(/,[^\]}]*$/, '');
    }
   
    // Ajouter les accolades/crochets manquants
    while (closeBrackets < openBrackets) {
      jsonContent += ']';
    }
    while (closeBraces < openBraces) {
      jsonContent += '}';
    }
   
    // Vérifier si le JSON est maintenant valide
    try {
      JSON.parse(jsonContent);
      console.log('JSON réparé avec succès');
      return jsonContent;
    } catch (e) {
      console.error('Impossible de réparer le JSON:', e);
      throw new Error('Format JSON invalide après tentative de réparation');
    }
  }
};

/**
 * Interagit avec l'IA Fabrile pour différents types d'évaluations et feedbacks
 * @param organizationId ID de l'organisation
 * @param content Contenu à évaluer ou analyser
 * @param type Type d'interaction avec l'IA
 * @param botId ID spécifique du bot à utiliser (optionnel)
 * @returns Réponse formatée de l'IA
 */
export async function interactWithAI(
  organizationId: string,
  content: string,
  type: AIInteractionType,
  botId?: string
) {
  try {
    // 1. Récupérer l'ID de l'agent depuis les variables d'environnement ou utiliser l'ID spécifique fourni
    let agentId = botId;
    
    // Si aucun ID spécifique n'est fourni, vérifier le type d'interaction
    if (!agentId) {
      // Vérifier si c'est un type qui utilise un algorithme local au lieu d'un bot
      if (type === 'concept_identification') {
        // Pour l'identification, on utilise un algorithme local, pas besoin d'ID de bot
        // On utilise un ID fictif pour éviter l'erreur
        agentId = 'algorithme_local';
        console.log('Utilisation de l\'algorithme local pour l\'identification des concepts');
      } else {
        // Table de correspondance des IDs de bots par type d'interaction
        const botIds: Record<string, string> = {
          'concept_restitution': import.meta.env.VITE_Restitution_BOT_ID || 'bot_CHnxzWJ59zu6W2gH7E9gb',
          'quiz_evaluation': import.meta.env.VITE_Quiz_BOT_ID || 'bot_CHnxzWJ59zu6W2gH7E9gb',
          'note_feedback': import.meta.env.VITE_Note_BOT_ID || 'bot_CHnxzWJ59zu6W2gH7E9gb',
          'mindmap_feedback': import.meta.env.VITE_Mindmap_BOT_ID || 'bot_CHnxzWJ59zu6W2gH7E9gb',
          'study_planning': import.meta.env.VITE_Planning_BOT_ID || 'bot_CHnxzWJ59zu6W2gH7E9gb',
          'progress_report': import.meta.env.VITE_Progress_BOT_ID || 'bot_CHnxzWJ59zu6W2gH7E9gb'
        };
        
        // Récupérer l'ID du bot pour ce type d'interaction
        agentId = botIds[type];
        
        if (agentId) {
          console.log(`Utilisation du bot spécifique pour ${type}:`, agentId);
        }
      }
    }
   
    if (!agentId) {
      console.error(`Aucun ID de bot trouvé pour le type d'interaction: ${type}`);
      throw new Error(`ID de bot Fabrile manquant pour le type d'interaction: ${type}`);
    }
    
    console.log(`Interaction avec le bot ID: ${agentId.substring(0, 5)}... (masqué pour sécurité)`);
   
    // 2. Préparer le prompt avec le contenu à évaluer
    const promptBase = AI_PROMPTS[type] || 'Veuillez analyser ce contenu:';
    const prompt = `${promptBase}\n\n${content}`;
   
    console.log(`Interaction IA de type: ${type}`);
   
    // 3. Créer un thread de conversation
    const threadResponse = await createThread(organizationId, agentId);
    const threadId = threadResponse.id;
   
    console.log(`Thread créé avec succès, ID: ${threadId}`);
   
    // 4. Envoyer le message au thread
    const result = await createThreadMessage(organizationId, threadId, prompt);
   
    console.log('Réponse reçue de l\'IA');
   
    // 5. Traiter la réponse
    try {
      // Extraire le JSON de la réponse
      const jsonContent = extractJsonFromMarkdown(result.completion.content);
      const jsonResponse = JSON.parse(jsonContent);
     
      console.log('Réponse parsée avec succès');
     
      // 6. Validation et transformation selon le type d'interaction
      switch (type) {
        case 'concept_identification':
          // Validation pour l'identification de concepts
          if (typeof jsonResponse.isCorrect !== 'boolean' || 
              typeof jsonResponse.similarity !== 'number' ||
              typeof jsonResponse.feedback !== 'string') {
            throw new Error('Réponse incomplète pour l\'identification de concept');
          }
          break;
          
        case 'concept_restitution':
          // Validation pour la restitution de concepts
          if (!jsonResponse.concept || !jsonResponse.champs || 
              typeof jsonResponse.note_globale_sur_30 !== 'number' || 
              typeof jsonResponse.est_validee !== 'boolean' ||
              typeof jsonResponse.commentaire_general !== 'string') {
            throw new Error('Réponse incomplète pour la restitution de concept');
          }
          break;
          
        case 'quiz_evaluation':
          // Validation pour l'évaluation de quiz
          if (typeof jsonResponse.score !== 'number' || 
              typeof jsonResponse.feedback !== 'string' ||
              !Array.isArray(jsonResponse.questionResults)) {
            throw new Error('Réponse incomplète pour l\'évaluation de quiz');
          }
          break;
          
        case 'note_feedback':
        case 'mindmap_feedback':
          // Validation pour les feedbacks sans notation
          if (typeof jsonResponse.feedback !== 'string' ||
              !Array.isArray(jsonResponse.strengths) ||
              !Array.isArray(jsonResponse.improvements)) {
            throw new Error('Réponse incomplète pour le feedback');
          }
          break;
          
        case 'study_planning':
        case 'progress_report':
          // Validation minimale pour les recommandations
          if (!jsonResponse) {
            throw new Error('Réponse vide pour les recommandations');
          }
          break;
      }
     
      return jsonResponse;
    } catch (error) {
      console.error('Erreur lors du parsing de la réponse:', error);
      console.error('Contenu de la réponse:', result.completion.content);
     
      // Réponse par défaut en cas d'erreur selon le type d'interaction
      switch (type) {
        case 'concept_identification':
          return {
            isCorrect: false,
            similarity: 0,
            feedback: "Une erreur est survenue lors de l'évaluation. Veuillez réessayer."
          };
          
        case 'concept_restitution':
          return {
            concept: "Erreur d'évaluation",
            champs: {},
            note_globale_sur_30: 0,
            est_validee: false,
            commentaire_general: "Une erreur est survenue lors de l'évaluation. Veuillez réessayer."
          };
          
        case 'quiz_evaluation':
          return {
            score: 0,
            feedback: "Une erreur est survenue lors de l'évaluation. Veuillez réessayer.",
            questionResults: [],
            totalScore: 0,
            maxPossibleScore: 0
          };
          
        case 'note_feedback':
        case 'mindmap_feedback':
          return {
            feedback: "Une erreur est survenue lors de l'analyse. Veuillez réessayer.",
            strengths: [],
            improvements: []
          };
          
        default:
          return {
            error: true,
            message: "Une erreur est survenue lors du traitement. Veuillez réessayer."
          };
      }
    }
  } catch (error) {
    console.error('Erreur dans interactWithAI:', error);
    throw error;
  }
}

// Pour la compatibilité avec le code existant
export async function evaluateExercise(
  organizationId: string,
  content: string,
  type: AIInteractionType
) {
  return interactWithAI(organizationId, content, type);
}
