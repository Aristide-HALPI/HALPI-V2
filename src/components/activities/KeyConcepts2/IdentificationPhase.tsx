import { useState, useEffect } from 'react';
import { HelpCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { types } from './types';
import { evaluateConceptAnswer } from '../../../services/openaiService';

export function IdentificationPhase({
  concepts,
  foundConcepts,
  currentConceptIndex,
  setFoundConcepts,
  setCurrentConceptIndex,
  setPhase,
  saveProgress
}: types.IdentificationPhaseProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [showError, setShowError] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [allConceptsFound, setAllConceptsFound] = useState(false);

  useEffect(() => {
    setAllConceptsFound(foundConcepts.length === concepts.length);
  }, [foundConcepts, concepts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isEvaluating) return;
    setIsEvaluating(true);

    try {
      const currentConcept = concepts[currentConceptIndex];
      if (!currentConcept) {
        throw new Error('Concept non trouvé');
      }

      const result = await evaluateConceptAnswer(currentInput, currentConcept.concept, true);

      if (result.isCorrect) {
        const newFoundConcepts = [...foundConcepts, { concept: currentConcept.concept }];
        setFoundConcepts(newFoundConcepts);
        setCurrentInput('');
        setHintLevel(0);
        setShowError(false);

        await saveProgress();

        if (currentConceptIndex < concepts.length - 1) {
          setCurrentConceptIndex(currentConceptIndex + 1);
        }
      } else {
        setShowError(true);
        setTimeout(() => setShowError(false), 2000);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSkipToExplanation = async () => {
    if (!allConceptsFound) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }
    setPhase('explanation');
    await saveProgress();
  };

  const handleHint = () => {
    if (hintLevel < 4) {
      setHintLevel(prev => prev + 1);
    }
  };

  const createHint = (concept: string): string[] => {
    const words = concept.split(' ');
    return words.map(word => {
      const chars = word.split('');
      switch (hintLevel) {
        case 1:
          return chars[0] + '_'.repeat(chars.length - 1);
        case 2:
          return chars.length > 1
            ? chars[0] + '_'.repeat(chars.length - 2) + chars[chars.length - 1]
            : chars[0];
        case 3:
          return word;
        case 4:
          return word;
        default:
          return '_'.repeat(chars.length);
      }
    });
  };

  const currentConcept = concepts[currentConceptIndex];
  if (!currentConcept) return null;

  return (
    <>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Retrouvez les concepts clés</h3>
        <p className="text-gray-600">
          Retrouvez les titres des concepts clés identifiés lors de votre dernière session d'étude.
          Il y a {concepts.length} concepts à identifier.
        </p>
      </div>

      <div className="flex gap-8">
        <div className="flex-1">
          <div className="bg-gray-50 p-6 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Concept {currentConceptIndex + 1} sur {concepts.length}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Entrez le titre du concept"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    showError 
                      ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                      : 'border-gray-300 focus:ring-gold'
                  }`}
                />
                {showError && (
                  <p className="text-red-500 text-sm mt-1">
                    Ce n'est pas le bon concept. Essayez encore ou utilisez un indice.
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleHint}
                  className="text-gold hover:text-gold/90 flex items-center"
                  disabled={hintLevel >= 4}
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Indice {hintLevel > 0 ? `(${hintLevel}/4)` : ''}
                </button>
                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {isEvaluating ? 'Vérification...' : 'Valider'}
                </button>
              </div>
            </form>

            {hintLevel > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-blue-600 text-sm mb-2">
                  {hintLevel === 1 && "Première lettre de chaque mot"}
                  {hintLevel === 2 && "Première et dernière lettre de chaque mot"}
                  {hintLevel === 3 && "Un mot sur deux"}
                  {hintLevel === 4 && "Réponse complète"}
                </p>
                <div className="text-blue-800 font-mono space-y-2">
                  {createHint(currentConcept.concept).map((hint, index) => (
                    <div key={index} className="bg-blue-100 p-2 rounded">
                      {hint}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bouton pour passer à l'explication */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              onClick={handleSkipToExplanation}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                allConceptsFound
                  ? 'bg-gold text-white hover:bg-gold/90'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              Passer à l'explication
              <ArrowRight className="w-4 h-4" />
            </button>

            {showWarning && (
              <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Vous devez d'abord trouver tous les concepts clés avant de passer à l'exercice d'explication.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-96">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-4">Concepts trouvés</h4>
            <div className="space-y-3">
              {concepts.map((concept, index) => {
                const isFound = foundConcepts.some(fc => fc.concept === concept.concept);
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      isFound
                        ? 'bg-green-100 text-green-800'
                        : 'bg-white text-gray-400'
                    }`}
                  >
                    {isFound ? concept.concept : '...'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}