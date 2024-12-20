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
            concept,question,answer,feedback
          </div>
          <ul className="mt-4 list-disc pl-6 space-y-2 text-blue-800">
            <li>Une ligne par question</li>
            <li>Utilisez des guillemets pour les champs contenant des virgules</li>
            <li>Le feedback doit expliquer pourquoi la réponse est correcte</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-6 rounded-lg">
          <h5 className="font-medium text-amber-900 mb-4">Prompt pour l'IA :</h5>
          <p className="text-amber-800 mb-4">
            Utilisez ce prompt avec l'assistant IA pour générer les questions :
          </p>
          <div className="bg-amber-100 p-3 rounded text-sm text-amber-900">
            Pour chaque concept clé du fichier CSV, génère des questions clés qui permettent de vérifier 
            la compréhension approfondie du concept. Le nombre de questions peut varier selon la complexité 
            du concept. Convertis le résultat en format CSV avec la structure suivante : concept,question,
            answer,feedback (utilise des guillemets pour chaque champ et la virgule comme séparateur).
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