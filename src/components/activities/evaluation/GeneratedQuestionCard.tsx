import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { KeyQuestion } from '../../../types/questions';

interface GeneratedQuestionCardProps {
  question: KeyQuestion;
  onDelete: () => void;
  onValidate: () => void;
}

export function GeneratedQuestionCard({ question, onDelete, onValidate }: GeneratedQuestionCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      {/* En-tête avec niveau et actions */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-sm ${
              question.level === 1 ? 'bg-green-100 text-green-800' :
              question.level === 2 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Niveau {question.level}
            </span>
          </div>
          <h4 className="font-medium">{question.question}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 p-1"
            title="Supprimer la question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
