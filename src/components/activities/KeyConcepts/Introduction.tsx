import { Brain, FileText, Plus } from 'lucide-react';

interface IntroductionProps {
  onAddConcept: () => void;
  chapterUrl: string | null;
}

export function Introduction({ onAddConcept, chapterUrl }: IntroductionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
      <div className="flex items-start gap-4">
        <div className="bg-gold/10 p-3 rounded-lg">
          <Brain className="w-8 h-8 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Identifier les concepts clés</h2>
          <p className="text-gray-600 mb-6">
            Dans cet exercice, vous allez identifier et expliquer les concepts clés de votre chapitre.
            Pour chaque concept, vous devrez fournir une explication détaillée et structurée.
          </p>

          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="font-medium text-blue-900 mb-4">Qu'est-ce qu'un concept clé ?</h3>
            <p className="text-blue-800 mb-4">
              Un concept clé est une notion centrale qui résume une idée, un événement, un processus 
              ou une théorie essentielle à la compréhension du sujet. C'est un élément fondamental 
              autour duquel s'organisent les connaissances.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Caractéristiques</h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>Synthétise l'information importante</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>Relie différentes notions entre elles</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Objectifs</h4>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>Facilite la mémorisation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <span>Structure les connaissances</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {chapterUrl && (
              <a
                href={chapterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Ouvrir le chapitre
              </a>
            )}
            <button
              onClick={onAddConcept}
              className="flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ajouter un concept
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}