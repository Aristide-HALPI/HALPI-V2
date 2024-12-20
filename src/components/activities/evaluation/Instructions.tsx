import { ExternalLink, FileText } from 'lucide-react';

interface InstructionsProps {
  chapterUrl: string | null;
  chapterId?: string;
}

export function Instructions({ chapterUrl, chapterId }: InstructionsProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8">
      <h4 className="font-semibold text-gray-900 mb-4">Instructions</h4>
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-4">Format du fichier CSV :</h5>
          <p className="text-blue-800 mb-4">
            Le fichier CSV doit contenir les colonnes suivantes, séparées par des virgules :
          </p>
          <div className="bg-blue-100 p-3 rounded font-mono text-sm text-blue-900">
            concept,explanation,questions,answers,feedbacks
          </div>
          <ul className="mt-4 list-disc pl-6 space-y-2 text-blue-800">
            <li>Utilisez des guillemets pour les champs contenant des virgules</li>
            <li>Séparez les questions multiples par des points-virgules</li>
            <li>Les réponses et feedbacks doivent correspondre aux questions dans l'ordre</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-6 rounded-lg">
          <h5 className="font-medium text-amber-900 mb-4">Prompt pour l'IA :</h5>
          <p className="text-amber-800 mb-4">
            Copiez ce prompt dans l'assistant IA avec votre chapitre et vos concepts clés :
          </p>
          <div className="bg-amber-100 p-4 rounded text-sm text-amber-900 whitespace-pre-wrap">
            Pour chaque concept clé fourni, génère des questions d'évaluation en suivant ce format CSV :
            concept,explanation,questions,answers,feedbacks

            Description des colonnes :
            - concept : Le titre du concept clé identifié dans le chapitre
            - explanation : L'explication complète du concept, généralement extraite directement du cours
            - questions : Les questions permettant de vérifier la compréhension du concept (séparées par des points-virgules)
            - answers : Les réponses correspondant à chaque question, dans le même ordre (séparées par des points-virgules)
            - feedbacks : Un feedback explicatif pour chaque question, dans le même ordre (séparés par des points-virgules)

            Assure-toi que :
            - Chaque concept a au moins 3 questions
            - Les questions testent différents niveaux de compréhension
            - Les réponses sont claires et précises
            - Chaque feedback explique pourquoi la réponse est correcte
            - Utilise des guillemets pour les champs contenant des virgules
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {chapterUrl && (
            <a
              href={chapterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
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
      </div>
    </section>
  );
}