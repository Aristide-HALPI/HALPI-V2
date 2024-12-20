import { Upload, AlertCircle } from 'lucide-react';

interface FilesSectionProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  validationError: { message: string; type: 'format' | 'content' | 'structure' } | null;
}

export default function FilesSection({ onFileUpload, validationError }: FilesSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8">
      <h3 className="text-lg font-semibold mb-6">Import des questions</h3>

      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Format du fichier CSV :</h4>
          <p className="text-blue-800 mb-4">
            Le fichier CSV doit contenir les colonnes suivantes, séparées par des virgules :
          </p>
          <div className="bg-blue-100 p-3 rounded font-mono text-sm text-blue-900">
            concept,explanation,questions,answers
          </div>
          <ul className="mt-4 list-disc pl-6 space-y-2 text-blue-800">
            <li>Les questions multiples doivent être séparées par des points-virgules</li>
            <li>Les réponses doivent correspondre aux questions dans l'ordre</li>
            <li>Utilisez des guillemets pour les champs contenant des virgules</li>
          </ul>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gold transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={onFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-gray-600">
              Cliquez pour importer votre fichier CSV
            </span>
          </label>
        </div>

        {validationError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Erreur de validation</p>
              <p className="text-sm">{validationError.message}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}