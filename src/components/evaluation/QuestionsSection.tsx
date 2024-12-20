import { Save, Trash2, ArrowRight } from 'lucide-react';

interface ConceptData {
  concept: string;
  explanation: string;
  questions: string[];
  answers: string[];
}

interface QuestionsSectionProps {
  conceptsData: ConceptData[];
  onDeleteQuestion: (conceptIndex: number, questionIndex: number) => void;
  onSave: () => void;
  onComplete: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

export default function QuestionsSection({
  conceptsData,
  onDeleteQuestion,
  onSave,
  onComplete,
  saveStatus
}: QuestionsSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Questions importées</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={onSave}
            disabled={saveStatus !== 'idle'}
            className="flex items-center gap-2 px-4 py-2 text-gold hover:text-gold/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Enregistrement...' : 
             saveStatus === 'saved' ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Terminer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {conceptsData.map((concept, conceptIndex) => (
          <div key={conceptIndex} className="border rounded-lg p-6">
            <h4 className="font-medium text-lg mb-2">{concept.concept}</h4>
            <p className="text-gray-600 mb-4">{concept.explanation}</p>

            <div className="space-y-4">
              {concept.questions.map((question, questionIndex) => (
                <div key={questionIndex} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium mb-2">Question {questionIndex + 1}</p>
                      <p className="text-gray-700">{question}</p>
                      <p className="text-gray-600 mt-2">
                        <span className="font-medium">Réponse :</span>{' '}
                        {concept.answers[questionIndex]}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteQuestion(conceptIndex, questionIndex)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}