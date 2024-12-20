import { AlertCircle } from 'lucide-react';

export default function IntroductionCard() {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold mb-4">Auto-évaluation des connaissances</h3>
          <p className="text-gray-600 mb-6">
            Cette activité vous permet d'évaluer votre compréhension du chapitre en créant vos propres questions
            et en y répondant. C'est une excellente façon de préparer les quiz à venir et d'identifier les points
            à revoir.
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Objectifs :</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Créer des questions pertinentes sur le contenu du chapitre</li>
                <li>Formuler des réponses détaillées et explicatives</li>
                <li>Identifier les points clés à retenir</li>
                <li>Préparer efficacement les quiz à venir</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}