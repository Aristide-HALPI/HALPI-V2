import React from 'react';
import { CheckCircle, BookOpen, ArrowRight } from 'lucide-react';
import Button from '../../../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MemorizationConclusionStepProps {
  activity: Activity;
  score?: number;
  totalPossibleScore?: number;
  onComplete: () => void;
}

const MemorizationConclusionStep: React.FC<MemorizationConclusionStepProps> = ({ 
  activity, 
  score = 0, 
  totalPossibleScore = 30, 
  onComplete 
}) => {
  // Calculer le pourcentage de réussite
  const successPercentage = totalPossibleScore > 0 ? Math.round((score / totalPossibleScore) * 100) : 0;
  
  // Déterminer le message en fonction du score
  const getFeedbackMessage = () => {
    if (successPercentage >= 80) {
      return "Excellent ! Vous maîtrisez très bien ces concepts.";
    } else if (successPercentage >= 60) {
      return "Bon travail ! Vous avez une bonne compréhension des concepts.";
    } else if (successPercentage >= 40) {
      return "Vous êtes sur la bonne voie, mais certains concepts méritent d'être revus.";
    } else {
      return "Ces concepts nécessitent encore du travail. N'hésitez pas à revoir le chapitre.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="flex items-start mb-6">
        <div className="bg-green-50 p-3 rounded-lg mr-4">
          <CheckCircle className="text-green-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Félicitations !</h2>
          <p className="text-gray-600">
            Vous avez terminé l'activité de mémorisation des concepts clés.
          </p>
        </div>
      </div>
      
      {/* Carte de résumé */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="border-l-4 border-green-500 px-6 py-5 bg-green-50">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Résumé de votre performance</h3>
          <p className="text-gray-600">Voici un aperçu de votre capacité à restituer les concepts clés</p>
        </div>
        
        <div className="p-6">
          {/* Score */}
          <div className="mb-6 text-center">
            <div className="inline-block bg-amber-50 rounded-full p-4 mb-3">
              <div className="bg-amber-100 rounded-full p-3">
                <div className="bg-amber-500 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold">
                  {successPercentage}%
                </div>
              </div>
            </div>
            <p className="text-gray-700 font-medium">
              Score : {score} / {totalPossibleScore} points
            </p>
          </div>
          
          {/* Feedback */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 mb-6">
            <h4 className="font-medium text-blue-800 mb-2">Feedback</h4>
            <p className="text-gray-700 mb-3">
              {getFeedbackMessage()}
            </p>
            
            <p className="text-gray-700">
              La mémorisation active que vous venez de pratiquer est l'une des méthodes les plus efficaces pour ancrer durablement les connaissances dans votre mémoire à long terme.
            </p>
          </div>
          
          {/* Conseils pour la suite */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-800 mb-3">Que faire maintenant ?</h4>
            
            <ul className="space-y-3">
              <li className="flex items-start bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                  <ArrowRight className="text-green-600 w-4 h-4" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Révisez régulièrement</p>
                  <p className="text-gray-600 text-sm">Pour une mémorisation optimale, révisez ces concepts dans 1 jour, puis dans 3 jours, puis dans 1 semaine.</p>
                </div>
              </li>
              
              <li className="flex items-start bg-purple-50 p-3 rounded-lg border border-purple-100">
                <div className="bg-purple-100 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                  <ArrowRight className="text-purple-600 w-4 h-4" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Appliquez ces concepts</p>
                  <p className="text-gray-600 text-sm">Essayez d'utiliser ces concepts dans différents contextes ou exercices pour renforcer votre compréhension.</p>
                </div>
              </li>
              
              <li className="flex items-start bg-amber-50 p-3 rounded-lg border border-amber-100">
                <div className="bg-amber-100 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                  <ArrowRight className="text-amber-600 w-4 h-4" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Enseignez à quelqu'un</p>
                  <p className="text-gray-600 text-sm">Expliquer ces concepts à une autre personne est l'une des meilleures façons de solidifier votre compréhension.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          variant="secondary" 
          onClick={() => window.open(activity.chapterPdfUrl, '_blank')}
          disabled={!activity.chapterPdfUrl}
          className="flex items-center"
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Revoir le chapitre
        </Button>
        
        <Button 
          variant="primary" 
          onClick={onComplete}
          className="flex items-center bg-green-500 hover:bg-green-600 text-white"
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Terminer l'activité
        </Button>
      </div>
    </div>
  );
};

export default MemorizationConclusionStep;
