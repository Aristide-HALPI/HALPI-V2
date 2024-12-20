import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Eye, BookOpen } from "lucide-react";
import { types } from './types';
import * as Dialog from '@radix-ui/react-dialog';

type QuestionType = 'qui' | 'quoi' | 'quand' | 'ou' | 'pourquoi' | 'comment';

interface FeedbackType {
  score: number;
  fields: Array<{
    key: string;
    label: string;
    userAnswer: string;
    referenceAnswer: string;
    score: number;
    feedback: string[];
  }>;
}

// Mock de l'IA pour simuler l'évaluation
const mockAI = {
  evaluate: async (concept: types.Concept, answers: { [key: string]: string }): Promise<FeedbackType> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));

    const fields = Object.entries(answers).map(([key, value]) => {
      const score = value.toLowerCase() === 'test' ? 
        Math.floor(Math.random() * 20) + 40 : // Score entre 40 et 60 pour "test"
        Math.floor(Math.random() * 30) + 70;  // Score entre 70 et 100 pour les autres réponses

      const feedback = value.toLowerCase() === 'test' ? [
        "Réponse trop courte et non pertinente",
        "Veuillez fournir une explication plus détaillée",
        "Utilisez le vocabulaire approprié"
      ] : [
        "Très bonne maîtrise des concepts clés",
        "Explication structurée et détaillée",
        "Utilisation pertinente du vocabulaire technique"
      ];

      return {
        key,
        label: key,
        userAnswer: value,
        referenceAnswer: concept[key === 'qui' ? 'who' : 
                        key === 'quoi' ? 'what' :
                        key === 'quand' ? 'when' :
                        key === 'ou' ? 'where' :
                        key === 'pourquoi' ? 'why' :
                        'how']?.toString() || '',
        score,
        feedback
      };
    });

    // Calculer le score global
    const averageScore = Math.round(
      fields.reduce((sum, field) => sum + field.score, 0) / fields.length
    );

    return {
      score: averageScore,
      fields
    };
  }
};

