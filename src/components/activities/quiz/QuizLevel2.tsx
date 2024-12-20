import { useState, useEffect } from 'react';
import { Brain, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { QuizHistory } from './QuizHistory';

interface QuizLevel2Props {
  onStart: () => void;
  pathId: string;
}

export function QuizLevel2({ onStart, pathId }: QuizLevel2Props) {
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
      // 1. Récupérer tous les chapitres du cours
      const pathDoc = await getDoc(doc(db, 'learningPaths', pathId));
      if (!pathDoc.exists()) return;
      
      const pathData = pathDoc.data();
      const courseId = pathData.courseId;
      
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (!courseDoc.exists()) return;
      
      const courseData = courseDoc.data();
      const chapterIds = courseData.chapters || [];

      // Vérifier s'il y a des questions de niveau 2 dans le cours
      const questionsQuery = query(
        collection(db, 'quizQuestions'),
        where('userId', '==', user.uid),
        where('courseId', '==', courseId),
        where('difficultyLevel', '==', 'level_2')
      );
      const snapshot = await getDocs(questionsQuery);
      
      setHasQuestions(!snapshot.empty);
      setQuestionsCount(snapshot.size);
    } catch (error) {
      console.error('Error checking questions:', error);
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
        where('quizLevel', '==', 2),
        where('completedAt', '!=', null)
      );
      const snapshot = await getDocs(resultsQuery);
      setHasHistory(!snapshot.empty);
    } catch (error) {
      console.error('Error checking quiz history:', error);
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
    return <QuizHistory pathId={pathId} quizLevel={2} onStartNewQuiz={onStart} />;
  }

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm p-8 border border-blue-100">
        <div className="flex items-start space-x-6">
          <div className="bg-blue-100 rounded-full p-3">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quiz Niveau 2 : Application et Compréhension</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Ce deuxième quiz évalue votre capacité à appliquer les concepts appris et à démontrer 
              une compréhension plus approfondie. Les questions sont plus complexes et nécessitent 
              une réflexion plus poussée.
            </p>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-50">
              <h4 className="font-semibold text-blue-900 mb-4">Informations sur le quiz :</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Questions d'application pratique</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Mise en situation et résolution de problèmes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Feedback détaillé pour chaque réponse</span>
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
                {questionsCount} questions de niveau 2 disponibles
              </h4>
              <p className="text-gray-600 mb-8">
                Vous êtes prêt à commencer le quiz. Prenez le temps d'analyser chaque question 
                et de réfléchir à l'application des concepts.
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
                Aucune question de niveau 2 disponible
              </h4>
              <p className="text-gray-600">
                Vous devez d'abord préparer les questions du quiz dans l'étape "Préparation des quiz".
                Assurez-vous d'avoir des questions de niveau 2 pour ce parcours.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}