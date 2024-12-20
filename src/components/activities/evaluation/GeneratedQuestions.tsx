import { useState } from 'react';
import { KeyQuestion } from '../../../types/questions';
import { saveKeyQuestion } from '../../../services/questionService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Save, Trash2 } from 'lucide-react';

interface GeneratedQuestionsProps {
  conceptId: string;
  conceptName: string;
  questions: KeyQuestion[];
  onQuestionSaved: (question: KeyQuestion) => void;
}

export default function GeneratedQuestions({
  conceptId,
  conceptName,
  questions,
  onQuestionSaved,
}: GeneratedQuestionsProps) {
  const { user } = useAuth();
  const [savingQuestions, setSavingQuestions] = useState<Record<string, boolean>>({});
  const [localQuestions, setLocalQuestions] = useState<KeyQuestion[]>(questions);

  const handleSaveQuestion = async (question: KeyQuestion) => {
    if (!user) {
      toast.error('Vous devez être connecté pour sauvegarder une question');
      return;
    }

    const questionId = question.id;
    if (savingQuestions[questionId]) {
      return;
    }

    setSavingQuestions(prev => ({
      ...prev,
      [questionId]: true
    }));

    try {
      // Préparer la question pour la sauvegarde
      const questionToSave: Omit<KeyQuestion, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'key_question',
        level: question.level,
        question: question.question,
        targetAspect: question.targetAspect,
        modelAnswer: question.modelAnswer,
        feedback: question.feedback,
        expectedAnswer: question.expectedAnswer,
        evaluationCriteria: question.evaluationCriteria,
        conceptId: question.conceptId
      };

      // Sauvegarder la question
      if (!user) throw new Error('User not authenticated');
      const savedQuestion = await saveKeyQuestion(user.uid, questionToSave);

      onQuestionSaved(savedQuestion);
      // Supprimer la question des questions générées après la sauvegarde
      setLocalQuestions(prev => prev.filter(q => q.id !== question.id));
      toast.success('Question sauvegardée avec succès !');
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Erreur lors de la sauvegarde de la question');
    } finally {
      setSavingQuestions(prev => {
        const newSavingQuestions = { ...prev };
        delete newSavingQuestions[questionId];
        return newSavingQuestions;
      });
    }
  };

  const handleDeleteGeneratedQuestion = (questionId: string) => {
    setLocalQuestions(prev => prev.filter(q => q.id !== questionId));
    toast.success('Question supprimée de la liste');
  };

  return (
    <div className="mt-4">
      <h4 className="font-medium text-lg mb-4">Questions générées pour {conceptName}</h4>
      <div className="space-y-4">
        {localQuestions.map((question) => (
          <div key={question.id} className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-800 flex-grow">{question.question}</p>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => handleSaveQuestion(question)}
                  className="flex items-center gap-1 text-gold hover:text-gold/80 transition-colors px-2 py-1"
                  disabled={savingQuestions[question.id]}
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">
                    {savingQuestions[question.id] ? 'Sauvegarde...' : 'Sauvegarder'}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteGeneratedQuestion(question.id)}
                  className="flex items-center text-red-500 hover:text-red-700 transition-colors px-2 py-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}