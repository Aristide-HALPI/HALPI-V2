import { Brain } from 'lucide-react';

export function Introduction() {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8">
      <div className="flex items-start gap-4">
        <div className="bg-gold/10 p-3 rounded-lg">
          <Brain className="w-8 h-8 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Évaluer pour apprendre</h2>
          <p className="text-gray-600 mb-6">
            Dans cette activité, vous allez générer des questions clés pour chaque concept important 
            de votre chapitre. Cette approche vous permet de renforcer votre compréhension tout en 
            préparant efficacement vos futures révisions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Pourquoi c'est efficace ?</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Renforce la mémorisation active</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Développe votre esprit critique</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Identifie les points essentiels</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Qu'est-ce qu'une question clé ?</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Cible un concept spécifique</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Teste la compréhension profonde</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Encourage la réflexion analytique</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Inclut un feedback explicatif</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}