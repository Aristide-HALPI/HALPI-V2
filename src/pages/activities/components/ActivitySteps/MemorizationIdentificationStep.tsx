import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import Button from '../../../../components/common/Button';
import { supabase } from '../../../../lib/supabaseClient';

interface Activity {
  id: string;
  title: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MemorizationIdentificationStepProps {
  activity: Activity;
  onNext: () => void;
}

interface Concept {
  id: string;
  name: string;
  // Autres propriétés des concepts
}

const MemorizationIdentificationStep: React.FC<MemorizationIdentificationStepProps> = ({ activity, onNext }) => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [foundConcepts, setFoundConcepts] = useState<Concept[]>([]);
  const [hintLevel, setHintLevel] = useState(0); // 0: pas d'indice, 1: première lettre, 2: première et dernière lettre, 3: un mot sur deux, 4: réponse complète
  const [isComplete, setIsComplete] = useState(false);
  const [lockedToCurrentConcept, setLockedToCurrentConcept] = useState(false); // Indique si l'apprenant doit trouver le concept spécifique actuel
  const [isVerifying, setIsVerifying] = useState(false); // État pour suivre la vérification
  const [verificationResponse, setVerificationResponse] = useState<{isCorrect: boolean; similarity: number; feedback: string} | null>(null); // Réponse de vérification

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
        found_concepts: foundConcepts.map(c => c.id),
        current_concept_index: currentConceptIndex,
        is_complete: isComplete,
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
  
  useEffect(() => {
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
        
        // Récupérer les concepts pour ce chapitre, quelle que soit l'activité
        const { data, error } = await supabase
          .from('activity_concepts')
          .select('concepts')
          .like('activity_id', `%-${chapterId}-%`) // Recherche toutes les activités de ce chapitre
          .eq('user_id', userId);
        
        if (error) {
          console.error('Erreur lors du chargement des concepts:', error);
          setError(`Erreur lors du chargement des concepts: ${error.message}`);
          setLoading(false);
          return;
        }
        
        console.log('Données reçues de Supabase:', data);
        
        if (!data || data.length === 0 || !data[0]?.concepts || data[0].concepts.length === 0) {
          setError("Aucun concept trouvé pour cette activité. Veuillez d'abord créer des concepts dans l'activité d'élaboration des concepts clés.");
          setLoading(false);
          return;
        }
        
        // Extraire les concepts et ne garder que les propriétés nécessaires pour cette étape
        const loadedConcepts = data[0].concepts.map((concept: any) => ({
          id: concept.id,
          name: concept.name
        }));
        
        // Mélanger les concepts pour l'exercice de mémorisation (seulement s'il n'y a pas de progression sauvegardée)
        const shuffledConcepts = [...loadedConcepts].sort(() => Math.random() - 0.5);
        setConcepts(shuffledConcepts);
        
        // Charger la progression sauvegardée si elle existe
        const { data: progressDataArray, error: progressError } = await supabase
          .from('activity_memorization_progress')
          .select('*')
          .eq('activity_id', activity.id)
          .eq('user_id', userId);
        
        if (progressError) {
          console.error('Erreur lors du chargement de la progression:', progressError);
        } else if (progressDataArray && progressDataArray.length > 0) {
          const progressData = progressDataArray[0];
          console.log('Progression chargée:', progressData);
          
          // Restaurer l'état de la progression
          if (progressData.found_concepts && progressData.found_concepts.length > 0) {
            // Récupérer les concepts trouvés à partir de leurs IDs
            const foundConceptsData = progressData.found_concepts.map((id: string) => 
              shuffledConcepts.find(c => c.id === id)
            ).filter(Boolean);
            
            setFoundConcepts(foundConceptsData);
            setCurrentConceptIndex(progressData.current_concept_index || 0);
            setIsComplete(progressData.is_complete || false);
          }
        }
      } catch (error) {
        console.error('Exception lors du chargement des concepts:', error);
        setError("Une erreur est survenue lors du chargement des concepts");
      } finally {
        setLoading(false);
      }
    };
    
