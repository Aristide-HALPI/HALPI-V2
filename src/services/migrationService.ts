import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QuizQuestion } from '../types/questions';

/**
 * Service pour gérer la migration des données entre les collections
 */
export class MigrationService {
  /**
   * Migre les questions de la collection 'questions' vers 'quizQuestions'
   */
  static async migrateQuestionsToQuizQuestions(userId: string): Promise<{
    migrated: number;
    errors: number;
  }> {
    let migrated = 0;
    let errors = 0;

    try {
      // 1. Récupérer toutes les questions de l'ancienne collection
      const questionsQuery = query(
        collection(db, 'questions'),
        where('userId', '==', userId)
      );
      const questionsSnapshot = await getDocs(questionsQuery);

      // 2. Pour chaque question, la migrer vers quizQuestions
      for (const doc of questionsSnapshot.docs) {
        try {
          const questionData = doc.data();
          
          // Préparer les données pour la nouvelle collection
          const newQuestionData: Partial<QuizQuestion> = {
            ...questionData,
            // S'assurer que tous les champs requis sont présents
            type: questionData.type || 'mcq_single',
            difficultyLevel: questionData.difficultyLevel || 'level_1',
            points: questionData.points || 1,
            feedback: questionData.feedback || '',
            explanation: questionData.explanation || '',
            createdAt: questionData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Ajouter à la nouvelle collection
          await addDoc(collection(db, 'quizQuestions'), newQuestionData);
          
          // Supprimer de l'ancienne collection
          await deleteDoc(doc.ref);
          
          migrated++;
        } catch (error) {
          console.error('Error migrating question:', error);
          errors++;
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error in migration process:', error);
      throw error;
    }
  }

  /**
   * Vérifie s'il reste des questions dans l'ancienne collection
   */
  static async checkRemainingQuestions(userId: string): Promise<number> {
    try {
      const questionsQuery = query(
        collection(db, 'questions'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(questionsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error checking remaining questions:', error);
      throw error;
    }
  }

  /**
   * Vérifie si la migration a réussi en comparant les nombres
   */
  static async verifyMigration(userId: string): Promise<{
    oldCollectionCount: number;
    newCollectionCount: number;
    success: boolean;
  }> {
    try {
      // Compter les questions dans l'ancienne collection
      const oldQuery = query(
        collection(db, 'questions'),
        where('userId', '==', userId)
      );
      const oldSnapshot = await getDocs(oldQuery);

      // Compter les questions dans la nouvelle collection
      const newQuery = query(
        collection(db, 'quizQuestions'),
        where('userId', '==', userId)
      );
      const newSnapshot = await getDocs(newQuery);

      return {
        oldCollectionCount: oldSnapshot.size,
        newCollectionCount: newSnapshot.size,
        success: oldSnapshot.size === 0 // La migration est réussie si l'ancienne collection est vide
      };
    } catch (error) {
      console.error('Error verifying migration:', error);
      throw error;
    }
  }
}
