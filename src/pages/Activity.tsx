import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { StandardActivityData, KeyConcepts2ActivityData } from '../types/shared';

// Import des composants d'activités
import ReadingActivity from '../components/activities/ReadingActivity';
import NoteTakingActivity from '../components/activities/NoteTakingActivity';
import KeyConceptsActivity from '../components/activities/KeyConceptsActivity';
import { KeyConcepts2Activity } from '../components/activities/KeyConcepts2Activity';
import StructuredRecallActivity from '../components/activities/StructuredRecallActivity';
import EvaluationActivity from '../components/activities/EvaluationActivity';
import QuizActivity from '../components/activities/QuizActivity';
import { QuizPreparationActivity } from '../components/activities/QuizPreparationActivity';

export function Activity() {
  const { pathId, stepId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<StandardActivityData | null>(null);

  useEffect(() => {
    async function loadActivity() {
      if (!user || !pathId || !stepId) return;

      try {
        const pathDoc = await getDoc(doc(db, 'learningPaths', pathId));
        if (!pathDoc.exists()) {
          console.error('Path not found');
          return;
        }

        const pathData = pathDoc.data();
        let foundStep: any = null;
        let foundPhase: any = null;

        // Rechercher l'étape dans toutes les phases
        for (const phase of pathData.phases) {
          if (phase.chapters) {
            for (const chapter of phase.chapters) {
              const step = chapter.steps.find((s: any) => s.id === stepId);
              if (step) {
                foundStep = step;
                foundPhase = phase;
                break;
              }
            }
          } else if (phase.steps) {
            const step = phase.steps.find((s: any) => s.id === stepId);
            if (step) {
              foundStep = step;
              foundPhase = phase;
              break;
            }
          }
          if (foundStep) break;
        }

        if (!foundStep || !foundPhase) {
          console.error('Step not found');
          return;
        }

        setActivityData({
          step: foundStep,
          phase: foundPhase,
          pathId,
          pathData
        });
      } catch (error) {
        console.error('Error loading activity:', error);
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [user, pathId, stepId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement de l'activité...</p>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Activité non trouvée</p>
      </div>
    );
  }

  // Déterminer quel composant afficher en fonction de l'ID de l'étape
  const renderActivity = () => {
    if (stepId?.startsWith('lecture-')) {
      return <ReadingActivity data={activityData} />;
    }
    if (stepId?.startsWith('notes-')) {
      return <NoteTakingActivity data={activityData} />;
    }
    if (stepId?.startsWith('concepts-')) {
      return <KeyConceptsActivity data={activityData} />;
    }
    if (stepId?.startsWith('concepts2-')) {
      const keyConcepts2Data: KeyConcepts2ActivityData = {
        ...activityData!,
        phase: 'identification'  // ou 'explanation' selon le contexte
      };
      return <KeyConcepts2Activity data={keyConcepts2Data} />;
    }
    if (stepId?.startsWith('rappel-')) {
      return <StructuredRecallActivity data={activityData} />;
    }
    if (stepId?.startsWith('evaluation-')) {
      return <EvaluationActivity data={activityData} />;
    }
    if (stepId === 'quiz-intro') {
      return <QuizPreparationActivity data={{
        courseId: activityData?.pathData?.courseId,
        courseName: activityData?.pathData?.courseTitle || '',
        chapterId: activityData?.pathId || '',
        chapterNumber: activityData?.pathData?.chapterNumber || 0,
        phase: activityData?.phase
      }} />;
    }
    if (stepId?.startsWith('quiz')) {
      return <QuizActivity data={activityData} />;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Type d'activité non reconnu</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {renderActivity()}
      </div>
    </div>
  );
}