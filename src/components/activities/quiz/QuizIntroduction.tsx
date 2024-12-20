import { useState } from 'react';
import { Brain, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { parseQuizCsv, saveQuizQuestions } from '../../../services/quizService';

interface QuizIntroductionProps {
  onComplete: () => Promise<void>;
  pathId: string;
}

export function QuizIntroduction({ onComplete, pathId }: QuizIntroductionProps) {
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questionsCount, setQuestionsCount] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadStatus('uploading');
    setErrorMessage(null);

    try {
      const text = await file.text();
      const questions = await parseQuizCsv(text);
      await saveQuizQuestions(user.uid, pathId, questions);
      
      setQuestionsCount(questions.length);
      setUploadStatus('success');
    } catch (error) {
      console.error('Error uploading quiz file:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
    }

    event.target.value = '';
  };

  const handleSaveQuestions = async () => {
    if (!user || questionsCount === 0) return;
    setIsCompleting(true);

    try {
      await onComplete();
    } catch (error) {
      console.error('Error saving questions:', error);
      setErrorMessage('Erreur lors de l\'enregistrement des questions');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm p-8 border border-blue-100">
        <div className="flex items-start space-x-6">
          <div className="bg-blue-100 rounded-full p-3">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Préparation des quiz</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Cette étape vous permet de préparer les questions qui seront utilisées dans les quiz.
              Suivez les instructions ci-dessous pour générer et importer vos questions.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-8">
        <h3 className="text-lg font-semibold mb-6">Import des questions</h3>
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-4">Format du fichier CSV :</h4>
            <p className="text-blue-800 mb-4">
              Le fichier CSV doit contenir les colonnes suivantes :
            </p>
            <div className="bg-blue-100 p-3 rounded font-mono text-sm text-blue-900">
              concept,concept_explanation,question_type,difficulty_level,question,correct_answer,options,feedback
            </div>
            <div className="mt-4">
              <h5 className="font-medium text-blue-900 mb-2">Types de questions supportés :</h5>
              <ul className="list-disc pl-6 space-y-2 text-blue-800">
                <li>true_false : Question Vrai/Faux</li>
                <li>mcq_single : QCM avec une seule bonne réponse</li>
                <li>mcq_multiple : QCM avec plusieurs bonnes réponses</li>
                <li>fill_blank : Texte à trou</li>
                <li>fill_blank_complex : Texte à trous multiples</li>
                <li>matching : Association de termes</li>
              </ul>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gold transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600">
                Cliquez pour importer votre fichier CSV
              </span>
            </label>
          </div>

          {uploadStatus === 'uploading' && (
            <p className="text-blue-600">Upload en cours...</p>
          )}

          {uploadStatus === 'success' && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg">
              {questionsCount} questions ont été importées avec succès !
            </div>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Erreur de validation</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="flex justify-center">
              <button
                onClick={handleSaveQuestions}
                disabled={isCompleting}
                className="px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {isCompleting ? 'Finalisation...' : 'Terminer la préparation'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}