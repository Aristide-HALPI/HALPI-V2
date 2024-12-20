import { Pencil, Trash2 } from 'lucide-react';
import { type ConceptListProps } from './types';

export function ConceptList({ concepts, onEdit, onDelete }: ConceptListProps) {
  return (
    <div className="space-y-4">
      {concepts.map((concept, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{concept.concept}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(index)}
                className="p-2 text-gray-500 hover:text-gold transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(index)}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-600">{concept.vulgarisation}</p>
        </div>
      ))}
    </div>
  );
}