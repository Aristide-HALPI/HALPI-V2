import React from 'react';
import Button from '../../../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  introduction: string;
  // Autres propriétés nécessaires
}

interface IntroductionStepProps {
  activity: Activity;
  startActivity: () => void;
  isCompleting: boolean;
}

const IntroductionStep: React.FC<IntroductionStepProps> = ({ 
  activity, 
  startActivity,
  isCompleting 
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center mr-4">
            <span className="text-amber-500 text-2xl">💡</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Introduction</h2>
        </div>
        <p className="text-gray-700 text-lg">{activity.introduction}</p>
      </div>
      
      {/* Carte principale */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="border-l-4 border-amber-500 px-6 py-5 bg-amber-50">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Une lecture active pour mieux apprendre</h3>
          <p className="text-gray-600">Découvre comment transformer ta façon d'étudier pour retenir plus efficacement</p>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Cette activité te propose une lecture active du cours, avec un objectif clair : t'aider à mieux comprendre et mieux mémoriser le contenu que tu viens d'étudier. Mais pour bien en profiter, il est important de comprendre la différence entre une lecture passive et une lecture active.
          </p>
          
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="text-amber-500 mr-2">●</span> 
            Lecture passive vs. lecture active
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center mb-3">
                <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-500 text-sm">✕</span>
                </div>
                <h5 className="font-medium text-gray-800">Lecture passive</h5>
              </div>
              <p className="text-gray-600">Tu lis le texte en le suivant des yeux, souvent de manière automatique, sans vraiment chercher à le comprendre en profondeur. Tu survoles les phrases, mais sans te poser de questions. Ton cerveau absorbe peu, et tu oublies rapidement ce que tu viens de lire.</p>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <div className="flex items-center mb-3">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-500 text-sm">✓</span>
                </div>
                <h5 className="font-medium text-gray-800">Lecture active</h5>
              </div>
              <p className="text-gray-600">Tu lis avec un objectif en tête. Tu questionnes le contenu, tu identifies les idées importantes, tu les reformules avec tes mots, tu les relies à d'autres connaissances. Ton cerveau s'engage, organise l'information, et la retient mieux.</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
            <div className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <span className="text-blue-500 text-lg">💡</span>
                </div>
              </div>
              <div>
                <p className="text-gray-700">
                  L'activité qui suit est conçue pour passer d'une lecture passive à une lecture active, grâce à une méthode simple de prise de notes structurée. Elle te permettra de structurer ton cours, de clarifier les notions clés et de te poser les bonnes questions pour progresser.
                </p>
              </div>
            </div>
          </div>
          
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="text-amber-500 mr-2">●</span> 
            Objectifs d'apprentissage
          </h4>
          
          <ul className="space-y-3 mb-6">
            {[
              'Comprendre les concepts clés présentés dans ce chapitre',
              'Développer une vision structurée du contenu',
              'Renforcer ta mémorisation des points importants',
              'Préparer efficacement tes révisions futures'
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-amber-500 mr-3 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="primary" 
          onClick={startActivity}
          isLoading={isCompleting}
          size="lg"
          className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Démarrer l'activité
        </Button>
      </div>
    </div>
  );
};

export default IntroductionStep;
