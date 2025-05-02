import React, { useState } from 'react';
import MemorizationIntroStep from './MemorizationIntroStep';
import MemorizationIdentificationStep from './MemorizationIdentificationStep';
import MemorizationRestitutionStep from './MemorizationRestitutionStep';
import MemorizationConclusionStep from './MemorizationConclusionStep';

interface Activity {
  id: string;
  title: string;
  type: string;
  introduction?: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MemorizationActivityProps {
  activity: Activity;
  onComplete: () => void;
}

// Étapes de l'activité de mémorisation
enum MemorizationStep {
  INTRODUCTION = 'introduction',
  IDENTIFICATION = 'identification',
  RESTITUTION = 'restitution',
  CONCLUSION = 'conclusion'
}

const MemorizationActivity: React.FC<MemorizationActivityProps> = ({ activity, onComplete }) => {
  // État pour suivre l'étape actuelle
  const [currentStep, setCurrentStep] = useState<MemorizationStep>(MemorizationStep.INTRODUCTION);
  
  // État pour stocker le score
  const [score, setScore] = useState<number>(0);
  const [totalPossibleScore, setTotalPossibleScore] = useState<number>(30);

  // Fonctions pour naviguer entre les étapes
  const goToIdentification = () => {
    setCurrentStep(MemorizationStep.IDENTIFICATION);
  };

  const goToRestitution = () => {
    setCurrentStep(MemorizationStep.RESTITUTION);
  };

  const goToConclusion = (score: number, totalPossible: number) => {
    setScore(score);
    setTotalPossibleScore(totalPossible);
    setCurrentStep(MemorizationStep.CONCLUSION);
  };

  // Rendu conditionnel en fonction de l'étape actuelle
  switch (currentStep) {
    case MemorizationStep.INTRODUCTION:
      return <MemorizationIntroStep activity={activity} onNext={goToIdentification} />;
      
    case MemorizationStep.IDENTIFICATION:
      return <MemorizationIdentificationStep activity={activity} onNext={goToRestitution} />;
      
    case MemorizationStep.RESTITUTION:
      return (
        <MemorizationRestitutionStep 
          activity={activity} 
          onNext={() => goToConclusion(score, totalPossibleScore)} 
        />
      );
      
    case MemorizationStep.CONCLUSION:
      return (
        <MemorizationConclusionStep 
          activity={activity} 
          score={score}
          totalPossibleScore={totalPossibleScore}
          onComplete={onComplete} 
        />
      );
      
    default:
      return <MemorizationIntroStep activity={activity} onNext={goToIdentification} />;
  }
};

export default MemorizationActivity;
