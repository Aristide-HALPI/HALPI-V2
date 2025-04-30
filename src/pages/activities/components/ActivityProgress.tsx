import React from 'react';

type StepType = 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion';

interface ActivityProgressProps {
  currentStep: StepType;
  hasStarted: boolean;
  navigateToStep: (step: StepType) => void;
  activityType?: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video' | 'concepts_cles' | 'memorization_concepts' | 'mindmapping';
}

const ActivityProgress: React.FC<ActivityProgressProps> = ({ 
  currentStep, 
  hasStarted, 
  navigateToStep,
  activityType = 'lecture_active'
}) => {
  // Déterminer la couleur des étapes en fonction du type d'activité
  // Pour concepts_cles, memorization_concepts et mindmapping, on utilise amber-500 qui correspond à la teinte dorée exacte
  const primaryColor = (activityType === 'concepts_cles' || activityType === 'memorization_concepts' || activityType === 'mindmapping') ? 'amber' : 'primary';
  const amberShade = '500'; // La teinte exacte de doré à utiliser

  // Déterminer le libellé de l'étape 2 en fonction du type d'activité
  const getStep2Label = () => {
    switch (activityType) {
      case 'concepts_cles':
        return 'Concepts clés';
      case 'memorization_concepts':
        return 'Identification';
      case 'mindmapping':
        return 'Mindmap manuscrite';
      case 'quiz':
        return 'Questions';
      case 'pratique_deliberee':
        return 'Exercices';
      case 'video':
        return 'Vidéo';
      case 'lecture_active':
      default:
        return 'Lecture';
    }
  };
  
  // Déterminer le libellé de l'étape 3 en fonction du type d'activité
  const getStep3Label = () => {
    if (activityType === 'memorization_concepts') {
      return 'Restitution';
    }
    if (activityType === 'mindmapping') {
      return 'Mindmap numérique';
    }
    return 'Prise de note';
  };
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div 
          className={`flex flex-col items-center ${currentStep === 'introduction' ? `text-${primaryColor === 'amber' ? `${primaryColor}-${amberShade}` : `${primaryColor}-600`} font-medium` : 'text-gray-500'} cursor-pointer`}
          onClick={() => navigateToStep('introduction')}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'introduction' ? `bg-${primaryColor}-100 border-2 border-${primaryColor}-${primaryColor === 'amber' ? amberShade : '500'}` : hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>1</div>
          <span className="text-xs">Introduction</span>
        </div>
        <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
        <div 
          className={`flex flex-col items-center ${currentStep === 'lecture' ? `text-${primaryColor === 'amber' ? `${primaryColor}-${amberShade}` : `${primaryColor}-600`} font-medium` : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onClick={() => hasStarted && navigateToStep('lecture')}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'lecture' ? `bg-${primaryColor}-100 border-2 border-${primaryColor}-${primaryColor === 'amber' ? amberShade : '500'}` : (currentStep === 'prise_de_note' || currentStep === 'conclusion') && hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>2</div>
          <span className="text-xs">{getStep2Label()}</span>
        </div>
        {activityType !== 'concepts_cles' && (
          <>
            <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
            <div 
              className={`flex flex-col items-center ${currentStep === 'prise_de_note' ? `text-${primaryColor === 'amber' ? `${primaryColor}-${amberShade}` : `${primaryColor}-600`} font-medium` : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => hasStarted && navigateToStep('prise_de_note')}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'prise_de_note' ? `bg-${primaryColor}-100 border-2 border-${primaryColor}-${primaryColor === 'amber' ? amberShade : '500'}` : currentStep === 'conclusion' && hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>3</div>
              <span className="text-xs">{getStep3Label()}</span>
            </div>
          </>
        )}
        <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
        <div 
          className={`flex flex-col items-center ${currentStep === 'conclusion' ? `text-${primaryColor === 'amber' ? `${primaryColor}-${amberShade}` : `${primaryColor}-600`} font-medium` : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onClick={() => hasStarted && navigateToStep('conclusion')}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'conclusion' ? `bg-${primaryColor}-100 border-2 border-${primaryColor}-${primaryColor === 'amber' ? amberShade : '500'}` : 'bg-gray-100'}`}>{activityType === 'concepts_cles' ? 3 : 4}</div>
          <span className="text-xs">Conclusion</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityProgress;
