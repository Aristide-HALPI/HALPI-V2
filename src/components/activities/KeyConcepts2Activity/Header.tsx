import { ChevronLeft } from 'lucide-react';
import { types } from './types';

export function Header({ navigate, isCompleting, evaluationError }: types.HeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/paths/${data.pathId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour au parcours
          </button>
          <h1 className="text-2xl font-bold">Concepts clés - Activité 2</h1>
        </div>
      </div>

      {evaluationError && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg">
          {evaluationError}
        </div>
      )}
    </>
  );
}