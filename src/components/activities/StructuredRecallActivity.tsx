import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  BrainCircuit, 
  Lightbulb, 
  Youtube, 
  ArrowRight, 
  ListChecks, 
  ArrowDown, 
  MessageCircle, 
  Brain,
  Repeat,
  FileText
} from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface StructuredRecallActivityProps {
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

export default function StructuredRecallActivity({ data }: StructuredRecallActivityProps) {
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
            <h1 className="text-2xl font-bold">Rappel structuré</h1>
          </div>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isCompleting ? 'Finalisation...' : 'Terminer l\'exercice'}
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-bold mb-4">Exercice de rappel structuré</h3>
            <p className="text-gray-600 mb-6">
              Dans cet exercice, vous allez réexpliquer le chapitre de cours de la façon la plus claire possible,
              sans aide extérieure. Pour cela, vous pouvez utiliser deux techniques puissantes : le Mind Mapping
              ou la méthode Feynman.
            </p>
          </section>

          {/* Mind Mapping */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-start space-x-4 mb-6">
              <BrainCircuit className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-4">Technique 1 : Mind Mapping</h3>
                <p className="text-gray-600">
                  Une technique visuelle puissante pour cartographier vos connaissances et révéler
                  les connexions entre les différents concepts.
                </p>
              </div>
            </div>

            <div className="pl-12 space-y-8">
              {/* Étapes du Mind Mapping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center text-sm mr-2">1</span>
                    Préparation
                  </h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Prenez une feuille A4 en format paysage</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Préparez des stylos de différentes couleurs</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Gardez de l'espace pour les connexions</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center text-sm mr-2">2</span>
                    Structure centrale
                  </h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Écrivez le titre du chapitre au centre</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Dessinez une bulle ou une image représentative</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Utilisez des couleurs vives</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center text-sm mr-2">3</span>
                    Branches principales
                  </h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Identifiez les concepts majeurs</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Créez des branches épaisses et colorées</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Utilisez des mots-clés concis</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center text-sm mr-2">4</span>
                    Développement
                  </h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Ajoutez des sous-branches pour les détails</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Incluez des exemples et illustrations</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span>Créez des connexions entre les branches</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-4">Conseils pour un Mind Map efficace :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ul className="list-disc pl-6 space-y-2 text-blue-800">
                    <li>Un mot-clé par branche</li>
                    <li>Utilisez des images et symboles</li>
                    <li>Variez les couleurs par thème</li>
                    <li>Écrivez lisiblement</li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-2 text-blue-800">
                    <li>Gardez les branches organiques</li>
                    <li>Ajoutez des flèches de connexion</li>
                    <li>Numérotez si nécessaire</li>
                    <li>Laissez de l'espace pour évoluer</li>
                  </ul>
                </div>
              </div>

              <a
                href="https://www.youtube.com/watch?v=NRIrL7rgEfs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-gold hover:text-gold/90"
              >
                <Youtube className="w-5 h-5 mr-2" />
                La méthode du Mind Mapping expliquée par Fabien Olicard
              </a>
            </div>
          </section>

          {/* Méthode Feynman */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-start space-x-4 mb-6">
              <Lightbulb className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-4">Technique 2 : La méthode Feynman</h3>
                <p className="text-gray-600 mb-4">
                  La méthode Feynman est une technique d'apprentissage qui repose sur un principe simple : 
                  si vous ne pouvez pas expliquer quelque chose simplement, vous ne l'avez pas vraiment compris.
                </p>
              </div>
            </div>

            <div className="pl-12 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Les 5 étapes essentielles :</h4>
                <div className="space-y-6 mt-4">
                  <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                    <ListChecks className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">1. Identifier les concepts</h5>
                      <p className="text-gray-600">
                        Listez tous les concepts importants du chapitre que vous devez maîtriser.
                        Faites un inventaire complet sans rien oublier.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                    <ArrowDown className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">2. Structurer et ordonner</h5>
                      <p className="text-gray-600">
                        Organisez les concepts dans un ordre logique, du plus fondamental au plus complexe.
                        Identifiez les liens entre les différents concepts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">3. Expliquer une première fois</h5>
                      <p className="text-gray-600">
                        Expliquez chaque concept avec vos propres mots, comme si vous donniez un cours.
                        Identifiez les points où vous bloquez ou manquez de clarté.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                    <Brain className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">4. Simplifier au maximum</h5>
                      <p className="text-gray-600">
                        Réexpliquez chaque concept comme si vous parliez à un enfant de 8 ans.
                        Utilisez des analogies simples et un vocabulaire accessible.
                        Si vous n'y arrivez pas, c'est que vous devez encore approfondir votre compréhension.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                    <Repeat className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">5. Évaluer et améliorer</h5>
                      <p className="text-gray-600">
                        Identifiez les points où votre explication manque de clarté.
                        Retournez au cours pour approfondir ces aspects.
                        Recommencez l'explication jusqu'à être satisfait du résultat.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Conseils pour la simplification :</h4>
                <ul className="list-disc pl-6 space-y-2 text-blue-800">
                  <li>Évitez tout jargon technique</li>
                  <li>Utilisez des exemples de la vie quotidienne</li>
                  <li>Dessinez des schémas simples si nécessaire</li>
                  <li>Si vous bloquez, revenez à l'étape précédente</li>
                </ul>
              </div>

              <a
                href="https://www.youtube.com/watch?v=UUSmBMWk2sI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-gold hover:text-gold/90"
              >
                <Youtube className="w-5 h-5 mr-2" />
                La méthode Feynman expliquée par Fabien Olicard
              </a>
            </div>
          </section>

          {/* Instructions finales */}
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h4 className="font-semibold text-gray-900 mb-4">Pour réaliser l'exercice :</h4>
            <ol className="list-decimal pl-6 space-y-4 text-gray-600 mb-8">
              <li>Choisissez la technique qui vous convient le mieux</li>
              <li>Prenez une feuille de papier ou ouvrez votre logiciel préféré</li>
              <li>Travaillez sans consulter vos notes de cours</li>
              <li>Prenez le temps nécessaire pour structurer vos idées</li> <li>Une fois terminé, cliquez sur "Terminer l'exercice"</li>
            </ol>

            {chapterUrl && (
              <div className="flex justify-center gap-4 mb-8">
                <a
                  href={chapterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Ouvrir le chapitre
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}