export function ExplanationPhase({ 
  concepts,
  validatedConcepts,
  onConceptValidated,
  setPhase,
  resetProgress,
}: types.ExplanationPhaseProps) {
  // États pour la gestion des concepts
  const [currentConcept, setCurrentConcept] = useState<types.Concept | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<types.ValidatedConcept | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // États pour la gestion des réponses et du feedback
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);

  const getFilledFields = (concept: types.Concept): QuestionType[] => {
    const mapping: { [key: string]: QuestionType } = {
      who: 'qui',
      what: 'quoi',
      when: 'quand',
      where: 'ou',
      why: 'pourquoi',
      how: 'comment'
    };

    return Object.entries(concept)
      .filter(([key, value]) => key in mapping && value)
      .map(([key]) => mapping[key]);
  };

  const handleAnswerChange = (question: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const handleEvaluate = async () => {
    if (!currentConcept) return;
    
    setIsLoading(true);
    try {
      const result = await mockAI.evaluate(currentConcept, answers);
      setFeedback(result);

      // Créer le concept validé
      const validatedConcept: types.ValidatedConcept = {
        concept: currentConcept.concept,
        explanation: currentConcept.vulgarisation || '',
        score: result.score,
        feedback: result.score >= 70 ? 
          "Excellente explication du concept !" : 
          "Certains points nécessitent plus de précision.",
        timestamp: new Date().toISOString(),
        fields: result.fields
      };

      onConceptValidated(validatedConcept);
      setCurrentConcept(null);
      setSelectedConcept(null);
      setAnswers({});
      setFeedback(null);
    } catch (error) {
      console.error("Erreur lors de l'évaluation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentConcept) {
    console.log('Nombre de concepts validés:', validatedConcepts.length);
    console.log('Concepts validés:', validatedConcepts);

    return (
      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Phase d'explication</h1>
          <div className="p-6 bg-white rounded-lg shadow-sm space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-gold/10 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Approfondissez votre compréhension</h2>
                <p className="text-gray-600">
                  Maintenant que vous avez identifié les concepts clés, il est temps d'approfondir 
                  votre compréhension. Cette phase vous permettra de :
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium mb-4">Objectifs</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                    <span>Comprendre en détail chaque concept clé</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                    <span>Établir les liens entre les différents concepts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                    <span>Maîtriser les notions essentielles du chapitre</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium mb-4">Fonctionnement</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                    <span>Cliquez sur un concept clé pour l'expliquer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                    <span>Répondez aux questions pour chaque concept</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                    <span>Un score supérieur à 70% valide la maîtrise du concept</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
                    <span>Si le score est inférieur à 70%, vous recevrez un feedback détaillé pour améliorer vos réponses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Concepts à expliquer</h2>
          <div className="grid grid-cols-1 gap-4">
            {concepts
              .filter(
                (concept) =>
                  !validatedConcepts.some(
                    (vc) => vc.concept === concept.concept
                  )
              )
              .map((concept) => (
                <button
                  key={concept.concept}
                  onClick={() => setCurrentConcept(concept)}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                >
                  <p className="font-medium">{concept.concept}</p>
                  <p className="text-gray-600">{concept.vulgarisation}</p>
                </button>
              ))}
          </div>
        </div>

        {validatedConcepts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Concepts validés</h2>
            <div className="space-y-4">
              {validatedConcepts.map((validatedConcept) => (
                <div
                  key={validatedConcept.concept}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium">{validatedConcept.concept}</span>
                        <span className="text-sm text-gray-500">
                          Score: {validatedConcept.score}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedConcept(validatedConcept);
                          setShowDetails(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Dialog.Root open={showDetails} onOpenChange={setShowDetails}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto">
              {selectedConcept && (
                <>
                  <Dialog.Title className="text-xl font-semibold mb-4">
                    Détails du concept : {selectedConcept.concept}
                  </Dialog.Title>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Score global</h3>
                      <p className="text-2xl font-bold text-green-600">{selectedConcept.score}%</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Feedback général</h3>
                      <p className="text-gray-700">{selectedConcept.feedback}</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Détails par champ</h3>
                      {selectedConcept.fields?.map((field) => (
                        <div key={field.key} className="border rounded-lg p-4">
                          <h4 className="font-medium text-lg mb-3 capitalize">{field.label}</h4>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-500">Votre réponse :</p>
                              <p className="text-gray-700">{field.userAnswer}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">Réponse de référence :</p>
                              <p className="text-gray-700">{field.referenceAnswer}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-500">Score :</p>
                              <p className="font-medium text-green-600">{field.score}%</p>
                            </div>

                            {field.feedback && field.feedback.length > 0 && (
                              <div>
                                <p className="text-sm text-gray-500">Feedback :</p>
                                <ul className="list-disc list-inside text-gray-700">
                                  {field.feedback.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Fermer"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </Dialog.Close>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex space-x-4 mt-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setPhase('identification')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              Retourner à l'identification
            </button>
            <button
              onClick={() => resetProgress()}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            >
              Recommencer l'exercice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <button
        onClick={() => {
          setCurrentConcept(null);
          setAnswers({});
          setFeedback(null);
        }}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour aux concepts
      </button>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">{currentConcept?.concept}</h2>
          <p className="text-gray-600">{currentConcept?.vulgarisation}</p>
        </div>

        <div className="space-y-4">
          {getFilledFields(currentConcept!).map(question => (
            <div key={question} className="space-y-2">
              <label className="block font-medium capitalize">{question}</label>
              <textarea
                className="w-full p-2 border rounded-lg"
                value={answers[question] || ""}
                onChange={(e) => handleAnswerChange(question, e.target.value)}
                rows={3}
                placeholder={`Entrez votre réponse pour "${question}"`}
              />
            </div>
          ))}
        </div>

        {feedback && (
          <div className="space-y-4 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-semibold">Résultat de l'évaluation</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Score global :</span>
                <span className={`text-lg font-medium ${
                  feedback.score >= 70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {feedback.score}%
                </span>
                {feedback.score >= 70 && (
                  <CheckCircle2 className="w-5 h-5 text-green-500 ml-1" />
                )}
              </div>
            </div>
            
            <div className="py-4 bg-gray-50 rounded-lg px-4 mt-4">
              <p className="text-gray-700 font-medium">{/*feedback.feedback*/}</p>
            </div>

            <div className="space-y-6 pt-4">
              {feedback.fields.map((field) => (
                <div key={field.key} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                  <h4 className="font-medium text-lg mb-3 text-gray-900 flex items-center justify-between">
                    {field.label}
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      field.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {field.score}%
                    </span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Votre réponse :</p>
                      <p className="text-gray-700 bg-white p-3 rounded border border-gray-200">
                        {field.userAnswer || "Non renseigné"}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Réponse de référence :</p>
                      <p className="text-gray-700 bg-white p-3 rounded border border-gray-200">
                        {field.referenceAnswer}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Score :</p>
                      <p className="font-medium text-green-600">{field.score}%</p>
                    </div>

                    {field.feedback.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-500 mb-2">Commentaires :</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {field.feedback.map((item, i) => (
                            <li key={i} className="text-sm text-gray-600">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6">
          <button
            onClick={() => {
              setCurrentConcept(null);
              setAnswers({});
              setFeedback(null);
            }}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Retour
          </button>
          <button
            onClick={handleEvaluate}
            disabled={isLoading}
            className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Évaluation...
              </>
            ) : (
              "Évaluer mes réponses"
            )}
          </button>
          {feedback && feedback.score >= 70 && (
            <button
              onClick={() => {
                const validatedConcept: types.ValidatedConcept = {
                  concept: currentConcept!.concept,
                  explanation: currentConcept!.vulgarisation || '',
                  score: feedback.score,
                  feedback: feedback.score >= 70 ? 
                    "Excellente explication du concept !" : 
                    "Certains points nécessitent plus de précision.",
                  timestamp: new Date().toISOString(),
                  fields: feedback.fields
                };

                onConceptValidated(validatedConcept);
                setCurrentConcept(null);
                setSelectedConcept(null);
                setAnswers({});
                setFeedback(null);
              }}
              className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              Valider le concept
            </button>
          )}
        </div>
      </div>
    </div>
  );
}