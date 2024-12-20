import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LearningPath, Phase, Step } from '../types/learningPath';

function createPhases(chapters: any[]): Phase[] {
  // S'assurer que nous avons des chapitres valides
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return [];
  }

  // Créer les phases avec les chapitres correspondants
  return [
    {
      id: 'phase1',
      title: 'Phase 1 : (Re)prise de contact avec le savoir',
      description: 'Lecture des chapitres, prise de notes et identification des concepts clés',
      chapters: chapters.map((chapter, index) => ({
        id: chapter.id,
        number: index + 1,
        title: chapter.title,
        steps: [
          {
            id: `lecture-${chapter.id}`,
            title: 'Lecture',
            completed: false,
            chapterId: chapter.id
          },
          {
            id: `notes-${chapter.id}`,
            title: 'Prise de notes',
            completed: false,
            chapterId: chapter.id
          },
          {
            id: `concepts-${chapter.id}`,
            title: 'Concepts clés',
            completed: false,
            chapterId: chapter.id
          }
        ]
      }))
    },
    {
      id: 'phase2',
      title: 'Phase 2 : Comprendre le savoir',
      description: 'Approfondissement et compréhension des concepts clés',
      chapters: chapters.map((chapter, index) => ({
        id: chapter.id,
        number: index + 1,
        title: chapter.title,
        steps: [
          {
            id: `concepts2-${chapter.id}`,
            title: 'Concepts clés - activité 2',
            completed: false,
            chapterId: chapter.id
          },
          {
            id: `rappel-${chapter.id}`,
            title: 'Rappel structuré',
            completed: false,
            chapterId: chapter.id
          },
          {
            id: `evaluation-${chapter.id}`,
            title: 'Évaluer pour apprendre',
            completed: false,
            chapterId: chapter.id
          }
        ]
      }))
    },
    {
      id: 'phase3',
      title: 'Phase 3 : Quiz',
      description: 'Évaluation des connaissances acquises',
      steps: [
        {
          id: 'quiz-intro',
          title: 'Préparation des quiz',
          completed: false
        },
        {
          id: 'quiz1',
          title: 'Quiz 1',
          completed: false
        },
        {
          id: 'quiz2',
          title: 'Quiz 2',
          completed: false
        },
        {
          id: 'quiz3',
          title: 'Quiz 3',
          completed: false
        }
      ]
    }
  ];
}

export async function createLearningPath(courseId: string, userId: string, chapters: any[]) {
  try {
    // Chercher d'abord si un parcours existe déjà pour ce cours
    const q = query(
      collection(db, 'learningPaths'),
      where('courseId', '==', courseId),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const phases = createPhases(chapters);
    const now = new Date().toISOString();

    if (!querySnapshot.empty) {
      // Mettre à jour le parcours existant
      const existingPath = querySnapshot.docs[0];
      await updateDoc(doc(db, 'learningPaths', existingPath.id), {
        phases,
        updatedAt: now
      });
      return { ...existingPath.data(), id: existingPath.id, phases };
    } else {
      // Créer un nouveau parcours
      const learningPath: Omit<LearningPath, 'id'> = {
        courseId,
        userId,
        phases,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'learningPaths'), learningPath);
      return { ...learningPath, id: docRef.id };
    }
  } catch (error) {
    console.error('Error creating/updating learning path:', error);
    throw error;
  }
}