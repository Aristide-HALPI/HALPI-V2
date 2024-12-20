import { useState } from 'react';
import { Pencil, Trash2, BookOpen, X } from 'lucide-react';
import { Concept } from '../../../types/concepts';

interface ConceptListProps {
  concepts: Concept[];
  onEdit: (concept: Concept) => void;
  onDelete: (conceptId: string) => void;
}

export function ConceptList({ concepts, onEdit, onDelete }: ConceptListProps) {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const getFilledFields = (concept: Concept) => {
    const fields = [
      { key: 'who', label: 'Qui ?' },
      { key: 'what', label: 'Quoi ?' },
      { key: 'why', label: 'Pourquoi ?' },
      { key: 'how', label: 'Comment ?' },
      { key: 'when', label: 'Quand ?' },
      { key: 'where', label: 'Où ?' },
      { key: 'keyPoints', label: 'Points clés' }
    ];

    // Filtrer les champs standards remplis
    const standardFields = fields.filter(field => concept[field.key as keyof Concept]);

    // Ajouter les champs personnalisés s'ils existent
    const customFields = concept.customFields?.map(field => ({
      key: `custom_${field.id}`,
      label: field.label,
      value: field.value
    })) || [];

    return {
      standardFields,
      customFields
    };
  };

  if (concepts.length === 0) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Aucun concept clé identifié
          </h3>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-8">
      <h3 className="text-lg font-semibold mb-6">Concepts identifiés</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {concepts.map((concept) => (
          <div 
            key={concept.id} 
            onClick={() => setSelectedConcept(concept)}
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group relative cursor-pointer"
          >
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(concept);
                }}
                className="p-1.5 bg-white rounded-md text-gray-500 hover:text-gold transition-colors shadow-sm"
                title="Modifier le concept"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(concept.id);
                }}
                className="p-1.5 bg-white rounded-md text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                title="Supprimer le concept"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h4 className="font-medium text-gray-900 pr-16">{concept.name}</h4>
          </div>
        ))}
      </div>

      {/* Modal d'affichage du concept */}
      {selectedConcept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{selectedConcept.name}</h3>
              <button
                onClick={() => setSelectedConcept(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Champs standards */}
              {getFilledFields(selectedConcept).standardFields.map(({ key, label }) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{label}</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedConcept[key as keyof Concept] as string}
                  </p>
                </div>
              ))}

              {/* Champs personnalisés */}
              {getFilledFields(selectedConcept).customFields.map(({ key, label, value }) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{label}</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}