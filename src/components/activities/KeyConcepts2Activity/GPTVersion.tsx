import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink } from 'lucide-react';

const GPT_URL = "https://chat.openai.com/g/g-67609345ab5c8191b727390d9748d1b9-halpi-concept-coach";

export function GPTVersion() {
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
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">HALPI Concept Coach GPT</h1>
          <p className="text-gray-600 mb-8">
            Cliquez sur le bouton ci-dessous pour ouvrir le GPT spécialisé dans l'identification et l'explication des concepts clés.
          </p>
          <button
            onClick={openGPT}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Ouvrir HALPI Concept Coach</span>
            <ExternalLink className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
