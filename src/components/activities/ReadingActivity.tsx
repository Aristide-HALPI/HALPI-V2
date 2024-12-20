import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ReadingActivityProps {
  data: {
    step: {
      id: string;
      title: string;
      completed: boolean;
      chapterId?: string;
    };
    phase: any;
    pathId: string;
    pathData: any;
  };
}

export default function ReadingActivity({ data }: ReadingActivityProps) {
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);
  const [chapterUrl, setChapterUrl] = useState<string | null>(null);

  // Charger l'URL du chapitre au montage du composant
  useState(() => {
    async function loadChapterUrl() {
      if (!data.step.chapterId) return;

      try {
        const chapterDoc = await getDoc(doc(db, 'chapters', data.step.chapterId));
        if (chapterDoc.exists()) {
          setChapterUrl(chapterDoc.data().fileUrl);
        }
      } catch (error) {
        console.error('Error loading chapter:', error);
      }
    }

    loadChapterUrl();
  });

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      const pathRef = doc(db, 'learningPaths', data.pathId);
      const pathDoc = await getDoc(pathRef);
      
      if (!pathDoc.exists()) {
        throw new Error('Path not found');
      }

      const pathData = pathDoc.data();
      const updatedPhases = pathData.phases.map((phase: any) => {
        if (phase.chapters) {
          return {
            ...phase,
            chapters: phase.chapters.map((chapter: any) => ({
              ...chapter,
              steps: chapter.steps.map((step: any) => 
                step.id === data.step.id ? { ...step, completed: true } : step
              )
            }))
          };
        }
        return phase;
      });

      await updateDoc(pathRef, { phases: updatedPhases });
      navigate(`/paths/${data.pathId}`);
    } catch (error) {
      console.error('Error completing activity:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/paths/${data.pathId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour au parcours
            </button>
            <h1 className="text-2xl font-bold">Lecture du chapitre</h1>
          </div>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isCompleting ? 'Finalisation...' : 'Terminer la lecture'}
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Instructions */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-bold mb-6">Instructions</h2>
            <p className="text-gray-600 mb-6">
              La première activité consiste à lire attentivement le chapitre de cours. 
              Si vous avez des questions pendant votre lecture, n'hésitez pas à utiliser 
              l'assistant IA qui pourra vous aider à mieux comprendre le contenu.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">Assistant Précepteur</h3>
              <p className="text-blue-800 mb-4">
                L'assistant Précepteur est là pour vous aider à mieux comprendre le contenu du chapitre. 
                Vous pouvez lui poser des questions sur :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-blue-800">
                <li>Les concepts difficiles</li>
                <li>Les points qui nécessitent des clarifications</li>
                <li>Les liens avec d'autres notions du cours</li>
                <li>Des exemples concrets d'application</li>
              </ul>

              <div className="mt-6 bg-blue-100 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Pour utiliser l'assistant :</h4>
                <ol className="list-decimal pl-6 space-y-2 text-blue-800">
                  <li>Téléchargez d'abord le chapitre en PDF</li>
                  <li>Accédez à l'assistant via le bouton ci-dessous</li>
                  <li>Soumettez-lui le PDF du chapitre</li>
                  <li>Posez vos questions sur le contenu</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              {chapterUrl && (
                <a
                  href={chapterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Lire le chapitre
                </a>
              )}
              
              <a
                href="https://chat.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-gold text-gold rounded-lg hover:bg-gold/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Consulter l'assistant IA
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}