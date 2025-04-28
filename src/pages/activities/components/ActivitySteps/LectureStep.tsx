import React from 'react';
import { AlertCircle, BookOpen, CheckCircle, Target } from 'lucide-react';
import Button from '../../../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  chapterPdfUrl?: string;
  // Autres propriétés nécessaires
}

interface LectureStepProps {
  activity: Activity;
}

const LectureStep: React.FC<LectureStepProps> = ({ activity }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center mr-4">
            <BookOpen className="text-amber-500 w-7 h-7" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Lecture du chapitre</h2>
        </div>
      </div>
      
      {/* Carte principale */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="border-l-4 border-amber-500 px-6 py-5 bg-amber-50">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Lecture initiale</h3>
          <p className="text-gray-600">Lecture préparatoire et attentive pour une compréhension globale</p>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Lis le chapitre une première fois, sans prendre de notes, en te concentrant vraiment sur ce que tu lis. Cette étape est essentielle pour construire une vision d'ensemble avant d'entrer dans les détails.
          </p>
          
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="text-amber-500 mr-2">●</span> 
            À faire pendant cette lecture
          </h4>
          
          <ul className="space-y-3 mb-6">
            {[
              'Lis dans le calme, en te mettant en condition d’attention',
              'Cherche à comprendre le sens général du chapitre',
              'Identifie les grandes parties, les idées principales, les concepts importants',
              'Ne t’arrête pas trop longtemps sur un point difficile : l’objectif est d’avoir une vue d’ensemble'
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <div className="bg-green-100 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <CheckCircle className="text-green-500 w-4 h-4" />
                </div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
          
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
            <div className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <Target className="text-blue-500 w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Objectif de cette étape</p>
                <p className="text-gray-600">
                  Construire une première représentation mentale du chapitre avant de commencer à prendre des notes. Cette vision globale te permettra ensuite de mieux organiser tes notes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {activity.chapterPdfUrl ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Document de cours</h4>
            
            <div className="flex justify-center mb-6">
              <a 
                href={activity.chapterPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block"
              >
                <Button 
                  variant="gold" 
                  size="lg"
                  className="px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Ouvrir le chapitre (PDF)
                </Button>
              </a>
            </div>
            
            <div className="flex items-start bg-amber-50 rounded-xl p-4 border border-amber-100">
              <AlertCircle className="text-amber-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-gray-700">
                Si tu as déjà le chapitre en version papier, tu n'as pas besoin de le télécharger. Utilise simplement ta version imprimée.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md flex items-center gap-2 mb-6">
          <AlertCircle size={18} />
          <p>Le PDF de ce chapitre n'est pas disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
};

export default LectureStep;
