import { useState, useEffect } from 'react';
import { Concept } from '../../../types/concepts';
import { Eye, EyeOff, Wand2, Loader2, Trash2 } from 'lucide-react';
import { generateQuestionsForConcept } from '../../../services/questionGenerationService';
import GeneratedQuestions from './GeneratedQuestions';
import { KeyQuestion } from '../../../types/questions';
import { getKeyQuestionsForConcept, deleteKeyQuestion } from '../../../services/questionService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ConceptListProps {
  concepts: Concept[];
}

const MAX_QUESTIONS_PER_CONCEPT = 10;

export function ConceptList({ concepts }: ConceptListProps) {
  const { user } = useAuth();
  const [expandedConcepts, setExpandedConcepts] = useState<Record<string, boolean>>({});
  const [generatedQuestions, setGeneratedQuestions] = useState<Record<string, KeyQuestion[]>>({});
  const [savedQuestions, setSavedQuestions] = useState<Record<string, KeyQuestion[]>>({});
  const [generatingQuestions, setGeneratingQuestions] = useState<Record<string, boolean>>({});
  const [generationProgress, setGenerationProgress] = useState<Record<string, string>>({});
  const [deletingQuestions, setDeletingQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      loadSavedQuestions();
    }
  }, [user]);

  const loadSavedQuestions = async () => {
    if (!user) return;

    try {
      const loadPromises = concepts.map(concept => 
        getKeyQuestionsForConcept(user.uid, concept.id)
      );
      
      const results = await Promise.all(loadPromises);
      const questionsByConcept = results.reduce((acc, questions, index) => {
        acc[concepts[index].id] = questions;
        return acc;
      }, {} as Record<string, KeyQuestion[]>);
      
      setSavedQuestions(questionsByConcept);
    } catch (error) {
      console.error('Error loading saved questions:', error);
      toast.error('Une erreur est survenue lors du chargement des questions sauvegardées');
    }
  };

  const toggleConcept = (conceptId: string) => {
    setExpandedConcepts(prev => ({
      ...prev,
      [conceptId]: !prev[conceptId]
    }));
  };

  const handleGenerateQuestions = async (concept: Concept) => {
    const existingQuestions = savedQuestions[concept.id] || [];
    if (existingQuestions.length >= MAX_QUESTIONS_PER_CONCEPT) {
      toast.error(`Limite de ${MAX_QUESTIONS_PER_CONCEPT} questions atteinte pour ce concept`);
      return;
    }

    if (generatingQuestions[concept.id]) {
      return;
    }

    setGeneratingQuestions(prev => ({ ...prev, [concept.id]: true }));
    setGenerationProgress(prev => ({ ...prev, [concept.id]: 'Initialisation de la génération...' }));

    try {
      setGenerationProgress(prev => ({ ...prev, [concept.id]: 'Analyse du concept...' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const remainingQuestions = MAX_QUESTIONS_PER_CONCEPT - existingQuestions.length;
      
      setGenerationProgress(prev => ({ ...prev, [concept.id]: 'Génération des questions...' }));
      const response = await generateQuestionsForConcept(concept);
      
      if (!response.questions || response.questions.length === 0) {
        throw new Error('Aucune question n\'a été générée');
      }

      const limitedQuestions = response.questions.slice(0, remainingQuestions);
      
      setGenerationProgress(prev => ({ ...prev, [concept.id]: 'Finalisation...' }));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGeneratedQuestions(prev => ({
        ...prev,
        [concept.id]: limitedQuestions
      }));

      // Ouvrir automatiquement le concept après la génération
      setExpandedConcepts(prev => ({
        ...prev,
        [concept.id]: true
      }));

      toast.success(`${limitedQuestions.length} questions générées avec succès !`);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération des questions');
    } finally {
      setGeneratingQuestions(prev => ({ ...prev, [concept.id]: false }));
      setGenerationProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[concept.id];
        return newProgress;
      });
    }
  };

  const handleQuestionSaved = (conceptId: string, question: KeyQuestion) => {
    setSavedQuestions(prev => ({
      ...prev,
      [conceptId]: [...(prev[conceptId] || []), question]
    }));
  };

  const handleDeleteQuestion = async (conceptId: string, questionId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour supprimer une question');
      return;
    }

    if (deletingQuestions[questionId]) {
      return;
    }

    setDeletingQuestions(prev => ({ ...prev, [questionId]: true }));

    try {
      await deleteKeyQuestion(user.uid, conceptId, questionId);
      
      // Mettre à jour l'état local après la suppression
      setSavedQuestions(prev => ({
        ...prev,
        [conceptId]: prev[conceptId]?.filter(q => q.id !== questionId) || []
      }));

      toast.success('Question supprimée avec succès');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Erreur lors de la suppression de la question');
    } finally {
      setDeletingQuestions(prev => {
        const newDeletingQuestions = { ...prev };
        delete newDeletingQuestions[questionId];
        return newDeletingQuestions;
      });
    }
  };

  return (
    <div className="space-y-4">
      {concepts.map(concept => (
        <div key={concept.id} className="bg-white rounded-lg shadow-sm">
          <div
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => toggleConcept(concept.id)}
          >
            <div>
              <h3 className="font-medium">{concept.name}</h3>
              <p className="text-sm text-gray-500">
                {savedQuestions[concept.id]?.length || 0} questions sauvegardées
              </p>
            </div>
            <div className="flex items-center gap-4">
              {generatingQuestions[concept.id] ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {generationProgress[concept.id]}
                </div>
              ) : (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleGenerateQuestions(concept);
                  }}
                  className="flex items-center gap-2 px-3 py-1 text-gold hover:text-gold/80 transition-colors"
                  disabled={generatingQuestions[concept.id]}
                >
                  <Wand2 className="w-4 h-4" />
                  Générer des questions
                </button>
              )}
              {expandedConcepts[concept.id] ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedConcepts[concept.id] && (
            <div className="p-4 border-t">
              {/* Afficher les questions sauvegardées */}
              {savedQuestions[concept.id] && savedQuestions[concept.id].length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-lg mb-4">Questions sauvegardées</h4>
                  <div className="space-y-4">
                    {savedQuestions[concept.id].map((question, index) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-gray-900">{index + 1}</p>
                          <button
                            onClick={() => handleDeleteQuestion(concept.id, question.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            disabled={deletingQuestions[question.id]}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-gray-800">{question.question}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Afficher les questions nouvellement générées */}
              {generatedQuestions[concept.id] && (
                <GeneratedQuestions
                  conceptId={concept.id}
                  conceptName={concept.name}
                  questions={generatedQuestions[concept.id]}
                  onQuestionSaved={question => handleQuestionSaved(concept.id, question)}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}