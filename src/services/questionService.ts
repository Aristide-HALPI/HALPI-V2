import { collection, addDoc, doc, updateDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KeyQuestion } from '../types/questions';

export async function saveKeyQuestion(userId: string, question: Omit<KeyQuestion, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date().toISOString();
    const questionData = {
      ...question,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, 'keyQuestions'), {
      ...questionData,
      userId
    });

    return {
      id: docRef.id,
      ...questionData
    };
  } catch (error) {
    console.error('Error saving key question:', error);
    throw error;
  }
}

export async function updateKeyQuestion(questionId: string, updates: Partial<KeyQuestion>) {
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'keyQuestions', questionId), {
      ...updates,
      updatedAt: now
    });
  } catch (error) {
    console.error('Error updating key question:', error);
    throw error;
  }
}

export async function getKeyQuestionsForConcept(userId: string, conceptId: string): Promise<KeyQuestion[]> {
  try {
    const q = query(
      collection(db, 'keyQuestions'),
      where('userId', '==', userId),
      where('conceptId', '==', conceptId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as KeyQuestion));
  } catch (error) {
    console.error('Error loading key questions:', error);
    throw error;
  }
}

export async function deleteKeyQuestion(userId: string, conceptId: string, questionId: string) {
  try {
    await deleteDoc(doc(db, 'keyQuestions', questionId));
  } catch (error) {
    console.error('Error deleting key question:', error);
    throw error;
  }
}