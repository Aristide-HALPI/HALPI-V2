import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink } from 'lucide-react';

const GPT_URL = "https://chat.openai.com/g/g-67609345ab5c8191b727390d9748d1b9-halpi-concept-coach";

export function IntroductionPage({ onVersionSelect }: {
  onVersionSelect: (version: 'halpi' | 'gpt') => void;
}) {
  const navigate = useNavigate();

  const openGPT = () => {
    window.open(GPT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
          Retour
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8">
        <h1 className="text-3xl font-bold text-center">
          Concepts Clés : Activité 2
        </h1>
        
        <p className="text-lg text-gray-600 text-center max-w-2xl mb-8">
          Choisissez la version de l'activité que vous souhaitez utiliser
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button
            onClick={() => onVersionSelect('halpi')}
            className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-500"
          >
            <h2 className="text-xl font-semibold">HALPI Concepts Clés</h2>
            <p className="text-gray-600 text-center">
              Version classique de l'activité avec identification et explication des concepts
            </p>
          </button>

          <button
            onClick={openGPT}
            className="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-green-500 group"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">GPTs Concepts Clés</h2>
              <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <p className="text-gray-600 text-center">
              Assistant IA spécialisé pour l'identification et l'explication des concepts clés de votre cours
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
