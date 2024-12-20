import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { QuizPreparation } from './quiz/QuizPreparation';
import { QuizLevel1 } from './quiz/QuizLevel1';
import { QuizLevel2 } from './quiz/QuizLevel2';
import { QuizLevel3 } from './quiz/QuizLevel3';
import QuizContent from './quiz/QuizContent';
import { QuizStatistics } from './quiz/QuizStatistics';
import { types } from './quiz/types';

interface QuizActivityProps {
  data: {
    step: {
      id: string;
      title: string;
      completed: boolean;
    };
    phase: any;
    pathId: string;
    pathData: any;
  };
}

export default function QuizActivity({ data }: QuizActivityProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizState, setQuizState] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<types.QuizQuestion[]>([]);
  const [quizResults, setQuizResults] = useState<types.QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const getQuizLevel = (): 1 | 2 | 3 => {
    if (data.step.id.includes('quiz1')) return 1;
    if (data.step.id.includes('quiz2')) return 2;
    return 3;
  };

  const handleStartQuiz = () => {
    setQuizState('quiz');
  };

  const handleQuizComplete = async (
    finalScore: { correct: number; total: number },
    questions: types.QuizQuestion[],
    results: types.QuizResult[]
  ) => {
    try {
      setScore(finalScore);
      setQuizQuestions(questions);
      setQuizResults(results);
      setQuizState('results');

      if (!user) throw new Error('User not authenticated');

      const quizResultData = {
        userId: user.uid,
        pathId: data.pathId,
        quizLevel: getQuizLevel(),
        score: {
          correct: finalScore.correct,
          total: finalScore.total
        },
        results: results.map(r => ({
          questionId: r.questionId,
          isCorrect: r.isCorrect,
          userAnswer: r.userAnswer,
          timeTaken: r.timeTaken
        })),
        completedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'quizResults'), quizResultData);

      const pathRef = doc(db, 'learningPaths', data.pathId);
      const pathDoc = await getDoc(pathRef);
      
      if (pathDoc.exists()) {
        const pathData = pathDoc.data();
        const updatedPhases = pathData.phases.map((phase: any) => ({
          ...phase,
          steps: phase.steps?.map((step: any) => 
            step.id === data.step.id ? { ...step, completed: true } : step
          )
        }));

        await updateDoc(pathRef, { phases: updatedPhases });
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
      setError("Une erreur s'est produite lors de la sauvegarde des résultats");
    }
  };

  const handleComplete = () => {
    navigate(`/paths/${data.pathId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  const renderQuizContent = () => {
    if (data.step.id === 'quiz-intro') {
      return (
        <QuizPreparation
          onComplete={handleComplete}
          pathId={data.pathId}
        />
      );
    }

    if (quizState === 'intro') {
      switch (getQuizLevel()) {
        case 1:
          return <QuizLevel1 onStart={handleStartQuiz} pathId={data.pathId} />;
        case 2:
          return <QuizLevel2 onStart={handleStartQuiz} pathId={data.pathId} />;
        case 3:
          return <QuizLevel3 onStart={handleStartQuiz} pathId={data.pathId} />;
      }
    }

    if (quizState === 'quiz') {
      return (
        <QuizContent
          pathId={data.pathId}
          quizLevel={getQuizLevel()}
          onComplete={handleQuizComplete}
        />
      );
    }

    if (quizState === 'results' && score && quizQuestions.length > 0) {
      return (
        <QuizStatistics
          score={score}
          questions={quizQuestions}
          results={quizResults}
          onComplete={handleComplete}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/paths/${data.pathId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour au parcours
          </button>
          <h1 className="text-2xl font-bold">Quiz d'apprentissage</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {renderQuizContent()}
      </div>
    </div>
  );
}