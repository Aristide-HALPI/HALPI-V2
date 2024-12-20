import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { QuizQuestionUpdated as QuizQuestion, MatchingItem } from '../../../types/quiz';
import { evaluateQuizAnswer } from '../../../services/quizService';

interface QuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, isCorrect: boolean, userAnswer: string, timeTaken: number) => void;
  showFeedback?: boolean;
  canRetry?: boolean;
  onRetry?: () => void;
  onNext?: () => void;
}

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showFeedback,
  canRetry,
  onRetry,
  onNext
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());

  const baseQuestion: QuizQuestion = useMemo(() => ({
    ...question,
    type: question.type || 'multiple_choice', // Définir un type par défaut plus approprié
    explanation: question.concept?.explanation || '',
    points: question.points || 10,
    aspect: question.aspect || 'what',
    conceptId: question.concept?.id || ''
  }), [question]);

  const randomizedOptions = useMemo(() => {
    if (!question.options || !['multiple_choice', 'mcq_single', 'mcq_multiple'].includes(question.type)) return [];
    return [...question.options].sort(() => Math.random() - 0.5);
  }, [question.id, question.options, question.type]);

  useEffect(() => {
    setSelectedAnswer('');
    setIsCorrect(false);
  }, [question.id]);

  const handleSubmit = async () => {
    if (!selectedAnswer.trim()) return;

    const timeTaken = Date.now() - startTime;
    
    try {
      // S'assurer que question.id existe avant d'appeler evaluateQuizAnswer
      if (!question.id) {
        console.error('Question ID is missing');
        return;
      }

      const result = await evaluateQuizAnswer(selectedAnswer, baseQuestion);
      setIsCorrect(result.isCorrect);

      onAnswer(question.id, result.isCorrect, selectedAnswer, timeTaken);
    } catch (error) {
      console.error('Error evaluating answer:', error);
    }
  };

  const renderQuestion = () => {
    // Validation du type de question
    if (!question.type) {
      console.error('Question type is undefined:', question);
      return null;
    }

    // Afficher l'énoncé de la question
    const renderQuestionStatement = () => (
      <div className="mb-6 text-lg font-medium">
        {question.question}
      </div>
    );

    switch (question.type) {
      case 'true_false':
        return (
          <div className="space-y-4">
            {renderQuestionStatement()}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="true"
                  checked={selectedAnswer === 'true'}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="w-4 h-4 text-gold"
                  disabled={showFeedback}
                />
                <span>Vrai</span>
              </label>
              <label className="flex items-center gap-2 p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="false"
                  checked={selectedAnswer === 'false'}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="w-4 h-4 text-gold"
                  disabled={showFeedback}
                />
                <span>Faux</span>
              </label>
            </div>
          </div>
        );

      case 'true_false_justify':
        return (
          <div className="space-y-4">
            {renderQuestionStatement()}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-2 p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="true"
                  checked={selectedAnswer.split('|')[0] === 'true'}
                  onChange={(e) => setSelectedAnswer(`${e.target.value}|${selectedAnswer.split('|')[1] || ''}`)}
                  className="w-4 h-4 text-gold"
                  disabled={showFeedback}
                />
                <span>Vrai</span>
              </label>
              <label className="flex items-center gap-2 p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="false"
                  checked={selectedAnswer.split('|')[0] === 'false'}
                  onChange={(e) => setSelectedAnswer(`${e.target.value}|${selectedAnswer.split('|')[1] || ''}`)}
                  className="w-4 h-4 text-gold"
                  disabled={showFeedback}
                />
                <span>Faux</span>
              </label>
            </div>
            <div>
              <textarea
                value={selectedAnswer.split('|')[1] || ''}
                onChange={(e) => setSelectedAnswer(`${selectedAnswer.split('|')[0] || ''}|${e.target.value}`)}
                className="w-full h-32 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Justifiez votre réponse..."
                disabled={showFeedback}
              />
            </div>
          </div>
        );

      case 'multiple_choice':
      case 'mcq_single':
      case 'mcq_multiple':
        return (
          <div className="space-y-4">
            {renderQuestionStatement()}
            <div className="space-y-2">
              {randomizedOptions.map((option, index) => (
                <label key={index} className="flex items-center gap-2 p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                  {(question.type === 'mcq_multiple' || question.type === 'multiple_choice') ? (
                    <input
                      type="checkbox"
                      value={option}
                      checked={selectedAnswer.split(',').includes(option)}
                      onChange={(e) => {
                        const currentAnswers = selectedAnswer ? selectedAnswer.split(',') : [];
                        const newAnswers = e.target.checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter(a => a !== option);
                        setSelectedAnswer(newAnswers.join(','));
                      }}
                      className="w-4 h-4 text-gold"
                      disabled={showFeedback}
                    />
                  ) : (
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      className="w-4 h-4 text-gold"
                      disabled={showFeedback}
                    />
                  )}
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'fill_blank':
      case 'fill_blank_complex':
      case 'fill_in_blank':
        return (
          <div className="space-y-4">
            {renderQuestionStatement()}
            <div>
              <input
                type="text"
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Votre réponse..."
                disabled={showFeedback}
              />
            </div>
          </div>
        );

      case 'matching':
        const matchingItems = question.items as MatchingItem[];
        return (
          <div className="space-y-4">
            {renderQuestionStatement()}
            <div className="grid grid-cols-2 gap-8">
              {/* Colonne de gauche - Termes */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Termes</h3>
                <div className="space-y-2">
                  {matchingItems?.map((matchItem, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedAnswer.split(',')[index] 
                          ? 'bg-gold/10 border-gold' 
                          : 'bg-gray-50 border-transparent hover:border-gold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">{index + 1}.</span>
                        <span>{matchItem.left}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Colonne de droite - Définitions */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Définitions</h3>
                <div className="space-y-2">
                  {matchingItems?.map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">{index + 1}.</span>
                      <select
                        value={selectedAnswer.split(',')[index] || ''}
                        onChange={(e) => {
                          const answers = selectedAnswer ? selectedAnswer.split(',') : Array(matchingItems?.length || 0).fill('');
                          answers[index] = e.target.value;
                          setSelectedAnswer(answers.join(','));
                        }}
                        className={`w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold bg-white transition-colors ${
                          selectedAnswer.split(',')[index] 
                            ? 'border-gold bg-gold/10' 
                            : 'hover:bg-gray-50'
                        }`}
                        disabled={showFeedback}
                      >
                        <option value="">Choisissez la définition correspondante</option>
                        {matchingItems?.map((matchItem, i) => (
                          <option key={i} value={matchItem.right}>
                            {matchItem.right}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ordering':
        return (
          <div className="space-y-4">
            {renderQuestionStatement()}
            <div className="space-y-2">
              {(question.items as string[])?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={selectedAnswer.split(',')[index] || ''}
                    onChange={(e) => {
                      const answers = selectedAnswer ? selectedAnswer.split(',') : Array(question.items?.length || 0).fill('');
                      answers[index] = e.target.value;
                      setSelectedAnswer(answers.join(','));
                    }}
                    className="w-16 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    disabled={showFeedback}
                  >
                    <option value="">-</option>
                    {Array.from({ length: question.items?.length || 0 }).map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'open_short':
      case 'open_long':
      case 'case_study':
      case 'open_ended':
        return (
          <div className="space-y-4">
            {renderQuestionStatement()}
            <div>
              <textarea
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                className="w-full h-48 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="Votre réponse..."
                disabled={showFeedback}
              />
            </div>
          </div>
        );

      default:
        console.error('Unsupported question type:', question.type);
        return (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            Type de question non supporté
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{question.concept?.name || 'Question'}</h2>
          <span className="text-gray-500">
            Question {questionNumber} sur {totalQuestions}
          </span>
        </div>

        {renderQuestion()}

        <div className="mt-8 flex justify-between items-center">
          {showFeedback ? (
            <>
              <div className={`flex items-center gap-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-medium">
                  {isCorrect ? 'Bonne réponse !' : 'Ce n\'est pas la bonne réponse.'}
                </span>
              </div>
              <div className="flex gap-4">
                {!isCorrect && canRetry && (
                  <button
                    onClick={onRetry}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Réessayer
                  </button>
                )}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors"
                  >
                    Suivant
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer.trim()}
              className={`ml-auto px-6 py-2 rounded-lg transition-colors ${
                selectedAnswer.trim()
                  ? 'bg-gold text-white hover:bg-gold-dark'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Valider
            </button>
          )}
        </div>

        {showFeedback && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Explication</h4>
            <p className="text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}