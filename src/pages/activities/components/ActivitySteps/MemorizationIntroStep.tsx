import React from 'react';
import Button from '../../../../components/common/Button';
import { Brain } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  type: string;
  introduction?: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MemorizationIntroStepProps {
  activity: Activity;
  onNext: () => void;
}

const MemorizationIntroStep: React.FC<MemorizationIntroStepProps> = ({ activity, onNext }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="flex items-start mb-6">
        <div className="bg-amber-50 p-3 rounded-lg mr-4">
          <Brain className="text-amber-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Mémorisation des Concepts Clés: {activity.title}</h2>
          <p className="text-gray-600">
            Bienvenue dans la phase de mémorisation active des concepts clés que vous avez travaillés !
          </p>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="border-l-4 border-amber-500 px-6 py-5 bg-amber-50">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Mémorisation des Concepts Clés</h3>
          <p className="text-gray-600">Testez votre capacité à restituer les informations de mémoire, sans support visuel</p>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Après avoir identifié et structuré vos concepts dans des cartes d'identité détaillées, il est temps de tester votre capacité à restituer ces informations de mémoire, sans support visuel.
          </p>
          
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="text-amber-500 mr-2">●</span> 
            Pourquoi cette étape est-elle essentielle ?
          </h4>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-3">
              La mémorisation active est la méthode la plus puissante pour :
            </p>
            
            <ul className="space-y-2">
              <li className="text-gray-600 flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                Ancrer durablement vos connaissances dans votre mémoire à long terme.
              </li>
              <li className="text-gray-600 flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                Évaluer votre compréhension réelle de chaque concept.
              </li>
              <li className="text-gray-600 flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                Détecter vos oublis et corriger vos lacunes avant les examens.
              </li>
              <li className="text-gray-600 flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                Développer votre capacité à expliquer clairement et en profondeur.
              </li>
            </ul>
          </div>
          
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="text-blue-500 mr-2">●</span> 
            Comment cela va-t-il se dérouler ?
          </h4>
          
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
            <p className="text-gray-700 mb-3">
              Pour chaque concept clé, vous devrez retrouver et compléter uniquement les champs qui ont été définis dans sa carte d'identité.
            </p>
            
            <p className="text-gray-700 mb-3">
              Selon la carte initiale, il pourra vous être demandé de répondre à :
            </p>
            
            <ul className="space-y-2">
              <li className="text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Quelques questions fondamentales parmi : Qui ? Quoi ? Où ? Quand ? Pourquoi ? Comment ?
              </li>
              <li className="text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Donner une définition si elle faisait partie de la carte.
              </li>
              <li className="text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Fournir un exemple ou réaliser un schéma si cela était demandé.
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-green-800 font-medium flex items-start">
                <span className="text-green-600 mr-2">✅</span>
                Vous n'avez pas à inventer de nouvelles réponses : vous devez uniquement retrouver ce que vous aviez construit initialement.
              </p>
            </div>
          </div>
          
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="text-purple-500 mr-2">●</span> 
            Exemple concret
          </h4>
          
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 mb-6">
            <p className="text-gray-700 mb-3">
              Si, pour un concept, vous aviez renseigné Quoi ?, Pourquoi ?, et donné un exemple, alors vous ne serez interrogé que sur ces trois champs.
            </p>
            
            <p className="text-gray-700">
              Si, pour un autre concept, vous aviez renseigné toutes les questions + un schéma, vous devrez compléter toutes ces informations.
            </p>
          </div>
          
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <span className="text-amber-500 mr-2">●</span> 
            Votre objectif ?
          </h4>
          
          <ul className="space-y-2 mb-6">
            <li className="text-gray-600 flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              Retravailler votre mémoire de manière ciblée.
            </li>
            <li className="text-gray-600 flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              Reconstruire activement vos connaissances sans support.
            </li>
            <li className="text-gray-600 flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              Obtenir un feedback précis sur les champs maîtrisés et ceux à renforcer.
            </li>
          </ul>
          
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 mb-6">
            <h5 className="font-medium text-gray-800 mb-2">Retenez ceci :</h5>
            <p className="text-gray-700 mb-2">
              Mémoriser, ce n'est pas réciter par cœur. C'est comprendre profondément et être capable de reconstruire un savoir de façon claire et personnelle.
            </p>
            <p className="text-gray-700">
              Avec cette méthode, vous ne vous contenterez pas de "reconnaître" vos concepts : vous saurez les restituer, les expliquer, et les utiliser.
            </p>
          </div>
        </div>
      </div>
      
      {/* Bouton pour passer à l'étape suivante */}
      <div className="flex justify-end mb-8">
        <Button 
          variant="primary" 
          onClick={onNext}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          Commencer l'activité
        </Button>
      </div>
    </div>
  );
};

export default MemorizationIntroStep;
