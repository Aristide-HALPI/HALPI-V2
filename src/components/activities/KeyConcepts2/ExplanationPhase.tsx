import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown, Check, Loader2 } from 'lucide-react';
import { types } from './types';
import { evaluateConceptAnswer } from '../../../services/openaiService';

interface ExplanationPhaseProps {
  concepts: types.Concept[];
  foundConcepts: types.FoundConcept[];
  setFoundConcepts: (concepts: types.FoundConcept[]) => void;
  saveProgress: () => Promise<void>;
  handleComplete: () => Promise<void>;
  setPhase: (phase: 'identification' | 'explanation') => void;
}

export function ExplanationPhase({
  concepts,
  foundConcepts,
  setFoundConcepts,
  saveProgress,
  handleComplete,
  setPhase
}: ExplanationPhaseProps) {
  const [selectedConcept, setSelectedConcept] = useState<types.Concept | null>(null);
  const [expandedConcepts, setExpandedConcepts] = useState<Record<string, boolean>>({});
  const [validatedConcepts, setValidatedConcepts] = useState<types.ValidatedConcept[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, {
    score: number;
    feedback: {
      correct: string[];
      missing: string[];
      wrong: string[];
    };
  }>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatingField, setEvaluatingField] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Reset feedback when selecting a new concept
  useEffect(() => {
    if (selectedConcept) {
      setFeedback({});
      setCurrentAnswers({});
    }
  }, [selectedConcept]);

  // Logs pour le débogage
  useEffect(() => {
    console.log('Nombre de concepts validés:', validatedConcepts.length);
    console.log('Contenu des concepts validés:', validatedConcepts);
  }, [validatedConcepts]);

  const getConceptFields = (concept: types.Concept) => {
    const fields = [
      { key: 'who', label: 'Qui ?' },
      { key: 'what', label: 'Quoi ?' },
      { key: 'why', label: 'Pourquoi ?' },
      { key: 'how', label: 'Comment ?' },
      { key: 'when', label: 'Quand ?' },
      { key: 'where', label: 'Où ?' },
      { key: 'keyPoints', label: 'Points clés' }
    ];

    return fields.filter(field => concept[field.key as keyof types.Concept]);
  };

  const canValidateConcept = () => {
    if (!selectedConcept) return false;
    
    const fields = getConceptFields(selectedConcept);
    let allFieldsValid = true;
    
    for (const field of fields) {
      // Check if the field has an answer
      const hasAnswer = currentAnswers[field.key]?.trim().length > 0;
      // Check if the field has been evaluated
      const hasBeenEvaluated = !!feedback[field.key];
      // Check if the score is sufficient (7 or higher)
      const hasValidScore = feedback[field.key]?.score >= 7;
      
      if (!hasAnswer || !hasBeenEvaluated || !hasValidScore) {
        allFieldsValid = false;
        break;
      }
    }
    
    return allFieldsValid;
  };

  const handleResetConcept = () => {
    setCurrentAnswers({});
    setFeedback({});
  };

  const handleValidateConcept = async () => {
    if (!selectedConcept) return;
    
    // Double check validation conditions
    if (!canValidateConcept()) {
      console.log('Cannot validate concept - not all fields meet criteria');
      return;
    }
    
    console.log('Starting concept validation');
    setIsValidating(true);

    try {
      const fields = getConceptFields(selectedConcept);
      
      // Verify all fields one last time before validation
      const allFieldsValid = fields.every(field => {
        const score = feedback[field.key]?.score;
        console.log(`Field ${field.key} score: ${score}`);
        return score >= 7;
      });

      if (!allFieldsValid) {
        console.log('Validation stopped - some fields do not meet score criteria');
        return;
      }

      const validatedConcept: types.ValidatedConcept = {
        conceptId: selectedConcept.id,
        concept: selectedConcept.concept,
        fields: fields.map(field => ({
          key: field.key,
          label: field.label,
          userAnswer: currentAnswers[field.key],
          referenceAnswer: selectedConcept[field.key as keyof types.Concept] as string,
          score: feedback[field.key].score,
          feedback: feedback[field.key].feedback
        }))
      };

      console.log('Concept validated successfully:', validatedConcept);
      setValidatedConcepts(prev => [...prev, validatedConcept]);
      setSelectedConcept(null);
      setCurrentAnswers({});
      setFeedback({});
      await saveProgress();
    } catch (error) {
      console.error('Error during concept validation:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleEvaluate = async () => {
    if (!selectedConcept || isEvaluating) return;
    setIsEvaluating(true);

    try {
      const fields = getConceptFields(selectedConcept);
      const evaluations: Record<string, any> = {};
      let allFieldsEvaluated = true;

      for (const field of fields) {
        const userAnswer = currentAnswers[field.key];
        const referenceAnswer = selectedConcept[field.key as keyof types.Concept] as string;

        if (!userAnswer?.trim() || !referenceAnswer) {
          allFieldsEvaluated = false;
          continue;
        }

        setEvaluatingField(field.key);
        const result = await evaluateConceptAnswer(userAnswer, referenceAnswer);
        evaluations[field.key] = result;

        console.log(`Score pour ${field.key}:`, result.score);
        if (result.score < 7) {
          console.log(`❌ Champ ${field.key} invalide avec score ${result.score}`);
        } else {
          console.log(`✓ Champ ${field.key} valide avec score ${result.score}`);
        }
        setEvaluatingField(null);
      }

      if (!allFieldsEvaluated) {
        console.log('⚠️ Certains champs n\'ont pas été remplis ou évalués');
      }

      setFeedback(evaluations);
      await saveProgress();
    } catch (error) {
      console.error('Error evaluating concept:', error);
    } finally {
      setIsEvaluating(false);
      setEvaluatingField(null);
    }
  };

  const toggleConceptExpansion = (conceptId: string) => {
    setExpandedConcepts(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setPhase('identification')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à l'identification
        </button>
      </div>

      <div className="space-y-8">
        {/* Liste des concepts à expliquer */}
        <div className="grid grid-cols-3 gap-4">
          {foundConcepts
            .filter(fc => !validatedConcepts.some(vc => vc.concept === fc.concept))
            .map(fc => {
              const concept = concepts.find(c => c.concept === fc.concept);
              if (!concept) return null;

              return (
                <div
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedConcept?.id === concept.id
                      ? 'bg-gold/10 border-2 border-gold'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <h4 className="font-medium">{concept.concept}</h4>
                </div>
              );
            })}
        </div>

        {/* Formulaire d'explication */}
        {selectedConcept && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900 mb-6 text-xl">
              Expliquer : {selectedConcept.concept}
            </h3>

            <div className="space-y-8">
              {getConceptFields(selectedConcept).map(field => (
                <div key={field.key} className="space-y-4">
                  <label className="block font-medium text-gray-700 text-lg">
                    {field.label}
                  </label>
                  <textarea
                    value={currentAnswers[field.key] || ''}
                    onChange={e => setCurrentAnswers(prev => ({
                      ...prev,
                      [field.key]: e.target.value
                    }))}
                    className="w-full h-40 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold text-base"
                    placeholder={`Expliquez ${field.label.toLowerCase()}`}
                  />

                  {evaluatingField === field.key && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Évaluation en cours...</span>
                    </div>
                  )}

                  {feedback[field.key] && (
                    <div className={`p-4 rounded-lg ${
                      feedback[field.key].score >= 7 ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-medium text-lg">
                          Score : {feedback[field.key].score}/10
                        </p>
                      </div>

                      <div className="space-y-4">
                        {feedback[field.key].feedback.correct.length > 0 && (
                          <div className="bg-white/50 p-4 rounded-lg">
                            <p className="font-medium text-green-700 mb-2">Points corrects :</p>
                            <ul className="list-disc pl-6 space-y-2">
                              {feedback[field.key].feedback.correct.map((point, i) => (
                                <li key={i} className="text-green-600">{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback[field.key].feedback.missing.length > 0 && (
                          <div className="bg-white/50 p-4 rounded-lg">
                            <p className="font-medium text-amber-700 mb-2">Points manquants :</p>
                            <ul className="list-disc pl-6 space-y-2">
                              {feedback[field.key].feedback.missing.map((point, i) => (
                                <li key={i} className="text-amber-600">{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback[field.key].feedback.wrong.length > 0 && (
                          <div className="bg-white/50 p-4 rounded-lg">
                            <p className="font-medium text-red-700 mb-2">Points erronés :</p>
                            <ul className="list-disc pl-6 space-y-2">
                              {feedback[field.key].feedback.wrong.map((point, i) => (
                                <li key={i} className="text-red-600">{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback[field.key].score < 7 && (
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={() => {
                                setCurrentAnswers(prev => ({
                                  ...prev,
                                  [field.key]: ''
                                }));
                                setFeedback(prev => {
                                  const newFeedback = { ...prev };
                                  delete newFeedback[field.key];
                                  return newFeedback;
                                });
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Réessayer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="flex-1 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Évaluation en cours...
                    </>
                  ) : (
                    'Évaluer les réponses'
                  )}
                </button>

                {Object.keys(feedback).length > 0 && Object.values(feedback).some(f => f.score < 7) && (
                  <button
                    onClick={handleResetConcept}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg flex items-center justify-center gap-2"
                  >
                    Réessayer tout
                  </button>
                )}

                {canValidateConcept() && (
                  <button
                    onClick={handleValidateConcept}
                    disabled={isValidating}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Validation en cours...
                      </>
                    ) : (
                      'Valider le concept'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Concepts validés */}
      {validatedConcepts.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h3 className="font-medium text-gray-900 mb-6 text-xl">Concepts validés</h3>
          <div className="space-y-6">
            {validatedConcepts.map(concept => (
              <div key={concept.conceptId} className="bg-green-50 p-6 rounded-lg">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleConceptExpansion(concept.conceptId)}
                >
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-600" />
                    <h4 className="font-medium text-green-900 text-lg">{concept.concept}</h4>
                  </div>
                  <button className="text-green-600">
                    {expandedConcepts[concept.conceptId] ? (
                      <ChevronUp className="w-6 h-6" />
                    ) : (
                      <ChevronDown className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {expandedConcepts[concept.conceptId] && (
                  <div className="mt-6 space-y-6">
                    {concept.fields.map(field => (
                      <div key={field.key} className="bg-white p-6 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-4 text-lg">{field.label}</h5>
                        
                        <div className="space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium text-gray-700 mb-2">Votre réponse :</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{field.userAnswer}</p>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="font-medium text-blue-700 mb-2">Réponse de référence :</p>
                            <p className="text-blue-600 whitespace-pre-wrap">{field.referenceAnswer}</p>
                          </div>

                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="font-medium text-green-700">Score : {field.score}/10</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {validatedConcepts.length === foundConcepts.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleComplete}
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg"
          >
            Terminer l'exercice
          </button>
        </div>
      )}
    </div>
  );
}