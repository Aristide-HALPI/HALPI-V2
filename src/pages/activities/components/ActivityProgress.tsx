import React from 'react';

type StepType = 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion';

interface ActivityProgressProps {
  currentStep: StepType;
  hasStarted: boolean;
  navigateToStep: (step: StepType) => void;
}

const ActivityProgress: React.FC<ActivityProgressProps> = ({ 
  currentStep, 
  hasStarted, 
  navigateToStep 
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div 
          className={`flex flex-col items-center ${currentStep === 'introduction' ? 'text-primary-600 font-medium' : 'text-gray-500'} cursor-pointer`}
          onClick={() => navigateToStep('introduction')}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'introduction' ? 'bg-primary-100 border-2 border-primary-500' : hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>1</div>
          <span className="text-xs">Introduction</span>
        </div>
        <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
        <div 
          className={`flex flex-col items-center ${currentStep === 'lecture' ? 'text-primary-600 font-medium' : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onClick={() => hasStarted && navigateToStep('lecture')}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'lecture' ? 'bg-primary-100 border-2 border-primary-500' : (currentStep === 'prise_de_note' || currentStep === 'conclusion') && hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>2</div>
          <span className="text-xs">Lecture</span>
        </div>
        <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
        <div 
          className={`flex flex-col items-center ${currentStep === 'prise_de_note' ? 'text-primary-600 font-medium' : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onClick={() => hasStarted && navigateToStep('prise_de_note')}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'prise_de_note' ? 'bg-primary-100 border-2 border-primary-500' : currentStep === 'conclusion' && hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>3</div>
          <span className="text-xs">Prise de note</span>
        </div>
        <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
        <div 
          className={`flex flex-col items-center ${currentStep === 'conclusion' ? 'text-primary-600 font-medium' : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onClick={() => hasStarted && navigateToStep('conclusion')}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'conclusion' ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'}`}>4</div>
          <span className="text-xs">Conclusion</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityProgress;
