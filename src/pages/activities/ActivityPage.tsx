import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import { supabase } from '../../lib/supabaseClient';

// Import des composants modulaires
import ActivityHeader from './components/ActivityHeader';
import ActivityProgress from './components/ActivityProgress';
import StepNavigation from './components/StepNavigation';
import IntroductionStep from './components/ActivitySteps/IntroductionStep';
import LectureStep from './components/ActivitySteps/LectureStep';
import NoteStep from './components/ActivitySteps/NoteStep/NoteStep';
import ConclusionStep from './components/ActivitySteps/ConclusionStep';
import ConceptsStep from './components/ActivitySteps/ConceptsStep';
import MemorizationIdentificationStep from './components/ActivitySteps/MemorizationIdentificationStep';
import MemorizationRestitutionStep from './components/ActivitySteps/MemorizationRestitutionStep';

// Import des composants de mindmapping
import MindmappingIntroStep from './components/ActivitySteps/MindmappingIntroStep';
import MindmappingManualStep from './components/ActivitySteps/MindmappingManualStep';
import MindmappingDigitalStep from './components/ActivitySteps/MindmappingDigitalStep';

// Définition des types
interface Activity {
  id: string;
  title: string;
  type: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video' | 'concepts_cles' | 'memorization_concepts' | 'mindmapping';
  content: string;
  introduction: string;
  conclusion: string;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterTitle: string;
  nextActivityId?: string;
  previousActivityId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  pdfUrl?: string;
  chapterPdfUrl?: string; // URL du PDF du chapitre depuis Supabase
}

const ActivityPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const navigate = useNavigate();
  
  // États
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'introduction' | 'lecture' | 'prise_de_note' | 'conclusion'>('introduction');
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // États pour le score de mémorisation - utilisés par MemorizationRestitutionStep
  const [, setMemorisationScore] = useState<number>(0);
  const [, setMemorisationTotalScore] = useState<number>(30);
  
  // États pour le suivi du temps d'étude
  // Note: Ces variables sont utilisées dans d'autres parties du code
  const [isActive, setIsActive] = useState<boolean>(false); // si le compteur est actif
  const startTimeRef = useRef<number | null>(null); // timestamp de début de l'activité
  const activeTimeRef = useRef<number>(0); // temps actif cumulé
  // Définition du type FeedbackState pour correspondre au composant ConclusionStep.improved
  type FeedbackState = {
    rating: number;
    comment: string;
    clarity: '' | 'clear' | 'unclear' | 'very_unclear';
    usefulness: 1 | 2 | 3 | 4 | 5 | null;
    difficulty: '' | 'too_easy' | 'just_right' | 'too_difficult';
    understanding: number;
    examReadiness: number;
    needReinforcement: '' | 'yes' | 'maybe' | 'no';
  };
  
  const [feedback, setFeedback] = useState<FeedbackState>({ 
    rating: 0, 
    comment: '',
    clarity: '',
    usefulness: null,
    difficulty: '',
    understanding: 0,
    examReadiness: 0,
    needReinforcement: ''
  });
  
  // Effet pour gérer le suivi du temps quand l'utilisateur quitte la page ou change d'onglet
  useEffect(() => {
    // Fonction pour gérer quand l'utilisateur quitte la page ou change d'onglet
    const handleVisibilityChange = () => {
      if (!activity) return;
      
      if (document.visibilityState === 'hidden') {
        // L'utilisateur a quitté la page ou changé d'onglet
        if (isActive && startTimeRef.current) {
          // Calculer le temps passé jusqu'à maintenant et l'ajouter au temps actif
          const currentSessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          activeTimeRef.current += currentSessionTime;
          
          // Sauvegarder dans localStorage
          localStorage.setItem(`activity_active_time_${activity.id}`, activeTimeRef.current.toString());
          
          // Réinitialiser le temps de début
          startTimeRef.current = null;
          setIsActive(false);
        }
      } else if (document.visibilityState === 'visible' && hasStarted) {
        // L'utilisateur est revenu sur la page
        if (!isActive) {
          startTimeRef.current = Date.now();
          setIsActive(true);
        }
      }
    };
    
    // Ajouter l'écouteur d'événement
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Si l'utilisateur quitte la page pendant que le compteur est actif, sauvegarder le temps
      if (activity && isActive && startTimeRef.current) {
        const currentSessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const totalTime = activeTimeRef.current + currentSessionTime;
        localStorage.setItem(`activity_active_time_${activity.id}`, totalTime.toString());
      }
    };
  }, [activity, isActive, hasStarted]);
  
  // Chargement des données de l'activité et restauration du temps d'étude
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Récupérer les informations du chapitre depuis Supabase pour obtenir l'URL du PDF
        // L'URL sera récupérée en fonction du chapitre de l'activité
        
        try {
          // Simulation d'un appel API pour récupérer les détails de l'activité
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Données temporaires pour l'exemple
          const tempActivity: Activity = {
            id: activityId || '1',
            title: 'Comprendre les concepts clés',
            introduction: 'Dans cette activité, vous allez explorer les concepts fondamentaux présentés dans ce chapitre.',
            content: '',
            conclusion: 'Félicitations ! Vous avez complété cette activité de prise de notes structurée.',
            courseId: returnTo || '1',
            courseName: 'Introduction à la psychologie',
            chapterId: '1',
            chapterTitle: 'Les bases de la psychologie cognitive',
            status: 'in_progress',
            // Définir le type d'activité en fonction de l'identifiant
            type: activityId === 'a1-ch0-step2' ? 'concepts_cles' : 
                  activityId === 'a2-ch0-step3' ? 'memorization_concepts' :
                  activityId === 'a2-ch0-step4' ? 'mindmapping' : 'lecture_active',
            chapterPdfUrl: 'https://fpxwfjicjnrihmmbkwew.supabase.co/storage/v1/object/public/chapters/a682d2f5-a453-450c-befd-dbef55086ffd/1745629048170_psycho-pages-2.pdf'
          };
          
          setActivity(tempActivity);
          
          // Restaurer le temps d'étude depuis localStorage si disponible
          const savedStartTime = localStorage.getItem(`activity_start_${tempActivity.id}`);
          const savedActiveTime = localStorage.getItem(`activity_active_time_${tempActivity.id}`);
          
          if (savedStartTime && savedActiveTime) {
            // Convertir les valeurs sauvegardées
            const startTime = parseInt(savedStartTime, 10);
            const activeTime = parseInt(savedActiveTime, 10);
            
            // Si l'activité était en cours, reprendre le compteur
            if (startTime) {
              startTimeRef.current = startTime;
              activeTimeRef.current = activeTime;
              setIsActive(true);
              setHasStarted(true);
            }
          }
        } catch (err) {
          console.error('Erreur lors de la récupération du PDF:', err);
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Impossible de charger cette activité');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivity();
  }, [activityId]);
  
  // Fonctions de navigation et d'interaction
  const startActivity = async () => {
    setHasStarted(true);
    setStep('lecture');
    
    // Démarrer le suivi du temps d'étude
    startTimeRef.current = Date.now();
    setIsActive(true);
    
    // Enregistrer le début de l'activité dans localStorage
    if (activity) {
      localStorage.setItem(`activity_start_${activity.id}`, startTimeRef.current.toString());
      localStorage.setItem(`activity_active_time_${activity.id}`, '0');
    }
  };
  
  const navigateToStep = (newStep: 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion') => {
    if (hasStarted) {
      setStep(newStep);
    }
  };
  
  
  // Fonction pour calculer le temps total d'étude
  const calculateTotalStudyTime = (): number => {
    if (!isActive || !startTimeRef.current) return activeTimeRef.current;
    
    // Ajouter le temps de la session actuelle au temps actif cumulé
    const currentSessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    return activeTimeRef.current + currentSessionTime;
  };
  
  // Fonction pour soumettre le feedback et enregistrer le temps d'étude
  const submitFeedback = async () => {
    if (!activity) return;
    
    setIsCompleting(true);
    
    // Arrêter le compteur de temps
    setIsActive(false);
    const totalStudyTimeInSeconds = calculateTotalStudyTime();
    
    try {
      // Récupérer l'utilisateur actuel
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      if (!userId) {
        console.error('No user ID found');
        alert("Erreur: Utilisateur non connecté");
        setIsCompleting(false);
        return;
      }
      
      // Préparer les données à enregistrer
      const feedbackData = {
        activity_id: activity.id,
        user_id: userId,
        activity_type: activity.type,         // Utiliser le type d'activité (lecture_active, quiz, etc.)
        activity_title: activity.title,       // Colonne pour le titre de l'activité
        feedback: {
          ...feedback,
          study_time_seconds: totalStudyTimeInSeconds,
          submitted_at: new Date().toISOString()
        }
      };
      
      console.log('Enregistrement du feedback:', feedbackData);
      
      // Enregistrer dans Supabase
      const { error } = await supabase
        .from('activity_feedback')
        .upsert([feedbackData], { 
          onConflict: 'activity_id,user_id' 
        });
      
      if (error) {
        console.error('Erreur lors de l\'enregistrement du feedback:', error);
        alert("Erreur lors de l'enregistrement: " + error.message);
      } else {
        console.log('Feedback enregistré avec succès');
        
        // Nettoyer les données de temps dans localStorage
        localStorage.removeItem(`activity_start_${activity.id}`);
        localStorage.removeItem(`activity_active_time_${activity.id}`);
        
        // Redirection vers la page du parcours
        navigate(`/parcours/${returnTo || activity.courseId}`);
      }
    } catch (error) {
      console.error('Exception lors de la soumission du feedback:', error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsCompleting(false);
    }
  };
  
  // Affichage selon l'état de chargement
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }
  
  if (error || !activity) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md flex items-center gap-2">
        <AlertCircle size={18} />
        <p>{error || "Impossible de charger cette activité"}</p>
      </div>
    );
  }
  
  // Rendu principal
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête avec navigation retour */}
      <ActivityHeader activity={activity} returnTo={returnTo} />
      
      {/* Barre de progression */}
      <ActivityProgress 
        currentStep={step} 
        hasStarted={hasStarted} 
        navigateToStep={navigateToStep}
        activityType={activity.type as 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video' | 'concepts_cles' | 'memorization_concepts' | 'mindmapping'}
      />
      
      {/* Contenu de l'activité */}
      <Card className="p-6">
        {step === 'introduction' && activity.type !== 'mindmapping' && (
          <IntroductionStep 
            activity={activity} 
            startActivity={startActivity} 
            isCompleting={isCompleting} 
          />
        )}
        
        {step === 'lecture' && activity.type === 'lecture_active' && (
          <LectureStep activity={activity} />
        )}
        
        {step === 'lecture' && activity.type === 'concepts_cles' && (
          <ConceptsStep activity={activity} />
        )}
        
        {step === 'lecture' && activity.type === 'memorization_concepts' && (
          <MemorizationIdentificationStep 
            activity={activity} 
            onNext={() => navigateToStep('prise_de_note')} 
          />
        )}
        
        {step === 'introduction' && activity.type === 'mindmapping' && (
          <MindmappingIntroStep 
            activity={activity} 
            onNext={() => navigateToStep('lecture')} 
          />
        )}
        
        {step === 'lecture' && activity.type === 'mindmapping' && (
          <MindmappingManualStep 
            activity={activity} 
            onNext={() => navigateToStep('prise_de_note')} 
          />
        )}
        
        {step === 'prise_de_note' && activity.type !== 'memorization_concepts' && activity.type !== 'mindmapping' && (
          <NoteStep activity={activity} />
        )}
        
        {step === 'prise_de_note' && activity.type === 'memorization_concepts' && (
          <MemorizationRestitutionStep 
            activity={activity} 
            onNext={(score, totalPossible) => {
              if (score !== undefined) setMemorisationScore(score);
              if (totalPossible !== undefined) setMemorisationTotalScore(totalPossible);
              navigateToStep('conclusion');
            }} 
          />
        )}
        
        {step === 'prise_de_note' && activity.type === 'mindmapping' && (
          <MindmappingDigitalStep 
            activity={activity} 
            onNext={() => navigateToStep('conclusion')} 
          />
        )}
        
        {step === 'conclusion' && activity.type !== 'memorization_concepts' && (
          <ConclusionStep 
            activity={activity} 
            feedback={feedback} 
            setFeedback={setFeedback} 
            submitFeedback={submitFeedback} 
            isCompleting={isCompleting} 
          />
        )}
        
        {step === 'conclusion' && activity.type === 'memorization_concepts' && (
          <ConclusionStep 
            activity={activity} 
            feedback={feedback} 
            setFeedback={setFeedback} 
            submitFeedback={submitFeedback} 
            isCompleting={isCompleting} 
          />
        )}
      </Card>
      
      {/* Navigation entre étapes */}
      <StepNavigation
        currentStep={step}
        navigateToStep={navigateToStep}
        hasStarted={hasStarted}
        activityType={activity.type as 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video' | 'concepts_cles' | 'memorization_concepts' | 'mindmapping'}
      />
    </div>
  );
};

export default ActivityPage;
