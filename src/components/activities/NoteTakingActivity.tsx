import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, FileText } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface NoteTakingActivityProps {
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

export default function NoteTakingActivity({ data }: NoteTakingActivityProps) {
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

  const handleStartNotes = () => {
    window.open('https://docs.google.com/document/d/1X5vuSm8piiUwnsoYlyTt28inijWNTBvj7-jGWTUSmSQ/edit?usp=sharing', '_blank');
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
            <h1 className="text-2xl font-bold">Prise de notes - Méthode Cornell</h1>
          </div>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isCompleting ? 'Finalisation...' : 'Terminer la prise de notes'}
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Explication de la méthode Cornell */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-bold mb-6">La méthode Cornell</h3>
            
            <div className="prose prose-sm">
              <p>
                La méthode Cornell est une technique de prise de notes structurée, développée par Walter Pauk de l'université Cornell,
                qui facilite l'organisation des idées, la révision et la mémorisation.
              </p>

              <h4 className="font-bold mt-6 mb-3">1. Principe général</h4>
              <p>
                La méthode Cornell divise la page en différentes sections, chacune dédiée à un rôle précis dans la prise de notes
                et la révision. Elle repose sur une structure visuelle claire et encourage un apprentissage actif.
              </p>

              <h4 className="font-bold mt-6 mb-3">2. Organisation de la page</h4>
              <p>La page est divisée en trois parties principales :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Colonne de gauche : Questions/sujets-clés (30% de la largeur de la page)</li>
                <li>Colonne de droite : Notes principales (70% de la largeur de la page)</li>
                <li>Bas de la page : Résumé (environ 5-6 lignes)</li>
              </ul>

              <div className="my-6">
                <img 
                  src="https://cdn.shopify.com/s/files/1/0066/5482/0388/files/Pinterest_-_blog_6_ef48eee9-c0dd-463b-aa5f-d88dbc416e77_480x480.png?v=1707295840" 
                  alt="Schéma méthode Cornell" 
                  className="mx-auto max-w-full h-auto rounded-lg shadow-md"
                />
              </div>

              <h4 className="font-bold mt-6 mb-3">3. Avantages</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Structuration claire des informations</li>
                <li>Révision facilitée grâce aux questions et résumés</li>
                <li>Apprentissage actif par la reformulation</li>
                <li>Méthode adaptable à tout type de contenu</li>
              </ul>

              <p className="mt-6 text-gray-600">
                Pour plus d'informations sur la méthode Cornell, vous pouvez regarder{' '}
                <a 
                  href="https://www.youtube.com/watch?v=Yn-gTD-05x4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-gold/90 underline"
                >
                  cette vidéo explicative
                </a>.
              </p>
            </div>
          </section>

          {/* Instructions pour le Google Docs */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-bold mb-6">Commencer la prise de notes</h3>
            
            <div className="space-y-4 text-gray-600 mb-8">
              <p>
                Pour faciliter votre prise de notes, nous avons préparé un modèle Google Docs
                avec la structure Cornell déjà en place.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Conseils pour une prise de notes efficace :</h4>
                <ol className="list-decimal pl-6 space-y-2 text-blue-800">
                  <li>Essayez d'abord de compléter la page sans regarder le cours, en vous basant sur vos souvenirs de lecture</li>
                  <li>Relisez ensuite le cours pour compléter et améliorer vos notes</li>
                  <li>Concentrez-vous sur la compréhension plutôt que sur la quantité d'informations</li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md mt-4">
                <h4 className="font-medium text-yellow-900 mb-2">Pour utiliser le modèle :</h4>
                <ol className="list-decimal pl-6 space-y-2 text-yellow-900">
                  <li>Cliquez sur le bouton ci-dessous pour ouvrir le modèle</li>
                  <li>Faites une copie du document (Menu Fichier → Créer une copie)</li>
                  <li>Renommez votre copie avec le nom du chapitre</li>
                  <li>Une fois terminé, revenez ici et cliquez sur "Terminer"</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              {chapterUrl && (
                <a
                  href={chapterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Ouvrir le chapitre
                </a>
              )}
              <button
                onClick={handleStartNotes}
                className="px-6 py-3 bg-gold text-white rounded-md hover:bg-gold/90 transition-colors flex items-center"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Ouvrir le modèle de prise de notes
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}