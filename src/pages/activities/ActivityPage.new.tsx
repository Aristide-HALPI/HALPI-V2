import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';

// Import des composants modulaires
import ActivityHeader from './components/ActivityHeader';
import ActivityProgress from './components/ActivityProgress';
import ActivityNavigation from './components/ActivityNavigation';
import IntroductionStep from './components/ActivitySteps/IntroductionStep';
import LectureStep from './components/ActivitySteps/LectureStep';
import NoteStep from './components/ActivitySteps/NoteStep/NoteStep';
import ConclusionStep from './components/ActivitySteps/ConclusionStep';

// Définition des types
interface Activity {
  id: string;
  title: string;
  type: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video';
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
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  
  // Chargement des données de l'activité
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
            type: 'lecture_active',
            chapterPdfUrl: 'https://fpxwfjicjnrihmmbkwew.supabase.co/storage/v1/object/public/chapters/a682d2f5-a453-450c-befd-dbef55086ffd/1745629048170_psycho-pages-2.pdf'
          };
          
          setActivity(tempActivity);
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
  };
  
  const navigateToStep = (newStep: 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion') => {
    if (hasStarted) {
      setStep(newStep);
    }
  };
  
  const navigateToActivity = (activityId: string) => {
    navigate(`/activities/${activityId}?returnTo=${returnTo || activity?.courseId}`);
  };
  
  const submitFeedback = async () => {
    if (!activity) return;
    
    setIsCompleting(true);
    
    try {
      // Simulation d'un appel API pour soumettre le feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirection vers la page du parcours
      navigate(`/parcours/${returnTo || activity.courseId}`);
      
    } catch (error) {
      console.error('Erreur lors de la soumission du feedback:', error);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête avec navigation retour */}
      <ActivityHeader activity={activity} returnTo={returnTo} />
      
      {/* Barre de progression */}
      <ActivityProgress 
        currentStep={step} 
        hasStarted={hasStarted} 
        navigateToStep={navigateToStep} 
      />
      
      {/* Contenu de l'activité */}
      <Card className="p-6">
        {step === 'introduction' && (
          <IntroductionStep 
            activity={activity} 
            startActivity={startActivity} 
            isCompleting={isCompleting} 
          />
        )}
        
        {step === 'lecture' && (
          <LectureStep activity={activity} />
        )}
        
        {step === 'prise_de_note' && (
          <NoteStep activity={activity} />
        )}
        
        {step === 'conclusion' && (
          <ConclusionStep 
            activity={activity} 
            feedback={feedback} 
            setFeedback={setFeedback} 
            submitFeedback={submitFeedback} 
            isCompleting={isCompleting} 
          />
        )}
      </Card>
      
      {/* Navigation entre activités */}
      {(step === 'lecture' || step === 'prise_de_note') && (
        <ActivityNavigation 
          activity={activity} 
          navigateToActivity={navigateToActivity} 
        />
      )}
    </div>
  );
};

export default ActivityPage;
