import { useState, useRef, useEffect } from 'react';
import { X, Plus, ChevronLeft } from 'lucide-react';
import { Concept } from '../../../types/concepts';

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface ConceptFormProps {
  onSubmit: (concept: Partial<Concept>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Concept>;
}

export function ConceptForm({ onSubmit, onCancel, initialData }: ConceptFormProps) {
  const [formData, setFormData] = useState<Partial<Concept>>(initialData || {
    name: '',
    who: '',
    what: '',
    why: '',
    how: '',
    when: '',
    where: '',
    keyPoints: '',
    illustration: '',
    illustrationExplanation: '',
    customFields: []
  });
  const [customFields, setCustomFields] = useState<CustomField[]>(
    initialData?.customFields || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: string[] = [];

    // Check if name is filled
    if (!formData.name?.trim()) {
      newErrors.push('Le nom du concept est requis');
    }

    // Check if at least one additional field is filled
    const hasAdditionalField = [
      formData.who,
      formData.what,
      formData.why,
      formData.how,
      formData.when,
      formData.where,
      formData.keyPoints,
      ...customFields.map(f => f.value)
    ].some(field => field?.trim());

    if (!hasAdditionalField) {
      newErrors.push('Au moins un champ supplémentaire doit être rempli');
    }

    // Check if illustration explanation is provided when there's an illustration
    if (formData.illustration && !formData.illustrationExplanation?.trim()) {
      newErrors.push('L\'explication du schéma est requise lorsqu\'une illustration est fournie');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        customFields: customFields
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCustomField = () => {
    setCustomFields(prev => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        label: '',
        value: ''
      }
    ]);
  };

  const updateCustomField = (id: string, field: Partial<CustomField>) => {
    setCustomFields(prev =>
      prev.map(f => (f.id === id ? { ...f, ...field } : f))
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        illustration: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour aux concepts
            </button>
            <h2 className="text-2xl font-bold">
              {initialData ? 'Modifier le concept' : 'Nouveau concept'}
            </h2>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg">
            <ul className="list-disc pl-4">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-900 mb-2">
                Nom du concept *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-gold"
                placeholder="Ex: La photosynthèse"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">
                  Qui ?
                </label>
                <textarea
                  value={formData.who}
                  onChange={e => setFormData(prev => ({ ...prev, who: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                  rows={4}
                  placeholder="Quels sont les acteurs impliqués ?"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">
                  Quoi ?
                </label>
                <textarea
                  value={formData.what}
                  onChange={e => setFormData(prev => ({ ...prev, what: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                  rows={4}
                  placeholder="Décrivez le concept en détail"
                />
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-lg font-medium text-gray-900 mb-2">
                Pourquoi ?
              </label>
              <textarea
                value={formData.why}
                onChange={e => setFormData(prev => ({ ...prev, why: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                rows={8}
                placeholder="Quelle est l'importance de ce concept ? Expliquez en détail son importance et ses implications."
              />
            </div>

            <div className="mt-8">
              <label className="block text-lg font-medium text-gray-900 mb-2">
                Comment ?
              </label>
              <textarea
                value={formData.how}
                onChange={e => setFormData(prev => ({ ...prev, how: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                rows={8}
                placeholder="Comment fonctionne ce concept ? Décrivez en détail son mécanisme ou son processus."
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">
                  Quand ?
                </label>
                <textarea
                  value={formData.when}
                  onChange={e => setFormData(prev => ({ ...prev, when: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                  rows={4}
                  placeholder="À quel moment ce concept intervient-il ? Y a-t-il des moments clés à retenir ?"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-2">
                  Où ?
                </label>
                <textarea
                  value={formData.where}
                  onChange={e => setFormData(prev => ({ ...prev, where: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                  rows={4}
                  placeholder="Dans quel contexte ou lieu ce concept s'applique-t-il ?"
                />
              </div>
            </div>

            <div className="mt-8">
              <label className="block text-lg font-medium text-gray-900 mb-2">
                Points essentiels à mémoriser
              </label>
              <textarea
                value={formData.keyPoints}
                onChange={e => setFormData(prev => ({ ...prev, keyPoints: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                rows={6}
                placeholder="Listez les éléments cruciaux à retenir absolument pour ce concept"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <label className="block text-lg font-medium text-gray-900 mb-4">
              Schémas / Illustrations
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gold cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Cliquez pour ajouter une image ou glissez-la ici
              </p>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG jusqu'à 10MB
              </p>
            </div>
            {formData.illustration && (
              <div className="mt-4">
                <img
                  src={formData.illustration}
                  alt="Preview"
                  className="max-h-64 rounded-lg mx-auto"
                />
              </div>
            )}

            <div className="mt-6">
              <label className="block text-lg font-medium text-gray-900 mb-2">
                Explication du schéma {formData.illustration && '*'}
              </label>
              <textarea
                value={formData.illustrationExplanation}
                onChange={e => setFormData(prev => ({ ...prev, illustrationExplanation: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold"
                rows={6}
                placeholder="Expliquez en détail ce que représente ce schéma et comment l'interpréter"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Champs personnalisés
              </h3>
              <button
                type="button"
                onClick={addCustomField}
                className="flex items-center gap-2 px-4 py-2 text-gold hover:bg-gold/10 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un champ
              </button>
            </div>

            <div className="space-y-6">
              {customFields.map((field) => (
                <div key={field.id} className="relative bg-gray-50 p-6 rounded-lg">
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du champ
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateCustomField(field.id, { label: e.target.value })
                        }
                        placeholder="Ex: Application pratique, Cas d'usage..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contenu
                      </label>
                      <textarea
                        value={field.value}
                        onChange={(e) =>
                          updateCustomField(field.id, { value: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                        placeholder="Décrivez le contenu de ce champ..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : initialData
                ? 'Mettre à jour'
                : 'Créer le concept'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}