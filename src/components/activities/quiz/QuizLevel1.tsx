import { useState, useEffect } from 'react';
import { Brain, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { QuizHistory } from './QuizHistory';

interface QuestionDetails {
  id: string;
  question: string;
  chapterId: string;
  conceptId: string;
  type: string;
  createdAt: string;
}

interface QuizLevel1Props {
  onStart: () => void;
  pathId: string;
}

export function QuizLevel1({ onStart, pathId }: QuizLevel1Props) {
  const { user } = useAuth();
  const [hasQuestions, setHasQuestions] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    checkQuestions();
    checkHistory();
  }, [user, pathId]);

  const checkQuestions = async () => {
    if (!user || !pathId) return;

    try {
      // 1. Log des paramètres de recherche
      console.log('Recherche des questions avec :', JSON.stringify({
        userId: user.uid,
        pathId: pathId
      }, null, 2));

      // 2. Récupérer tous les chapitres du cours
      const pathDoc = await getDoc(doc(db, 'learningPaths', pathId));
      if (!pathDoc.exists()) {
        console.log('Parcours non trouvé :', pathId);
        return;
      }
      
      const pathData = pathDoc.data();
      const courseId = pathData.courseId;
      console.log('ID du cours :', courseId);
      console.log('Données du parcours :', JSON.stringify(pathData, null, 2));
      
      // Vérifier d'abord toutes les questions de niveau 1
      try {
        const allLevel1QuestionsQuery = query(
          collection(db, 'quizQuestions'),
          where('userId', '==', user.uid),
          where('courseId', '==', courseId),
          where('difficultyLevel', '==', 'level_1')
        );
        const allLevel1Snapshot = await getDocs(allLevel1QuestionsQuery);
        
        // Log détaillé des questions trouvées
        const questionsDetails: QuestionDetails[] = allLevel1Snapshot.docs.map(doc => ({
          id: doc.id,
          question: doc.data().question,
          chapterId: doc.data().chapterId,
          conceptId: doc.data().conceptId,
          type: doc.data().type,
          createdAt: doc.data().createdAt
        }));
        
        console.log('Détails des questions de niveau 1:', JSON.stringify(questionsDetails, null, 2));
        
        // Grouper les questions par chapitre pour voir la distribution
        const questionsByChapter: { [key: string]: QuestionDetails[] } = {};
        questionsDetails.forEach(q => {
          if (!questionsByChapter[q.chapterId]) {
            questionsByChapter[q.chapterId] = [];
          }
          questionsByChapter[q.chapterId].push(q);
        });
        
        console.log('Distribution des questions par chapitre:', JSON.stringify(questionsByChapter, null, 2));
        
        // Vérifier les potentiels doublons
        const uniqueQuestions = new Set(questionsDetails.map(q => q.question));
        console.log(`Nombre total de questions: ${questionsDetails.length}`);
        console.log(`Nombre de questions uniques: ${uniqueQuestions.size}`);
        
        console.log('Toutes les questions de niveau 1 dans la base de données :', JSON.stringify({
          count: allLevel1Snapshot.size,
          questions: allLevel1Snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        }, null, 2));
      } catch (error: unknown) {
        console.error('Erreur lors de la récupération des questions de niveau 1 :', error);
        if (error instanceof FirebaseError && error.code === 'failed-precondition') {
          console.error('Index manquant pour la requête. Veuillez vérifier la console Firebase pour créer l\'index.');
        }
      }

      // Vérifier les questions de l'utilisateur
      const userQuestionsQuery = query(
        collection(db, 'quizQuestions'),
        where('userId', '==', user.uid)
      );
      const userQuestionsSnapshot = await getDocs(userQuestionsQuery);
      console.log('Toutes les questions de l\'utilisateur :', JSON.stringify({
        count: userQuestionsSnapshot.size,
        questions: userQuestionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }, null, 2));

      // Récupérer les chapitres depuis les phases du path
      const phase1Chapters = pathData.phases[0].chapters || [];
      // Ne prenons que les chapitres de la phase 1 pour éviter les doublons
      console.log('Chapitres de la phase 1 :', JSON.stringify(phase1Chapters.map((ch: { id: string }) => ch.id), null, 2));

      // Vérifier les questions pour chaque chapitre
      let totalQuestions = 0;
      for (const chapter of phase1Chapters) {
        try {
          const questionsQuery = query(
            collection(db, 'quizQuestions'),
            where('userId', '==', user.uid),
            where('courseId', '==', courseId),
            where('difficultyLevel', '==', 'level_1'),
            where('chapterId', '==', chapter.id)
          );
          const snapshot = await getDocs(questionsQuery);
          console.log(`Questions pour le chapitre ${chapter.id} :`, JSON.stringify({
            chapterTitle: chapter.title,
            found: !snapshot.empty,
            count: snapshot.size,
            questions: snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          }, null, 2));
          totalQuestions += snapshot.size;
        } catch (error: unknown) {
          console.error(`Erreur lors de la récupération des questions pour le chapitre ${chapter.id} :`, error);
          if (error instanceof FirebaseError && error.code === 'failed-precondition') {
            console.error('Index manquant pour la requête. Veuillez vérifier la console Firebase pour créer l\'index.');
          }
        }
      }

      setHasQuestions(totalQuestions > 0);
      setQuestionsCount(totalQuestions);
    } catch (error: unknown) {
      console.error('Erreur lors de la vérification des questions :', error);
    } finally {
      setLoading(false);
    }
  };

  const checkHistory = async () => {
    if (!user || !pathId) return;

    try {
      const resultsQuery = query(
        collection(db, 'quizResults'),
        where('userId', '==', user.uid),
        where('pathId', '==', pathId),
        where('quizLevel', '==', 1),
        where('completedAt', '!=', null)
      );
      const snapshot = await getDocs(resultsQuery);
      setHasHistory(!snapshot.empty);
    } catch (error: unknown) {
      console.error('Erreur lors de la vérification de l\'historique du quiz :', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">Vérification des questions disponibles...</p>
      </div>
    );
  }

  if (hasHistory) {
    return <QuizHistory pathId={pathId} quizLevel={1} onStartNewQuiz={onStart} />;
  }

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm p-8 border border-blue-100">
        <div className="flex items-start space-x-6">
          <div className="bg-blue-100 rounded-full p-3">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quiz Niveau 1 : Rappel des connaissances</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Ce premier quiz va tester votre mémorisation des concepts de base. 
              Les questions sont conçues pour vérifier votre capacité à vous rappeler 
              des informations essentielles de vos chapitres.
            </p>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-50">
              <h4 className="font-semibold text-blue-900 mb-4">Informations sur le quiz :</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Questions simples de rappel direct</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Feedback immédiat après chaque réponse</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Score et analyse détaillée à la fin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          {hasQuestions ? (
            <>
              <h4 className="font-semibold text-gray-900 mb-4">
                {questionsCount} questions de niveau 1 disponibles
              </h4>
              <p className="text-gray-600 mb-8">
                Vous êtes prêt à commencer le quiz. Prenez votre temps pour répondre à chaque question.
              </p>
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
              >
                Commencer le quiz
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <h4 className="font-semibold text-gray-900 mb-4">
                Aucune question de niveau 1 disponible
              </h4>
              <p className="text-gray-600">
                Vous devez d'abord préparer les questions du quiz dans l'étape "Préparation des quiz".
                Assurez-vous d'avoir des questions de niveau 1 pour ce parcours.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}