import { useState } from 'react';
import { HelpCircle, Search } from 'lucide-react';
import { types } from './types';
import { normalizeText, levenshteinDistance } from '../../../utils/textUtils';

export function IdentificationPhase({
  concepts,
  foundConcepts,
  setFoundConcepts,
  setPhase,
  resetProgress
}: types.IdentificationPhaseProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTypo, setShowTypo] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentInput.trim()) return;

    const normalizedInput = normalizeText(currentInput);
    let foundMatch = false;

    // Vérifier chaque concept non trouvé
    const remainingConcepts = concepts.filter(
      (concept) => !foundConcepts.some((fc) => fc.concept === concept.concept)
    );

    for (const concept of remainingConcepts) {
      const normalizedConcept = normalizeText(concept.concept);
      const distance = levenshteinDistance(normalizedInput, normalizedConcept);
      const maxDistance = Math.floor(normalizedConcept.length * 0.3); // 30% de tolérance

      if (distance <= maxDistance) {
        const newFoundConcept: types.FoundConcept = {
          concept: concept.concept,
          isCorrect: true
        };
        
        const newFoundConcepts = [...foundConcepts, newFoundConcept];
        setFoundConcepts(newFoundConcepts);
        
        setCurrentInput('');
        setHintLevel(0);
        setShowError(false);
        setShowTypo(false);

        if (distance > 0) {
          setShowTypo(true);
          setTimeout(() => setShowTypo(false), 3000);
        }

        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      setShowError(true);
      setErrorMessage('Ce n\'est pas le bon concept. Essayez encore ou utilisez un indice.');
      setTimeout(() => {
        setShowError(false);
        setErrorMessage('');
      }, 2000);
    }
  };

  // Créer un indice basé sur le niveau
  const createHint = (word: string): string[] => {
    const words = word.split(' ');
    const hints: string[] = [];

    switch (hintLevel) {
      case 1: // Première lettre de chaque mot
        hints.push(words.map(w => w[0].toUpperCase() + '...').join(' '));
        break;
      case 2: // Première et dernière lettre
        hints.push(words.map(w => w[0].toUpperCase() + '...' + w[w.length - 1]).join(' '));
        break;
      case 3: // Toutes les consonnes
        hints.push(
          words
            .map(w =>
              w
                .split('')
                .map(c => ('aeiouAEIOU'.includes(c) ? '.' : c))
                .join('')
            )
            .join(' ')
        );
        break;
      case 4: // Mot complet
        hints.push(word);
        break;
    }

    return hints;
  };

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Phase d'identification</h1>
        <div className="p-6 bg-white rounded-lg shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-gold/10 p-2 rounded-lg">
              <Search className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Retrouvez les concepts clés</h2>
              <p className="text-gray-600">
                Dans cette phase, vous devez identifier les {concepts.length} concepts clés du chapitre. 
                Cette étape est cruciale car elle vous permet de :
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Objectifs</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Structurer votre compréhension du chapitre</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Identifier les notions essentielles</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Préparer l'approfondissement des concepts</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">Aide disponible</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Utilisez le bouton "Indice" pour obtenir des indices progressifs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Les fautes de frappe sont tolérées</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                  <span>Vous pouvez réessayer autant de fois que nécessaire</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Concepts trouvés ({foundConcepts.length}/{concepts.length})</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="concept" className="block text-sm font-medium text-gray-700 mb-1">
                  Entrez un concept
                </label>
                <input
                  type="text"
                  id="concept"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Tapez votre réponse ici..."
                />
              </div>

              {showError && (
                <div className="text-red-500 text-sm">{errorMessage}</div>
              )}

              {showTypo && (
                <div className="text-blue-500 text-sm">
                  Réponse acceptée malgré une faute de frappe !
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setHintLevel(prev => prev + 1)}
                    className="text-gold hover:text-gold/90 flex items-center"
                    disabled={hintLevel >= 4 || !concepts.some(concept => !foundConcepts.some(found => found.concept === concept.concept))}
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Indice {hintLevel > 0 ? `(${hintLevel}/4)` : ''}
                  </button>
                  {foundConcepts.length !== concepts.length && (
                    <button
                      onClick={() => resetProgress()}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                    >
                      Recommencer l'exercice
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 transition-colors"
                >
                  Valider
                </button>
              </div>
            </div>
          </form>

          {hintLevel > 0 && concepts.some(concept => !foundConcepts.some(found => found.concept === concept.concept)) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-blue-600 text-sm mb-2">
                {hintLevel === 1 && "Première lettre de chaque mot"}
                {hintLevel === 2 && "Première et dernière lettre"}
                {hintLevel === 3 && "Consonnes uniquement"}
                {hintLevel === 4 && "Réponse complète"}
              </p>
              <div className="text-blue-800 font-mono space-y-2">
                {createHint(concepts.find(concept => !foundConcepts.some(found => found.concept === concept.concept))!.concept).map((hint, index) => (
                  <div key={index} className="bg-blue-100 p-2 rounded">
                    {hint}
                  </div>
                ))}
              </div>
            </div>
          )}

          {foundConcepts.length > 0 && (
            <div className="mt-4 p-4 border-t">
              <h3 className="font-medium mb-2">Concepts trouvés :</h3>
              <div className="flex flex-wrap gap-2">
                {foundConcepts.map((fc, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                  >
                    {fc.concept}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {foundConcepts.length === concepts.length && (
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => resetProgress()}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
          >
            Recommencer l'exercice
          </button>
          <button
            onClick={() => setPhase('explanation')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
          >
            Passer à l'explication
          </button>
        </div>
      )}
    </div>
  );
}