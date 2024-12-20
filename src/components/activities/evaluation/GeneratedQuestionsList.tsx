import { KeyQuestion } from '../../../types/questions';
import { GeneratedQuestionCard } from './GeneratedQuestionCard';

interface GeneratedQuestionsListProps {
  questions: KeyQuestion[];
  onDeleteQuestion: (index: number) => void;
  onComplete: () => void;
}

export function GeneratedQuestionsList({ 
  questions,
  onDeleteQuestion,
  onComplete
}: GeneratedQuestionsListProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Aucune question générée pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec bouton de validation générale */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Questions importées</h3>
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Terminer
        </button>
      </div>

      {/* Liste des questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <GeneratedQuestionCard
            key={index}
            question={question}
            onDelete={() => onDeleteQuestion(index)}
            onValidate={() => {}} // Fonction vide car la sauvegarde est automatique
          />
        ))}
      </div>
    </div>
  );
}
