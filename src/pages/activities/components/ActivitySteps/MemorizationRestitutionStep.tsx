import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../../../../components/common/Button';
import { supabase } from '../../../../lib/supabaseClient';
import AIService, { ConceptRestitutionResponse } from '../../../../services/ai/AIService';

// Interface locale pour le type de retour de l'IA
interface ConceptFieldEvaluation {
  note: number;
  commentaire: string;
  type_erreur?: string;
}

// Extension de l'interface pour correspondre à la structure utilisée dans le composant
interface ExtendedConceptRestitutionResponse extends ConceptRestitutionResponse {
  evaluation_par_champ?: Record<string, ConceptFieldEvaluation>;
  feedback_global?: string;
}

interface Activity {
  id: string;
  title: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MemorizationRestitutionStepProps {
  activity: Activity;
  onNext: (score?: number, totalPossible?: number) => void;
}

interface CustomField {
  id: string;
  title: string;
  content: string;
}

interface Concept {
  id: string;
  name: string;
  who: string;
  what: string;
  why: string;
  how: string;
  when: string;
  where: string;
  essentials: string;
  hasSchema: boolean;
  schemaImage?: string;
  customFields: CustomField[];
}

interface ConceptScore {
  score: number;
  maxPossible: number;
}
const MemorizationRestitutionStep: React.FC<MemorizationRestitutionStepProps> = ({ activity, onNext }) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [totalPossibleScore, setTotalPossibleScore] = useState(0);
  const [conceptScores, setConceptScores] = useState<Record<string, ConceptScore>>({});
  const [evaluatedConcepts, setEvaluatedConcepts] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, ExtendedConceptRestitutionResponse>>({});