    loadConceptsAndProgress();
    
  }, [activity.id]);

  // Fonction pour calculer la similarité entre deux chaînes de caractères
  const calculateSimilarity = (str1: string, str2: string): number => {
    // Normalisation : suppression des accents, mise en minuscule, suppression des espaces superflus
    const normalize = (s: string): string => {
      return s
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Suppression des accents
        .toLowerCase() // Mise en minuscule
        .trim() // Suppression des espaces au début et à la fin
        .replace(/\s+/g, ' '); // Remplacement des espaces multiples par un seul espace
    };
    
    const normalizedStr1 = normalize(str1);
    const normalizedStr2 = normalize(str2);
    
    // Si les chaînes sont identiques après normalisation, similarité maximale
    if (normalizedStr1 === normalizedStr2) {
      return 1;
    }
    
    // Calcul de la distance de Levenshtein
    const len1 = normalizedStr1.length;
    const len2 = normalizedStr2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = normalizedStr1[i - 1] === normalizedStr2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // suppression
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    
    // Calcul de la similarité (1 - distance normalisée)
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  };
  
  // Fonction pour vérifier la réponse avec l'algorithme local
  const verifyAnswer = (userResponse: string, expectedConcept: string): {isCorrect: boolean; similarity: number; feedback: string} => {
    setIsVerifying(true);
    try {
      // Calculer la similarité entre la réponse de l'utilisateur et le concept attendu
      const similarity = calculateSimilarity(userResponse, expectedConcept);
      
      // Déterminer si la réponse est correcte (seuil de 80%)
      const isCorrect = similarity >= 0.8;
      
      // Générer un feedback approprié
      let feedback = "";
      if (isCorrect) {
        feedback = "Bonne réponse !";
      } else if (similarity >= 0.6) {
        feedback = "Vous êtes proche ! Essayez avec une formulation légèrement différente.";
      } else if (similarity >= 0.4) {
        feedback = "Vous êtes sur la bonne voie, mais ce n'est pas tout à fait ça.";
      } else {
        feedback = "Ce n'est pas le concept attendu. Essayez de vous rappeler les concepts clés du chapitre.";
      }
      
      const result = { isCorrect, similarity, feedback };
      setVerificationResponse(result);
      return result;
    } catch (err) {
      console.error("Erreur lors de la vérification:", err);
      const result = {
        isCorrect: false,
        similarity: 0,
        feedback: "Une erreur est survenue lors de la vérification. Veuillez réessayer."
      };
      setVerificationResponse(result);
      return result;
    } finally {
      setIsVerifying(false);
    }
  };

  // Fonction pour afficher le feedback d'erreur
  const showIncorrectFeedback = () => {
    const inputElement = document.getElementById('concept-input');
    if (inputElement) {
      inputElement.classList.add('border-red-500');
      setTimeout(() => {
        inputElement.classList.remove('border-red-500');
      }, 1000);
    }
  };
  
  // Fonction pour passer au prochain concept non trouvé
  const moveToNextUnfoundConcept = () => {
    const remainingConcepts = concepts.filter(c => !foundConcepts.some(fc => fc.id === c.id));
    
    if (remainingConcepts.length === 0) {
      setIsComplete(true);
      // Sauvegarder la progression
      setTimeout(() => saveProgress(), 100);
      return;
    }
    
    // Trouver le prochain concept non trouvé après l'index actuel
    let nextIndex = currentConceptIndex;
    let found = false;
    
    // Parcourir à partir de l'index actuel + 1
    for (let i = 1; i <= concepts.length; i++) {
      const checkIndex = (currentConceptIndex + i) % concepts.length;
      if (!foundConcepts.some(fc => fc.id === concepts[checkIndex].id)) {
        nextIndex = checkIndex;
        found = true;
        break;
      }
    }
    
    if (found) {
      setCurrentConceptIndex(nextIndex);
      setUserInput('');
      setHintLevel(0); // Réinitialiser le niveau d'indice
      setLockedToCurrentConcept(false); // Déverrouiller
      // Sauvegarder la progression
      setTimeout(() => saveProgress(), 100);
    } else {
      setIsComplete(true); // Tous les concepts ont été trouvés
      // Sauvegarder la progression
      setTimeout(() => saveProgress(), 100);
    }
  };
  
  // Vérifier si l'utilisateur a trouvé un concept
  const checkAnswer = async () => {
    if (!userInput.trim()) {
      return; // Ne rien faire si l'entrée est vide
    }
    
    // Si l'utilisateur est verrouillé sur le concept actuel
    if (lockedToCurrentConcept && currentConceptIndex < concepts.length) {
      const currentConcept = concepts[currentConceptIndex];
      
      // Vérification avec l'algorithme local
      const result = verifyAnswer(userInput, currentConcept.name);
      const isCorrect = result.isCorrect;
      
      // Si la réponse est correcte, le concept est considéré comme trouvé
      if (isCorrect) {
        // Ajouter le concept aux concepts trouvés s'il n'y est pas déjà
        if (!foundConcepts.some(c => c.id === currentConcept.id)) {
          const updatedFoundConcepts = [...foundConcepts, currentConcept];
          setFoundConcepts(updatedFoundConcepts);
          
          // Réinitialiser l'entrée utilisateur et le niveau d'indice
          setUserInput('');
          setHintLevel(0);
          setLockedToCurrentConcept(false);
          setVerificationResponse(null); // Réinitialiser la réponse de vérification
          
          // Vérifier si tous les concepts ont été trouvés
          if (updatedFoundConcepts.length === concepts.length) {
            setIsComplete(true);
            await saveProgress(); // Sauvegarder la progression
          }
        }
      } else {
        // Afficher un feedback d'erreur
        showIncorrectFeedback();
      }
      return;
    }
    
    // Si l'utilisateur n'est pas verrouillé, vérifier tous les concepts non trouvés
    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      
      // Ignorer les concepts déjà trouvés
      if (foundConcepts.some(c => c.id === concept.id)) {
        continue;
      }
      
      // Vérification avec l'algorithme local
      const result = verifyAnswer(userInput, concept.name);
      const isCorrect = result.isCorrect;
      
      // Si la réponse est correcte, le concept est considéré comme trouvé
      if (isCorrect) {
        const updatedFoundConcepts = [...foundConcepts, concept];
        setFoundConcepts(updatedFoundConcepts);
        setUserInput('');
        setVerificationResponse(null); // Réinitialiser la réponse de vérification
        
        // Mettre à jour l'index du concept actuel pour le prochain concept non trouvé
        moveToNextUnfoundConcept();
        
        // Vérifier si tous les concepts ont été trouvés
        if (updatedFoundConcepts.length === concepts.length) {
          setIsComplete(true);
        }
        
        setUserInput('');
        return;
      }
    }
    
    // Si aucune correspondance n'a été trouvée
    showIncorrectFeedback();
  };

  // Fonction pour recommencer l'exercice
  const resetExercise = async () => {
    // Confirmation avant de réinitialiser
    if (window.confirm("Êtes-vous sûr de vouloir recommencer l'exercice ? Tous les concepts trouvés seront réinitialisés.")) {
      setFoundConcepts([]);
      setCurrentConceptIndex(0);
      setHintLevel(0);
      setUserInput('');
      setIsComplete(false);
      setLockedToCurrentConcept(false);
      setVerificationResponse(null);
      
      // Mélanger à nouveau les concepts
      const shuffledConcepts = [...concepts].sort(() => Math.random() - 0.5);
      setConcepts(shuffledConcepts);
      
      // Sauvegarder la progression réinitialisée
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
        
        // Préparer les données à enregistrer (réinitialisation)
        const progressData = {
          activity_id: activity.id,
          chapter_id: chapterId,
          user_id: userId,
          found_concepts: [],
          current_concept_index: 0,
          is_complete: false,
          updated_at: new Date().toISOString()
        };
        
        // Enregistrer dans Supabase
        const { error } = await supabase
          .from('activity_memorization_progress')
          .upsert([progressData], { 
            onConflict: 'activity_id,user_id' 
          });
        
        if (error) {
          console.error('Erreur lors de la réinitialisation de la progression:', error);
        } else {
          console.log('Progression réinitialisée avec succès');
        }
      } catch (error) {
        console.error('Exception lors de la réinitialisation de la progression:', error);
      }
    }
  };

  // Afficher un indice progressif
  const showConceptHint = () => {
    // Verrouiller sur le concept actuel une fois qu'un indice est donné
    setLockedToCurrentConcept(true);
    
    // Augmenter le niveau d'indice (max 4)
    setHintLevel((prev: number) => Math.min(prev + 1, 4));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkAnswer();
  };

  // Effet pour gérer la complétion de l'activité
  useEffect(() => {
    if (isComplete) {
      saveProgress();
      // Informer l'étape suivante que cette étape est terminée seulement si tous les concepts sont trouvés
      if (foundConcepts.length === concepts.length) {
        onNext();
      }
    }
  }, [isComplete, foundConcepts.length, concepts.length, onNext]);
  
  // Effet pour sauvegarder la progression à chaque fois que les concepts trouvés changent
  useEffect(() => {
    if (foundConcepts.length > 0) {
      saveProgress();
    }
  }, [foundConcepts]);
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Loader2 className="h-12 w-12 text-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Chargement des concepts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
          <AlertCircle className="text-red-500 w-6 h-6 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Erreur</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-red-700 mt-2">Veuillez d'abord compléter l'étape d'élaboration des concepts clés.</p>
          </div>
        </div>
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start">
          <AlertCircle className="text-yellow-500 w-6 h-6 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Aucun concept trouvé</h3>
            <p className="text-yellow-700">Vous n'avez pas encore créé de concepts pour cette activité.</p>
            <p className="text-yellow-700 mt-2">Veuillez d'abord compléter l'étape d'élaboration des concepts clés.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start mb-6">
          <div className="bg-green-50 p-3 rounded-lg mr-4">
            <CheckCircle className="text-green-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Identification terminée !</h2>
            <p className="text-gray-600">
              Vous avez identifié {foundConcepts.length} concept(s) sur {concepts.length}.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Concepts trouvés</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {foundConcepts.map(concept => (
              <div 
                key={concept.id} 
                className="bg-white rounded-lg border border-green-500 p-3 shadow-sm relative overflow-hidden"
                style={{
                  boxShadow: '0 2px 3px -1px rgba(74, 222, 128, 0.1), 0 1px 2px -1px rgba(74, 222, 128, 0.06)',
                }}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <div className="flex items-center pl-2">
                  <div className="bg-green-500 rounded-full p-1 mr-2 flex-shrink-0 shadow-sm">
                    <CheckCircle className="text-white w-3 h-3" />
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm truncate">{concept.name}</h3>
                </div>
              </div>
            ))}
            
            {concepts.filter(c => !foundConcepts.some(fc => fc.id === c.id)).map(concept => (
              <div 
                key={concept.id} 
                className="bg-white rounded-lg border border-gray-300 p-3 shadow-sm relative overflow-hidden"
                style={{
                  boxShadow: '0 2px 3px -1px rgba(156, 163, 175, 0.1), 0 1px 2px -1px rgba(156, 163, 175, 0.06)',
                }}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gray-300"></div>
                <div className="flex items-center pl-2">
                  <div className="bg-gray-400 rounded-full p-1 mr-2 flex-shrink-0 shadow-sm">
                    <Brain className="text-white w-3 h-3" />
                  </div>
                  <h3 className="font-medium text-gray-400 text-sm truncate">{concept.name}</h3>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              onClick={onNext}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Passer à la restitution
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="flex items-start mb-6">
        <div className="bg-amber-50 p-3 rounded-lg mr-4">
          <Brain className="text-amber-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Retrouvez les concepts clés</h2>
          <p className="text-gray-600">
            Retrouvez les titres des concepts clés identifiés lors de votre dernière session d'étude. Il y a {concepts.length} concepts à identifier.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="bg-white rounded-lg border border-[#bd8c0f] p-4 h-full">
            <h3 className="text-base font-medium text-[#bd8c0f] mb-3">{foundConcepts.length} concept{foundConcepts.length !== 1 ? 's' : ''} sur {concepts.length}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="concept-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Entrez le titre du concept
                </label>
                <input
                  type="text"
                  id="concept-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Entrez le titre du concept"
                  autoComplete="off"
                />
                
                {hintLevel > 0 && (
                  <div className="mt-2 text-sm text-amber-600">
                    <span className="font-medium">Indice ({hintLevel}/4) :</span>
                    
                    {/* Niveau 1: Première lettre de chaque mot */}
                    {hintLevel === 1 && (
                      <div className="bg-blue-50 p-4 rounded-md mt-2">
                        <p className="text-blue-700 mb-2">Première lettre de chaque mot</p>
                        {concepts[currentConceptIndex]?.name.split(' ').map((word, idx) => (
                          <div key={idx} className="bg-blue-100 p-2 rounded-md mb-2">
                            {word.charAt(0)}{'_'.repeat(Math.max(0, word.length - 1))}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Niveau 2: Première et dernière lettre de chaque mot */}
                    {hintLevel === 2 && (
                      <div className="bg-blue-50 p-4 rounded-md mt-2">
                        <p className="text-blue-700 mb-2">Première et dernière lettre de chaque mot</p>
                        {concepts[currentConceptIndex]?.name.split(' ').map((word, idx) => (
                          <div key={idx} className="bg-blue-100 p-2 rounded-md mb-2">
                            {word.length > 1 ? 
                              `${word.charAt(0)}${'_'.repeat(Math.max(0, word.length - 2))}${word.charAt(word.length - 1)}` : 
                              word}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Niveau 3: Un mot sur deux */}
                    {hintLevel === 3 && (
                      <div className="bg-blue-50 p-4 rounded-md mt-2">
                        <p className="text-blue-700 mb-2">Un mot sur deux</p>
                        {concepts[currentConceptIndex]?.name.split(' ').map((word, idx) => (
                          <div key={idx} className="bg-blue-100 p-2 rounded-md mb-2">
                            {idx % 2 === 0 ? word : '_'.repeat(word.length)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Niveau 4: Réponse complète */}
                    {hintLevel === 4 && (
                      <div className="bg-blue-50 p-4 rounded-md mt-2">
                        <p className="text-blue-700 mb-2">Réponse complète</p>
                        {concepts[currentConceptIndex]?.name.split(' ').map((word, idx) => (
                          <div key={idx} className="bg-blue-100 p-2 rounded-md mb-2">
                            {word}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  type="submit"
                  variant="primary" 
                  className="bg-amber-500 hover:bg-amber-600 text-white flex-1"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    "Valider"
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={showConceptHint}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  disabled={isVerifying}
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Indice
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={resetExercise}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  disabled={isVerifying}
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Recommencer
                </Button>
              </div>
              
              {/* Affichage du feedback de vérification si disponible */}
              {verificationResponse && (
                <div className={`mt-4 p-3 rounded-md ${verificationResponse.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-start">
                    <CheckCircle className={`w-5 h-5 mr-2 flex-shrink-0 ${verificationResponse.isCorrect ? 'text-green-500' : 'text-amber-500'}`} />
                    <div>
                      <p className={`font-medium ${verificationResponse.isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                        {verificationResponse.isCorrect ? 'Concept correctement identifié' : 'Concept non identifié'}
                      </p>
                      <p className="text-sm mt-1">{verificationResponse.feedback}</p>
                      {!verificationResponse.isCorrect && verificationResponse.similarity > 0.5 && (
                        <p className="text-sm mt-1 text-amber-600">Vous êtes proche ! ({Math.round(verificationResponse.similarity * 100)}% de similarité)</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Concepts trouvés</h3>
            
            {foundConcepts.length > 0 ? (
              <div className="space-y-3">
                {foundConcepts.map((concept) => (
                  <div 
                    key={concept.id} 
                    className="bg-green-50 rounded-lg border border-green-200 p-3 flex items-center"
                  >
                    <div className="bg-green-100 rounded-full p-1.5 mr-2 flex-shrink-0">
                      <CheckCircle className="text-green-600 w-4 h-4" />
                    </div>
                    <span className="text-gray-800">{concept.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">Aucun concept trouvé pour le moment.</p>
                <p className="text-gray-500 text-sm mt-1">Essayez de vous rappeler des concepts clés que vous avez identifiés.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorizationIdentificationStep;
