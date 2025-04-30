import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../components/common/Button';

interface StepNavigationProps {
  currentStep: 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion';
  navigateToStep: (step: 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion') => void;
  hasStarted: boolean;
  activityType?: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video' | 'concepts_cles' | 'memorization_concepts' | 'mindmapping';
}

const StepNavigation: React.FC<StepNavigationProps> = ({ 
  currentStep, 
  navigateToStep,
  hasStarted,
  activityType = 'lecture_active'
}) => {
  // Déterminer la variante de bouton en fonction du type d'activité
  // Nous utilisons 'gold' pour les concepts clés car c'est une variante acceptée par le composant Button
  // Définir l'ordre des étapes en fonction du type d'activité
  const steps: ('introduction' | 'lecture' | 'prise_de_note' | 'conclusion')[] = 
    activityType === 'concepts_cles' || activityType === 'memorization_concepts'
      ? [
          'introduction',
          'lecture',
          'conclusion'
        ]
      : [
          'introduction',
          'lecture',
          'prise_de_note',
          'conclusion'
        ];
  
  // Trouver l'index de l'étape actuelle
  const currentIndex = steps.indexOf(currentStep);
  
  // Déterminer les étapes précédente et suivante
  const previousStep = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  
  // Fonction pour obtenir le nom d'affichage d'une étape
  const getStepDisplayName = (step: 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion'): string => {
    switch (step) {
      case 'introduction':
        return 'Introduction';
      case 'lecture':
        if (activityType === 'concepts_cles') return 'Concepts clés';
        if (activityType === 'memorization_concepts') return 'Mémorisation';
        if (activityType === 'mindmapping') return 'Mindmap manuscrite';
        return 'Lecture';
      case 'prise_de_note':
        if (activityType === 'mindmapping') return 'Mindmap numérique';
        return 'Prise de notes';
      case 'conclusion':
        return 'Conclusion';
      default:
        return '';
    }
  };
  
  return (
    <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
      <Button 
        variant="gold" 
        onClick={() => previousStep && navigateToStep(previousStep)}
        disabled={!hasStarted || !previousStep}
      >
        <ChevronLeft size={16} className="mr-1" />
        {previousStep ? getStepDisplayName(previousStep) : 'Précédente'}
      </Button>
      
      <Button 
        variant="gold" 
        onClick={() => nextStep && navigateToStep(nextStep)}
        disabled={!hasStarted || !nextStep}
      >
        {nextStep ? getStepDisplayName(nextStep) : 'Suivante'}
        <ChevronRight size={16} className="ml-1" />
      </Button>
    </div>
  );
};

export default StepNavigation;
