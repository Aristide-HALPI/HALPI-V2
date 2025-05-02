import React, { useState } from 'react';
import MindmappingIntroStep from './MindmappingIntroStep';
import MindmappingManualStep from './MindmappingManualStep';
import MindmappingDigitalStep from './MindmappingDigitalStep';
import MemorizationConclusionStep from './MemorizationConclusionStep'; // Réutilisation du composant de conclusion

interface Activity {
  id: string;
  title: string;
  type: string;
  content: string;
  chapterId: string;
  introduction?: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MindmappingActivityProps {
  activity: Activity;
  onComplete: () => void;
}

// Étapes de l'activité de mindmapping
enum MindmappingStep {
  INTRODUCTION = 'introduction',
  MANUAL = 'manual',
  DIGITAL = 'digital',
  CONCLUSION = 'conclusion'
}

const MindmappingActivity: React.FC<MindmappingActivityProps> = ({ activity, onComplete }) => {
  // État pour suivre l'étape actuelle
  const [currentStep, setCurrentStep] = useState<MindmappingStep>(MindmappingStep.INTRODUCTION);
  
  // État pour stocker le score
  const [score, setScore] = useState<number>(0);
  const [totalPossibleScore, setTotalPossibleScore] = useState<number>(30);

  // Fonctions pour naviguer entre les étapes
  const goToManual = () => {
    setCurrentStep(MindmappingStep.MANUAL);
  };

  const goToDigital = () => {
    setCurrentStep(MindmappingStep.DIGITAL);
  };

  const goToConclusion = (score: number = 0, totalPossible: number = 30) => {
    setScore(score);
    setTotalPossibleScore(totalPossible);
    setCurrentStep(MindmappingStep.CONCLUSION);
  };

  // Rendu conditionnel en fonction de l'étape actuelle
  switch (currentStep) {
    case MindmappingStep.INTRODUCTION:
      return <MindmappingIntroStep activity={activity} onNext={goToManual} />;
      
    case MindmappingStep.MANUAL:
      return <MindmappingManualStep activity={activity} onNext={goToDigital} />;
      
    case MindmappingStep.DIGITAL:
      return (
        <MindmappingDigitalStep 
          activity={activity} 
          onNext={() => goToConclusion()} 
        />
      );
      
    case MindmappingStep.CONCLUSION:
      return (
        <MemorizationConclusionStep 
          activity={activity} 
          score={score}
          totalPossibleScore={totalPossibleScore}
          onComplete={onComplete} 
        />
      );
      
    default:
      return <MindmappingIntroStep activity={activity} onNext={goToManual} />;
  }
};

export default MindmappingActivity;
