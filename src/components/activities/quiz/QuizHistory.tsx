import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { BarChart2, RotateCcw, Trophy } from 'lucide-react';
import { types } from './types';

interface QuizHistoryProps {
  pathId: string;
  quizLevel: number;
  onStartNewQuiz: () => void;
}

export function QuizHistory({ pathId, quizLevel, onStartNewQuiz }: QuizHistoryProps) {
  const { user } = useAuth();
  const [lastResult, setLastResult] = useState<{
    score: { correct: number; total: number };
    completedAt: string;
    results: types.QuizResult[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLastResult();
  }, [user, pathId, quizLevel]);

  const loadLastResult = async () => {
    if (!user) return;

    try {
      const resultsQuery = query(
        collection(db, 'quizResults'),
        where('userId', '==', user.uid),
        where('pathId', '==', pathId),
        where('quizLevel', '==', quizLevel),
        orderBy('completedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(resultsQuery);
      if (!snapshot.empty) {
        const resultData = snapshot.docs[0].data();
        setLastResult({
          score: resultData.score,
          completedAt: resultData.completedAt,
          results: resultData.results
        });
      }
    } catch (error) {
      console.error('Error loading quiz history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">Chargement de l'historique...</p>
      </div>
    );
  }

  if (!lastResult) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">Aucun historique disponible pour ce quiz.</p>
        <button
          onClick={onStartNewQuiz}
          className="mt-4 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
        >
          Commencer le quiz
        </button>
      </div>
    );
  }

  const completedDate = new Date(lastResult.completedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-gold" />
          </div>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Dernier résultat</h3>
            <p className="text-gray-600 mb-2">
              Complété le {completedDate}
            </p>
            <div className="text-4xl font-bold text-gold mb-4">
              {Math.round((lastResult.score.correct / lastResult.score.total) * 100)}%
            </div>
            <p className="text-gray-600">
              {lastResult.score.correct} réponses correctes sur {lastResult.score.total} questions
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onStartNewQuiz}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Refaire le quiz
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-start gap-4 mb-6">
          <BarChart2 className="w-6 h-6 text-gold flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold">Statistiques détaillées</h3>
            <p className="text-gray-600">Analyse de votre dernière tentative</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {lastResult.score.correct}
              </div>
              <div className="text-sm text-gray-600">Réponses correctes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {lastResult.score.total - lastResult.score.correct}
              </div>
              <div className="text-sm text-gray-600">Réponses incorrectes</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progression</span>
              <span>{Math.round((lastResult.score.correct / lastResult.score.total) * 100)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${(lastResult.score.correct / lastResult.score.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}