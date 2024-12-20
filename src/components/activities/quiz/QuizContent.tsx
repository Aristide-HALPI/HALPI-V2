import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import QuizQuestion from './QuizQuestion';
import { QuizQuestion as IQuizQuestion, QuizResult } from '../../../types/questions';

interface QuizContentProps {
  pathId: string;
  quizLevel: 1 | 2 | 3;
  onComplete: (score: { correct: number; total: number }, questions: IQuizQuestion[], results: QuizResult[]) => void;
}

interface QuestionWithRetries {
  question: IQuizQuestion;
  retries: number;
  needsReinforcement: boolean;
}

export default function QuizContent({ pathId, quizLevel, onComplete }: QuizContentProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<IQuizQuestion[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<QuestionWithRetries[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionCorrect, setCurrentQuestionCorrect] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [user, pathId, quizLevel]);

  const loadQuestions = async () => {
    if (!user) return;

    try {
      // 1. Récupérer le courseId depuis le pathId
      const pathDoc = await getDoc(doc(db, 'learningPaths', pathId));
      if (!pathDoc.exists()) {
        setError('Parcours non trouvé');
        return;
      }
      const courseId = pathDoc.data().courseId;

      // 2. Récupérer les questions avec courseId
      const questionsQuery = query(
        collection(db, 'quizQuestions'),
        where('userId', '==', user.uid),
        where('courseId', '==', courseId),
        where('difficultyLevel', '==', `level_${quizLevel}`)
      );
      const snapshot = await getDocs(questionsQuery);
      
      if (!snapshot.empty) {
        const loadedQuestions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IQuizQuestion[];
        
        // Utilisation d'une Map pour regrouper les questions par conceptId
        const questionsByConcept = new Map<string, IQuizQuestion[]>();
        
        loadedQuestions.forEach(q => {
          const conceptId = q.concept?.id || 'unknown';
          if (!questionsByConcept.has(conceptId)) {
            questionsByConcept.set(conceptId, []);
          }
          questionsByConcept.get(conceptId)?.push(q);
        });

        const initialQuestions: QuestionWithRetries[] = [];
        questionsByConcept.forEach(conceptQuestions => {
          const shuffled = [...conceptQuestions].sort(() => Math.random() - 0.5);
          shuffled.slice(0, 5).forEach(q => {
            initialQuestions.push({
              question: q,
              retries: 0,
              needsReinforcement: false
            });
          });
        });

        setQuestions(loadedQuestions);
        setActiveQuestions(initialQuestions.sort(() => Math.random() - 0.5));
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setError("Erreur lors du chargement des questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string, isCorrect: boolean, userAnswer: string, timeTaken: number) => {
    const newResult: QuizResult = {
      questionId,
      isCorrect,
      userAnswer,
      timeTaken
    };

    setResults(prev => [...prev, newResult]);
    setShowFeedback(true);
    setCurrentQuestionCorrect(isCorrect);

    if (isCorrect) {
      setTimeout(() => {
        if (currentIndex < activeQuestions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowFeedback(false);
          setCurrentQuestionCorrect(false);
        } else {
          const finalResults = [...results, newResult];
          const score = {
            correct: finalResults.filter(r => r.isCorrect).length,
            total: finalResults.length
          };
          onComplete(score, questions, finalResults);
        }
      }, 1500);
    } else {
      const currentQuestion = activeQuestions[currentIndex];
      
      if (!currentQuestion.needsReinforcement) {
        currentQuestion.needsReinforcement = true;

        const sameConceptQuestions = questions.filter(q => 
          q.concept?.id === currentQuestion.question.concept?.id && 
          !activeQuestions.some(aq => aq.question.id === q.id)
        );

        if (sameConceptQuestions.length > 0) {
          const insertIndex = Math.min(currentIndex + 3, activeQuestions.length);
          const reinforcementQuestion = {
            question: sameConceptQuestions[0],
            retries: 0,
            needsReinforcement: false
          };

          const updatedQuestions = [...activeQuestions];
          updatedQuestions.splice(insertIndex, 0, reinforcementQuestion);
          setActiveQuestions(updatedQuestions);
        }
      }
    }
  };

  const handleRetry = () => {
    setShowFeedback(false);
  };

  const handleNext = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
      setCurrentQuestionCorrect(false);
    } else {
      const score = {
        correct: results.filter(r => r.isCorrect).length,
        total: results.length
      };
      onComplete(score, questions, results);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">Chargement des questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">Aucune question disponible pour ce quiz.</p>
      </div>
    );
  }

  return (
    <QuizQuestion
      question={activeQuestions[currentIndex].question}
      questionNumber={currentIndex + 1}
      totalQuestions={activeQuestions.length}
      onAnswer={handleAnswer}
      showFeedback={showFeedback}
      canRetry={!currentQuestionCorrect}
      onRetry={handleRetry}
      onNext={!currentQuestionCorrect ? handleNext : undefined}
    />
  );
}