  /**
   * Évalue un concept avec l'IA Fabrile
   */
  const evaluateConceptWithAI = async (conceptId: string) => {
    try {
      setIsEvaluating(true);
      
      // Récupérer le concept de référence
      const conceptToEvaluate = concepts.find(c => c.id === conceptId);
      if (!conceptToEvaluate) {
        throw new Error(`Concept avec ID ${conceptId} non trouvé`);
      }
      
      // Récupérer les réponses de l'utilisateur
      const userResponsesToEvaluate = userAnswers[conceptId] || {};
      
      // Préparer le concept de référence (original)
      const referenceConcept: Record<string, string> = {
        name: conceptToEvaluate.name,
        what: conceptToEvaluate.what || '',
        why: conceptToEvaluate.why || '',
        how: conceptToEvaluate.how || '',
        who: conceptToEvaluate.who || '',
        when: conceptToEvaluate.when || '',
        where: conceptToEvaluate.where || '',
        essentials: conceptToEvaluate.essentials || ''
      };
      
      // Ajouter les champs personnalisés
      if (conceptToEvaluate.customFields) {
        conceptToEvaluate.customFields.forEach(field => {
          referenceConcept[field.id] = field.content || '';
        });
      }
      
      console.log('Concept de référence:', referenceConcept);
      console.log('Réponses de l\'utilisateur:', userResponsesToEvaluate);
      
      // Appeler l'IA pour évaluer
      const evaluation = await AIService.evaluateConceptRestitution(
        userResponsesToEvaluate,
        referenceConcept
      );
      
      console.log('Évaluation IA reçue:', evaluation);
      
      // Mettre à jour l'état avec l'évaluation
      setAiEvaluations(prev => ({
        ...prev,
        [conceptId]: evaluation
      }));
      
      // Calculer le score pour ce concept
      const conceptScore = {
        score: evaluation.note_globale_sur_30,
        maxPossible: 30 // Le score maximum est toujours 30 selon le prompt
      };
      
      // Mettre à jour les scores
      setConceptScores(prev => ({
        ...prev,
        [conceptId]: conceptScore
      }));
      
      // Ajouter à la liste des concepts évalués s'il n'y est pas déjà
      if (!evaluatedConcepts.includes(conceptId)) {
        setEvaluatedConcepts(prev => [...prev, conceptId]);
      }
      
      // Sauvegarder les résultats dans la base de données
      await saveRestitutionResults(conceptId, userResponsesToEvaluate, evaluation);
      
      // Mettre à jour le score global
      updateGlobalScore();
      
      return evaluation;
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'IA:', error);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  // Fonction simplifiée pour calculer la similitude entre deux textes
  // Utilisée en cas de secours si l'IA échoue
  const calculateSimilarity = (text1: string, text2: string): number => {
    // Normaliser les textes (minuscules, sans espaces superflus)
    const normalize = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedText1 = normalize(text1 || '');
    const normalizedText2 = normalize(text2 || '');
    
    // Si les textes sont vides, retourner 0
    if (!normalizedText1 || !normalizedText2) return 0;
    
    // Si les textes sont identiques, retourner 1
    if (normalizedText1 === normalizedText2) return 1;
    
    // Calcul simplifié de la similarité basé sur la présence de mots-clés
    const words1 = normalizedText1.split(' ');
    const words2 = normalizedText2.split(' ');
    
    let matchCount = 0;
    for (const word of words1) {
      if (word.length > 3 && words2.includes(word)) matchCount++;
    }
    
    return Math.min(1, matchCount / Math.max(words1.length, 1));
  };
  
  // Méthode de secours en cas d'échec de l'IA
  const fallbackEvaluation = (conceptId: string): ConceptScore | null => {
    // Récupérer le concept et les réponses de l'utilisateur
    const concept = concepts.find(c => c.id === conceptId);
    const answers = userAnswers[conceptId] || {};
    
    if (!concept) return null;
    
    // Calculer le score pour chaque champ
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // Évaluer les champs standard
    const standardFields = ['what', 'why', 'how', 'who', 'when', 'where', 'essentials'];
    
    for (const field of standardFields) {
      // Vérifier si le champ existe dans le concept original et dans les réponses
      if (concept[field as keyof Concept] && answers[field]) {
        const originalText = concept[field as keyof Concept] as string;
        const userText = answers[field];
        
        // Calculer la similarité
        const similarity = calculateSimilarity(originalText, userText);
        
        // Attribuer des points en fonction de la similarité
        // Chaque champ vaut 10 points maximum
        const fieldScore = Math.round(similarity * 10);
        
        totalScore += fieldScore;
        maxPossibleScore += 10;
      }
    }
    
    // Évaluer les champs personnalisés
    if (concept.customFields) {
      for (const field of concept.customFields) {
        if (field.content && answers[field.id]) {
          const originalText = field.content;
          const userText = answers[field.id];
          
          // Calculer la similarité
          const similarity = calculateSimilarity(originalText, userText);
          
          // Attribuer des points en fonction de la similarité
          const fieldScore = Math.round(similarity * 10);
          
          totalScore += fieldScore;
          maxPossibleScore += 10;
        }
      }
    }
    
    // Mettre à jour les scores
    const score = {
      score: totalScore,
      maxPossible: maxPossibleScore
    };
    
    setConceptScores(prev => ({
      ...prev,
      [conceptId]: score
    }));
    
    // Ajouter à la liste des concepts évalués s'il n'y est pas déjà
    if (!evaluatedConcepts.includes(conceptId)) {
      setEvaluatedConcepts(prev => [...prev, conceptId]);
    }
    
    // Mettre à jour le score global
    updateGlobalScore();
    
    return score;
  };

    // Fonction pour sauvegarder la progression dans Supabase
    const saveProgress = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        
        if (!userId || !activity.id) {
          console.error("Erreur: Utilisateur non connecté ou activité non identifiée");
          return;
        }
        
        // Extraire l'ID du chapitre à partir de l'ID de l'activité
        const activityIdParts = activity.id.split('-');
        const chapterId = activityIdParts.length > 1 ? activityIdParts[1] : '';
        
        // Préparer les données à enregistrer
        const progressData = {
          activity_id: activity.id,
          chapter_id: chapterId,
          user_id: userId,
          evaluated_concepts: evaluatedConcepts,
          selected_concept_id: selectedConceptId,
          user_score: score,
          is_complete: evaluatedConcepts.length === concepts.length,
          updated_at: new Date().toISOString()
        };
        
        // Enregistrer dans Supabase
        const { error } = await supabase
          .from('activity_memorization_progress')
          .upsert([progressData], { 
            onConflict: 'activity_id,user_id' 
          });
        
        if (error) {
          console.error('Erreur lors de l\'enregistrement de la progression:', error);
        } else {
          console.log('Progression enregistrée avec succès');
        }
      } catch (error) {
        console.error('Exception lors de la sauvegarde de la progression:', error);
      }
    };
  
    // Fonction pour charger les concepts et la progression
    const loadConceptsAndProgress = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer l'utilisateur actuel
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        
        if (!userId || !activity.id) {
          setError("Erreur: Utilisateur non connecté ou activité non identifiée");
          setLoading(false);
          return;
        }
        
        console.log('Chargement des concepts pour activity_id:', activity.id, 'et user_id:', userId);
        
        // Extraire l'ID du chapitre à partir de l'ID de l'activité
        // Format de l'ID d'activité : a2-ch0-step3 où ch0 est l'ID du chapitre
        const activityIdParts = activity.id.split('-');
        const chapterId = activityIdParts.length > 1 ? activityIdParts[1] : '';
        console.log('ID du chapitre extrait:', chapterId);
        
        // Charger les concepts créés par l'utilisateur pour ce chapitre, quelle que soit l'activité
        const { data: conceptsData, error: conceptsError } = await supabase
          .from('activity_concepts')
          .select('concepts')
          .like('activity_id', `%-${chapterId}-%`) // Recherche toutes les activités de ce chapitre
          .eq('user_id', userId);
        
        if (conceptsError) {
          console.error('Erreur lors du chargement des concepts:', conceptsError);
          setError("Erreur lors du chargement des concepts. Veuillez réessayer.");
          setLoading(false);
          return;
        }
        
        if (!conceptsData || conceptsData.length === 0 || !conceptsData[0]?.concepts || conceptsData[0].concepts.length === 0) {
          setError("Aucun concept n'a été créé pour cette activité. Veuillez d'abord créer des concepts dans l'étape précédente.");
          setLoading(false);
          return;
        }
        
        console.log('Concepts chargés:', conceptsData[0]?.concepts);
        setConcepts(conceptsData[0]?.concepts || []);
        
        // Charger la progression de l'utilisateur
        const { data: progressData, error: progressError } = await supabase
          .from('activity_memorization_progress')
          .select('*')
          .eq('activity_id', activity.id)
          .eq('user_id', userId);
        
        if (progressError && progressError.code !== 'PGRST116') {
          console.error('Erreur lors du chargement de la progression:', progressError);
        }
        
        if (progressData && progressData.length > 0) {
          console.log('Progression chargée:', progressData);
          
          // Initialiser les concepts évalués
          if (progressData[0].evaluated_concepts && Array.isArray(progressData[0].evaluated_concepts)) {
            setEvaluatedConcepts(progressData[0].evaluated_concepts);
          }
          
          // Initialiser le score
          if (typeof progressData[0].user_score === 'number') {
            setScore(progressData[0].user_score);
          }
          
          // Charger les résultats de restitution précédents
          for (const concept of conceptsData[0].concepts) {
            const conceptId = concept.id;
            const { data: restitutionData } = await supabase
              .from('activity_concept_restitution')
              .select('*')
              .eq('activity_id', activity.id)
              .eq('user_id', userId)
              .eq('concept_id', conceptId)
              .order('updated_at', { ascending: false })
              .limit(1);
            
            if (restitutionData && restitutionData.length > 0) {
              // Récupérer les réponses de l'utilisateur
              if (restitutionData[0].user_responses) {
                setUserAnswers(prev => ({
                  ...prev,
                  [conceptId]: restitutionData[0].user_responses
                }));
              }
              
              // Récupérer l'évaluation IA
              if (restitutionData[0].ai_evaluation) {
                setAiEvaluations(prev => ({
                  ...prev,
                  [conceptId]: restitutionData[0].ai_evaluation
                }));
                
                // Mettre à jour les scores
                setConceptScores(prev => ({
                  ...prev,
                  [conceptId]: {
                    score: restitutionData[0].note_globale_sur_30 || 0,
                    maxPossible: 30
                  }
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error('Exception lors du chargement des données:', error);
        setError("Une erreur est survenue lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      loadConceptsAndProgress();
    }, [activity.id]);

      // Gérer les changements dans les champs de réponse
  const handleInputChange = (conceptId: string, field: string, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [conceptId]: {
        ...(prev[conceptId] || {}),
        [field]: value
      }
    }));
  };

  /**
   * Sauvegarde les résultats de restitution dans la base de données
   */
  const saveRestitutionResults = async (
    conceptId: string,
    userResponses: Record<string, string>,
    aiEvaluation: ExtendedConceptRestitutionResponse
  ) => {
    try {
      // Récupérer l'utilisateur actuel
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      if (!userId) {
        console.error("Erreur: Utilisateur non connecté");
        return null;
      }
      
      // Préparer les données à enregistrer
      const restitutionData = {
        activity_id: activity.id,
        user_id: userId,
        concept_id: conceptId,
        user_responses: userResponses,
        ai_evaluation: aiEvaluation,
        note_globale_sur_30: aiEvaluation.note_globale_sur_30,
        est_validee: aiEvaluation.est_validee,
        updated_at: new Date().toISOString()
      };
      
      console.log('Sauvegarde des résultats de restitution:', restitutionData);
      
      // Enregistrer dans Supabase
      const { error } = await supabase
        .from('activity_concept_restitution')
        .upsert([restitutionData], { 
          onConflict: 'activity_id,user_id,concept_id' 
        });
      
      if (error) {
        console.error('Erreur lors de l\'enregistrement des résultats:', error);
        return null;
      }
      
      console.log('Résultats de restitution enregistrés avec succès');
      return true;
    } catch (error) {
      console.error('Exception lors de la sauvegarde des résultats:', error);
      return null;
    }
  };
  
  /**
   * Met à jour le score global en fonction des scores des concepts
   */
  const updateGlobalScore = () => {
    let totalScore = 0;
    let totalMaxPossible = 0;
    
    Object.values(conceptScores).forEach(score => {
      totalScore += score.score;
      totalMaxPossible += score.maxPossible;
    });
    
    setScore(totalScore);
    setTotalPossibleScore(totalMaxPossible);
  };

    // Évaluer un concept spécifique
    const evaluateConcept = async (conceptId: string) => {
      // Récupérer le concept et les réponses de l'utilisateur
      const concept = concepts.find(c => c.id === conceptId);
      const answers = userAnswers[conceptId] || {};
      
      if (!concept) {
        console.error(`Concept avec ID ${conceptId} non trouvé`);
        return null;
      }
      
      // Vérifier si toutes les réponses requises sont présentes
      const requiredFields = ['what', 'why', 'how'];
      const missingFields = requiredFields.filter(field => 
        concept[field as keyof Concept] && !answers[field]
      );
      
      if (missingFields.length > 0) {
        alert(`Veuillez compléter les champs suivants: ${missingFields.join(', ')}`);
        return null;
      }
      
      // Utiliser l'IA pour évaluer le concept
      try {
        setIsEvaluating(true);
        setShowFeedback(true);
        
                // Vérifier si nous avons déjà une évaluation pour ce concept
                if (aiEvaluations[conceptId]) {
                  console.log('Utilisation de l\'évaluation existante pour', conceptId);
                  return conceptScores[conceptId] || null;
                }
                
                // Sinon, faire une nouvelle évaluation avec l'IA
                const evaluation = await evaluateConceptWithAI(conceptId);
                
                if (!evaluation) {
                  throw new Error('Échec de l\'évaluation IA');
                }
                
                // Le score est déjà mis à jour dans evaluateConceptWithAI
                return conceptScores[conceptId] || null;
              } catch (error) {
                console.error('Erreur lors de l\'évaluation:', error);
                
                // En cas d'erreur, utiliser la méthode de secours (similarité locale)
                alert('Erreur lors de l\'évaluation IA. Utilisation de la méthode de secours.');
                return fallbackEvaluation(conceptId);
              } finally {
                setIsEvaluating(false);
                // Sauvegarder la progression
                saveProgress();
              }
            };
            
            // Soumettre toutes les réponses pour évaluation finale
            const submitAnswers = async () => {
              if (concepts.length === 0) {
                alert("Aucun concept à évaluer.");
                return;
              }
              
              // Vérifier si tous les concepts ont été évalués
              const remainingConcepts = concepts.filter(c => !evaluatedConcepts.includes(c.id));
              
              if (remainingConcepts.length > 0) {
                const conceptNames = remainingConcepts.map(c => c.name).join(', ');
                const shouldContinue = window.confirm(`Certains concepts n'ont pas encore été évalués: ${conceptNames}. Voulez-vous les évaluer maintenant?`);
                
                if (shouldContinue) {
                  // Évaluer automatiquement les concepts restants
                  setIsEvaluating(true);
                  try {
                    for (const concept of remainingConcepts) {
                      await evaluateConcept(concept.id);
                    }
                  } catch (error) {
                    console.error('Erreur lors de l\'évaluation automatique:', error);
                  } finally {
                    setIsEvaluating(false);
                  }
                } else {
                  return; // L'utilisateur veut évaluer manuellement
                }
              }
              
              // Calculer le score final
              let finalScore = 0;
              let finalMaxPossible = 0;
              
              Object.values(conceptScores).forEach(score => {
                finalScore += score.score;
                finalMaxPossible += score.maxPossible;
              });
              
              // Passer à l'étape suivante avec le score final
              onNext(finalScore, finalMaxPossible);
            };
          
            // Afficher un message de chargement
            if (loading) {
              return (
                <div className="flex flex-col items-center justify-center p-8">
                  <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
                  <p className="text-gray-600">Chargement des concepts...</p>
                </div>
              );
            }
          
            // Afficher un message d'erreur
            if (error) {
              return (
                <div className="flex flex-col items-center justify-center p-8">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-600 font-semibold mb-2">Erreur</p>
                  <p className="text-gray-600">{error}</p>
                </div>
              );
            }
          
            // Récupérer le concept sélectionné
            const selectedConcept = selectedConceptId 
              ? concepts.find(c => c.id === selectedConceptId) 
              : null;
              
            return (
              <div className="max-w-4xl mx-auto">
                {/* En-tête avec icône */}
                <div className="flex items-center mb-6">
                  <Brain className="h-8 w-8 text-amber-500 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Restitution des concepts clés</h2>
                </div>
                
                {/* Explication de l'étape */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8">
                  <p className="text-gray-700">
                    Dans cette étape, vous allez tester votre mémorisation des concepts clés que vous avez créés.
                    Pour chaque concept, essayez de restituer les informations sans consulter vos notes.
                    L'IA évaluera vos réponses et vous fournira un feedback détaillé.
                  </p>
                </div>
                
                {/* Liste des concepts ou détail d'un concept */}
                {!selectedConceptId ? (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Sélectionnez un concept à restituer</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {concepts.map((concept) => {
                        const isEvaluated = evaluatedConcepts.includes(concept.id);
                        const conceptScore = conceptScores[concept.id];
                        
                        return (
                          <div 
                            key={concept.id} 
                            className={`bg-white border rounded-md p-3 cursor-pointer transition-all hover:border-[#bd8c0f] ${
                              isEvaluated 
                                ? 'border-green-400' 
                                : 'border-[#bd8c0f]'
                            }`}
                            onClick={() => setSelectedConceptId(concept.id)}
                          >
                            <div className="flex flex-col h-full justify-between">
                              <h4 className="text-base font-medium text-gray-800 mb-2">{concept.name}</h4>
                              <div className="flex justify-between items-center">
                                {isEvaluated ? (
                                  <div className="flex items-center">
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
                                    <span className="text-xs font-medium text-green-600">
                                      {conceptScore ? `${conceptScore.score}/${conceptScore.maxPossible}` : 'Évalué'}
                                    </span>
                                  </div>
                                ) : (
                                  <div></div>
                                )}
                                <span className="text-xs font-medium text-[#bd8c0f]">
                                  Restituer
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : selectedConcept ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                        <span className="inline-block w-3 h-8 bg-[#bd8c0f] rounded-sm mr-3"></span>
                        {selectedConcept.name}
                      </h3>
                      <Button 
                        variant="secondary" 
                        onClick={() => setSelectedConceptId(null)}
                        className="text-[#bd8c0f] border border-[#bd8c0f] hover:bg-[#bd8c0f] hover:text-white transition-colors px-4 py-2 rounded-md flex items-center text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour à la liste
                      </Button>
                    </div>
                    
                    {/* Affichage du feedback IA si disponible */}
                    {showFeedback && aiEvaluations[selectedConcept.id] && (
                      <div className="bg-white shadow-sm rounded-xl p-6 mb-8 border border-gray-100">
                        <div className="flex items-center mb-4">
                          <div className="bg-blue-50 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h4 className="text-xl font-semibold text-gray-800">Feedback de l'IA</h4>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                          <div className="flex items-center">
                            <div className="text-3xl font-bold text-gray-800 mr-2">{aiEvaluations[selectedConcept.id].note_globale_sur_30}</div>
                            <div className="text-gray-500 text-sm">/ 30<br/>points</div>
                          </div>
                          <div className="flex items-center">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${aiEvaluations[selectedConcept.id].est_validee ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {aiEvaluations[selectedConcept.id].est_validee ? 'Validé' : 'Non validé'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h5 className="text-md font-semibold text-gray-700 mb-3">Évaluation par champ:</h5>
                          {Object.entries(aiEvaluations[selectedConcept.id]?.evaluation_par_champ || {}).map(([field, evaluation]: [string, ConceptFieldEvaluation]) => (
                            <div key={field} className="bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                <p className="font-medium text-gray-800 text-md">{field}</p>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  evaluation.note >= 7 ? 'bg-green-100 text-green-800' : 
                                  evaluation.note >= 4 ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {evaluation.note}/10
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{evaluation.commentaire}</p>
                              {evaluation.type_erreur && (
                                <div className="flex items-center">
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    {evaluation.type_erreur}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {aiEvaluations[selectedConcept.id]?.feedback_global && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <h5 className="text-md font-semibold text-blue-800 mb-2 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Feedback global
                            </h5>
                            <p className="text-blue-700">{aiEvaluations[selectedConcept.id]?.feedback_global}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Formulaire de restitution */}
                    <div className="bg-white shadow-sm rounded-xl p-6 space-y-5 border border-gray-100">
                      <div className="flex items-center mb-2">
                        <div className="bg-[#bd8c0f] bg-opacity-10 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#bd8c0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">Restitution du concept</h4>
                      </div>

                      
                      {selectedConcept.what && (
                        <div>
                          <label htmlFor="what" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">Quoi ?</span>
                          </label>
                          <textarea
                            id="what"
                            value={userAnswers[selectedConcept.id]?.what || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, 'what', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      )}
                      
                      {selectedConcept.why && (
                        <div>
                          <label htmlFor="why" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">Pourquoi ?</span>
                          </label>
                          <textarea
                            id="why"
                            value={userAnswers[selectedConcept.id]?.why || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, 'why', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      )}
                      
                      {selectedConcept.how && (
                        <div>
                          <label htmlFor="how" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">Comment ?</span>
                          </label>
                          <textarea
                            id="how"
                            value={userAnswers[selectedConcept.id]?.how || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, 'how', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      )}
                      
                      {selectedConcept.who && (
                        <div>
                          <label htmlFor="who" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">Qui ?</span>
                          </label>
                          <textarea
                            id="who"
                            value={userAnswers[selectedConcept.id]?.who || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, 'who', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      )}
                      
                      {selectedConcept.when && (
                        <div>
                          <label htmlFor="when" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">Quand ?</span>
                          </label>
                          <textarea
                            id="when"
                            value={userAnswers[selectedConcept.id]?.when || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, 'when', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      )}
                      
                      {selectedConcept.where && (
                        <div>
                          <label htmlFor="where" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">Où ?</span>
                          </label>
                          <textarea
                            id="where"
                            value={userAnswers[selectedConcept.id]?.where || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, 'where', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      )}
                      
                      {selectedConcept.essentials && (
                        <div>
                          <label htmlFor="essentials" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">Essentiels</span>
                          </label>
                          <textarea
                            id="essentials"
                            value={userAnswers[selectedConcept.id]?.essentials || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, 'essentials', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      )}
                      
                      {/* Champs personnalisés */}
                      {selectedConcept.customFields && selectedConcept.customFields.map((field) => (
                        <div key={field.id}>
                          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">{field.title}</span>
                          </label>
                          <textarea
                            id={field.id}
                            value={userAnswers[selectedConcept.id]?.[field.id] || ''}
                            onChange={(e) => handleInputChange(selectedConcept.id, field.id, e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f] focus:border-[#bd8c0f] transition-colors"
                            placeholder=""
                          ></textarea>
                        </div>
                      ))}
                    
                      {/* Boutons d'action */}
                      <div className="flex justify-end mt-8">
                        <Button 
                          variant="primary" 
                          onClick={async () => {
                            // Désactiver le bouton pendant l'évaluation
                            if (isEvaluating) return;
                            
                            // Évaluer le concept actuel
                            setIsEvaluating(true);
                            try {
                              await evaluateConcept(selectedConcept.id);
                              // Ne pas revenir à la liste automatiquement pour permettre de voir le feedback
                            } catch (error) {
                              console.error('Erreur lors de l\'évaluation:', error);
                            } finally {
                              setIsEvaluating(false);
                            }
                          }}
                          className="bg-[#bd8c0f] hover:bg-[#a67c0d] text-white flex items-center px-6 py-3 rounded-lg shadow-sm transition-all hover:shadow"
                          disabled={isEvaluating}
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Évaluation en cours...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Évaluer ce concept
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
                
                {/* Affichage du score global (déplacé en bas de la page) */}
                {!selectedConceptId && evaluatedConcepts.length > 0 && (
                  <div className="bg-white shadow rounded-lg p-4 mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Progression</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600">
                          Concepts évalués: <span className="font-semibold">{evaluatedConcepts.length}/{concepts.length}</span>
                        </p>
                        <p className="text-gray-600">
                          Score global: <span className="font-semibold">{score}/{totalPossibleScore}</span>
                        </p>
                      </div>
                      <Button 
                        variant="primary" 
                        onClick={submitAnswers}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={evaluatedConcepts.length === 0}
                      >
                        Terminer l'activité
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          };
          
          export default MemorizationRestitutionStep;