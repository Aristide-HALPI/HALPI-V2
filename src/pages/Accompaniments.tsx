import { Brain, Target, MessageCircle, ExternalLink } from 'lucide-react';

export function Accompaniments() {
  const accompanimentTypes = [
    {
      id: 'initiation',
      title: 'Initiation à HALPI',
      description: 'Assistance pour bien prendre en main la plateforme et ses fonctionnalités.'
    },
    {
      id: 'strategy',
      title: 'Stratégie pédagogique',
      description: 'Conseils personnalisés pour choisir les techniques d\'apprentissage les plus efficaces en fonction de vos cours.'
    },
    {
      id: 'planning',
      title: 'Planification',
      description: 'Aide pour organiser et structurer vos révisions de manière optimale, en tenant compte de vos échéances et de votre emploi du temps.'
    },
    {
      id: 'revision',
      title: 'Suivi des révisions',
      description: 'Sessions courtes pour vous aider à surmonter les obstacles rencontrés pendant la période de révision.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Accompagnement</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Réserver une séance d'accompagnement</h2>
        <p className="text-gray-600 mb-8">
          Bénéficiez d'un accompagnement personnalisé avec l'équipe HALPI pour un soutien sur mesure dans vos études. 
          Chaque séance dure 15 minutes.
        </p>

        <div className="mb-8">
          <h3 className="font-semibold mb-4">Types d'accompagnement disponibles :</h3>
          <div className="space-y-4">
            {accompanimentTypes.map(type => (
              <div key={type.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">{type.title}</h4>
                  <p className="text-gray-600">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <ExternalLink className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Réserver un créneau</h3>
              <p className="text-blue-800 mb-4">
                Pour réserver une séance d'accompagnement, cliquez sur le lien ci-dessous pour accéder à notre calendrier de réservation.
              </p>
              <a
                href="https://calendly.com/aristide-halpi/accompagnement"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Accéder au calendrier de réservation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}