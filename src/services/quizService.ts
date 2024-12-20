import { collection, addDoc, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { QuizQuestionUpdated as QuizQuestion } from '../types/quiz';
import { MockAIService } from './mockAIService';

const mockAI = new MockAIService();

// Définir le type DifficultyLevel localement puisqu'il n'est pas exporté
type DifficultyLevel = 'level_1' | 'level_2' | 'level_3';

interface QuestionData {
  question: string;
  type: string;
  options: string[];
  correctAnswer: string;
  feedback: string;
  explanation: string;
  conceptId: string;
  courseId: string;
  chapterId: string;
  userId: string;
  pathId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  difficultyLevel: DifficultyLevel;
  points: number;
  aspect: string;
  concept: {
    id: string;
    name: string;
    what: string;
    explanation: string; // Ajout du champ explanation
  };
  [key: string]: any; // Index signature pour permettre l'accès dynamique
}

export async function generateQuestionsForConcept(
  courseId: string,
  userId: string,
  conceptId: string,
  pathId: string
): Promise<QuizQuestion[]> {
  try {
    console.log('Starting question generation for concept:', conceptId);
    
    // Récupérer les informations du concept
    const conceptDoc = await getDoc(doc(db, 'concepts', conceptId));
    if (!conceptDoc.exists()) {
      console.error('Concept not found:', conceptId);
      throw new Error('Concept not found');
    }

    const conceptData = conceptDoc.data();
    console.log('Concept data:', {
      id: conceptId,
      name: conceptData.name,
      what: conceptData.what,
      how: conceptData.how,
      why: conceptData.why,
      who: conceptData.who,
      when: conceptData.when,
      where: conceptData.where,
      keyPoints: conceptData.keyPoints
    });
    
    // Récupérer les questions clés existantes pour le concept
    const keyQuestionsQuery = query(
      collection(db, 'keyQuestions'),
      where('conceptId', '==', conceptId),
      where('userId', '==', userId)
    );
    const keyQuestionsSnapshot = await getDocs(keyQuestionsQuery);
    const keyQuestions = keyQuestionsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    console.log('Found key questions:', keyQuestions.length);

    console.log('Preparing to call mockAI.generateQuizQuestions');
    // Utiliser le service MockAI pour générer les questions
    const conceptForAI = {
      id: conceptId,
      name: conceptData.name,
      what: conceptData.what,
      how: conceptData.how,
      why: conceptData.why,
      who: conceptData.who,
      when: conceptData.when,
      where: conceptData.where,
      keyPoints: conceptData.keyPoints,
      userId: conceptData.userId,
      chapterId: conceptData.chapterId,
      createdAt: conceptData.createdAt,
      customFields: conceptData.customFields || [],
      ...conceptData
    };
    console.log('Calling mockAI with concept:', conceptForAI);
    
    const questions = await mockAI.generateQuizQuestions(conceptForAI);
    console.log('Generated questions from MockAI:', questions.length);

    // Ajouter les métadonnées nécessaires à chaque question
    const formattedQuestions = questions.map(question => ({
      ...question,
      courseId,
      userId,
      pathId,
      conceptId,
      chapterId: conceptData.chapterId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      concept: {
        id: conceptId,
        name: conceptData.name,
        what: conceptData.what,
        explanation: conceptData.explanation || 'Pas d\'explication disponible'
      }
    }));

    console.log('Formatted questions:', formattedQuestions.length);
    return formattedQuestions;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

export async function saveQuestionsToDatabase(
  questions: QuizQuestion[],
  userId: string,
  courseId: string,
  pathId: string
): Promise<QuizQuestion[]> {
  try {
    // 1. Regrouper les questions par conceptId
    const questionsByConceptId = questions.reduce((acc, question) => {
      const conceptId = question.conceptId;
      if (!acc[conceptId]) acc[conceptId] = [];
      acc[conceptId].push(question);
      return acc;
    }, {} as Record<string, QuizQuestion[]>);

    // 2. Pour chaque concept, supprimer ses anciennes questions et ajouter les nouvelles
    const savedQuestions: QuizQuestion[] = [];
    for (const [conceptId, conceptQuestions] of Object.entries(questionsByConceptId)) {
      // 2.1 Supprimer les anciennes questions de ce concept
      const existingQuestionsQuery = query(
        collection(db, 'quizQuestions'),
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        where('conceptId', '==', conceptId)
      );
      
      const existingQuestionsSnapshot = await getDocs(existingQuestionsQuery);
      const deletePromises = existingQuestionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 2.2 Ajouter les nouvelles questions
      for (const question of conceptQuestions) {
        const questionData: QuestionData = {
          // Données de base de la question
          question: question.question,
          type: question.type,
          options: question.options || [],
          correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer.join(';') : question.correctAnswer || '',
          feedback: question.feedback || '',
          explanation: question.explanation || '',
          
          // Propriétés spécifiques au type de question
          ...(question.pairs && { pairs: question.pairs }),
          ...(question.items && { items: question.items }),
          ...(question.assertion && { assertion: question.assertion }),
          ...(question.reason && { reason: question.reason }),
          ...(question.matrix && { matrix: question.matrix }),
          ...(question.evaluationCriteria && { evaluationCriteria: question.evaluationCriteria }),
          
          // Métadonnées
          conceptId: question.conceptId,
          courseId,
          userId,
          pathId,
          chapterId: (question as any).chapterId || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,

          // Informations sur la difficulté et les points
          difficultyLevel: question.difficultyLevel as DifficultyLevel, // Ne plus utiliser de valeur par défaut
          points: question.points || 1,
          aspect: question.aspect || 'what',

          // Informations sur le concept
          concept: {
            id: question.conceptId || '',
            name: (question as any).concept?.name || 'Concept sans nom',
            what: (question as any).concept?.what || '',
            explanation: (question as any).concept?.explanation || 'Pas d\'explication disponible'
          }
        };

        // Vérifier que toutes les propriétés nécessaires sont présentes selon le type
        validateQuestionData(questionData);

        // Sauvegarder dans la collection quizQuestions
        const docRef = await addDoc(collection(db, 'quizQuestions'), questionData);
        savedQuestions.push({
          ...question,
          id: docRef.id
        });
      }
    }

    return savedQuestions;
  } catch (error) {
    console.error('Error saving questions:', error);
    throw error;
  }
}

// Fonction pour valider les données de la question selon son type
function validateQuestionData(questionData: QuestionData) {
  const { type } = questionData;

  // Vérification des champs de base obligatoires
  const baseRequiredFields = ['question', 'type', 'conceptId'];
  const missingBaseFields = baseRequiredFields.filter(field => !questionData[field]);
  
  if (missingBaseFields.length > 0) {
    throw new Error(`Missing required fields for question: ${missingBaseFields.join(', ')}`);
  }

  // Transformer les structures de données pour Firebase
  if (questionData.matrix) {
    // Convertir la matrice en chaîne JSON
    questionData.matrixData = JSON.stringify(questionData.matrix);
    delete questionData.matrix;
  }

  if (questionData.evaluationCriteria && Array.isArray(questionData.evaluationCriteria)) {
    // Convertir les critères d'évaluation en chaîne JSON
    questionData.evaluationCriteriaData = JSON.stringify(questionData.evaluationCriteria);
    delete questionData.evaluationCriteria;
  }

  // Vérification de correctAnswer selon le type
  const openEndedTypes = ['open_ended', 'open_short', 'open_long', 'case_study', 'true_false_justify'];
  if (!openEndedTypes.includes(type)) {
    if (!questionData.correctAnswer) {
      questionData.correctAnswer = 'default_answer';
    }
  } else {
    // Pour les questions ouvertes, on met une réponse par défaut
    questionData.correctAnswer = 'open_ended_response';
  }

  switch (type) {
    case 'mcq_single':
    case 'mcq_multiple':
    case 'multiple_choice':
      if (!questionData.options || !Array.isArray(questionData.options)) {
        questionData.options = ['Option 1', 'Option 2', 'Option 3'];
      }
      break;

    case 'matching':
      if (questionData.pairs) {
        // Convertir les paires en format compatible avec Firebase
        questionData.pairsData = JSON.stringify(questionData.pairs);
        delete questionData.pairs;
      }
      break;

    case 'matrix':
      // Déjà géré plus haut
      break;

    case 'ordering':
      if (questionData.items) {
        questionData.itemsData = JSON.stringify(questionData.items);
        delete questionData.items;
      }
      if (questionData.correctOrder) {
        questionData.correctOrderData = JSON.stringify(questionData.correctOrder);
        delete questionData.correctOrder;
      }
      break;
  }

  return questionData;
}

export async function getQuizQuestions(courseId: string, userId: string): Promise<QuizQuestion[]> {
  try {
    const questionsQuery = query(
      collection(db, 'quizQuestions'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const questionsSnapshot = await getDocs(questionsQuery);
    return questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizQuestion));
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    throw error;
  }
}

export async function evaluateQuizAnswer(userAnswer: string, question: QuizQuestion): Promise<{ 
  isCorrect: boolean; 
  score: number;
  feedback: string;
  evaluation?: {
    criteria: string[];
    scores: number[];
    totalScore: number;
    feedback: string;
  };
}> {
  try {
    const questionType = question.type;
    const defaultFeedback = "Réponse évaluée";

    const evaluateWithRubric = () => {
      const criteria = question.evaluationCriteria || [];
      const scores = criteria.map(() => 5); // Score par défaut pour chaque critère
      const totalScore = scores.reduce((a, b) => a + b, 0);
      
      return {
        isCorrect: totalScore >= (question.points / 2),
        score: totalScore,
        feedback: defaultFeedback,
        evaluation: {
          criteria,
          scores,
          totalScore,
          feedback: defaultFeedback
        }
      };
    };

    if (['matching', 'ordering'].includes(questionType)) {
      const isCorrect = userAnswer === question.correctAnswer;
      return {
        isCorrect,
        score: isCorrect ? question.points : 0,
        feedback: question.feedback || defaultFeedback
      };
    }

    if (['multiple_choice', 'mcq_single'].includes(questionType)) {
      const isCorrect = userAnswer === question.correctAnswer;
      return {
        isCorrect,
        score: isCorrect ? question.points : 0,
        feedback: question.feedback || defaultFeedback
      };
    }

    if (['mcq_multiple'].includes(questionType)) {
      const userAnswers = userAnswer.split(',').map(a => a.trim());
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];
      
      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every(answer => correctAnswers.includes(answer));
      
      return {
        isCorrect,
        score: isCorrect ? question.points : 0,
        feedback: question.feedback || defaultFeedback
      };
    }

    if (['true_false', 'true_false_justify'].includes(questionType)) {
      // S'assurer que correctAnswer est une chaîne
      const correctAnswer = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer[0] 
        : question.correctAnswer;
        
      const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
      return {
        isCorrect,
        score: isCorrect ? question.points : 0,
        feedback: question.feedback || defaultFeedback
      };
    }

    if (['fill_blank', 'fill_blank_complex', 'fill_in_blank'].includes(questionType)) {
      // Utiliser correctAnswer au lieu de expectedAnswers
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];

      const userAnswers = userAnswer.toLowerCase().split(',').map(a => a.trim());

      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every((answer, index) => correctAnswers[index].toLowerCase() === answer);

      return {
        isCorrect,
        score: isCorrect ? question.points : 0,
        feedback: question.feedback || defaultFeedback
      };
    }

    if (['open_short', 'open_long', 'case_study', 'open_ended'].includes(questionType)) {
      return evaluateWithRubric();
    }

    throw new Error(`Unsupported question type: ${questionType}`);
  } catch (error) {
    console.error('Error evaluating answer:', error);
    throw error;
  }
}

export async function deleteQuestions(questionIds: string[]) {
  try {
    // Supprimer les questions de la collection quizQuestions
    const deletePromises = questionIds.map(id => 
      deleteDoc(doc(db, 'quizQuestions', id))
    );
    
    // Attendre que toutes les suppressions soient terminées
    await Promise.all(deletePromises);
    
    console.log(`Successfully deleted ${questionIds.length} quiz questions`);
  } catch (error) {
    console.error('Error deleting questions:', error);
    throw error;
  }
}

// Fonction pour supprimer toutes les questions de quiz d'un cours
export async function deleteAllQuizQuestions(courseId: string, userId: string): Promise<void> {
  try {
    // Récupérer toutes les questions de quiz pour ce cours et cet utilisateur
    const questionsQuery = query(
      collection(db, 'quizQuestions'),
      where('courseId', '==', courseId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(questionsQuery);
    
    // Supprimer chaque document de question
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error('Error deleting quiz questions:', error);
    throw error;
  }
}