import React from 'react';
import { Brain, Edit, Pencil, Layers, Link as LinkIcon } from 'lucide-react';
import Button from '../../../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  type: string;
  introduction?: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MindmappingManualStepProps {
  activity: Activity;
  onNext: () => void;
}

const MindmappingManualStep: React.FC<MindmappingManualStepProps> = ({ activity, onNext }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="flex items-center mb-6">
        <Edit className="h-8 w-8 text-amber-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Mindmap manuscrit : comment bien la construire ?</h2>
      </div>

      {/* Introduction */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <p className="text-gray-700 mb-4">
          Avant de passer à la version numérique de votre carte mentale, vous allez d'abord la réaliser à la main, sur papier ou tablette.
        </p>
        
        <p className="text-gray-700 mb-6">
          Cette étape est essentielle pour activer votre mémoire, structurer vos idées et favoriser une compréhension en profondeur.
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mb-3">Pourquoi commencer par une carte manuscrite ?</h3>
        <p className="text-gray-700 mb-2">
          Réaliser votre mindmap à la main présente plusieurs avantages pédagogiques :
        </p>
        <ul className="mb-6 text-gray-700 space-y-2">
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">🧠</span>
            <span><strong>Activation de la mémoire active</strong> : en dessinant sans support, vous sollicitez votre mémoire de travail et renforcez vos capacités de rappel.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">🎨</span>
            <span><strong>Liberté créative</strong> : le papier offre une flexibilité totale pour organiser vos idées selon votre propre logique.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">🔍</span>
            <span><strong>Engagement cognitif</strong> : le processus manuel stimule l'attention, la concentration et la compréhension.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">✏️</span>
            <span><strong>Personnalisation</strong> : vous pouvez adapter la carte à votre style d'apprentissage, en utilisant des couleurs, des symboles ou des dessins.</span>
          </li>
        </ul>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
            <span className="text-blue-500 mr-2">🎯</span>
            Objectif de cette étape
          </h3>
          <p className="text-gray-700 mb-2">
            L'objectif est de reconstruire de mémoire les concepts clés du chapitre et de les organiser visuellement.
          </p>
          <p className="text-gray-700">
            Cette démarche vous permet de :
          </p>
          <ul className="list-disc pl-6 mb-2 text-gray-700 space-y-1">
            <li>Identifier les notions que vous maîtrisez.</li>
            <li>Repérer les zones d'ombre ou les lacunes.</li>
            <li>Préparer une base solide pour la version numérique de votre mindmap.</li>
          </ul>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-2 flex items-center">
            <span className="text-amber-500 mr-2">👉</span>
            Vous pouvez vous appuyer sur :
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>Vos souvenirs de lecture du chapitre</li>
            <li>Vos prises de notes</li>
            <li>Et surtout, les concepts clés élaborés lors des activités précédentes dans HALPI</li>
          </ul>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
          <span className="text-green-500 mr-2">✅</span>
          Tutoriel – Étapes pour créer votre mindmap manuscrite
        </h3>

        <div className="space-y-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 flex items-center mb-2">
              <span className="bg-yellow-400 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
              <span className="text-yellow-600">🟡 Placez le titre du chapitre au centre</span>
            </h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Écrivez le sujet principal au milieu de la feuille.</li>
              <li>Entourez-le ou encadrez-le : c'est le point de départ de votre carte.</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 flex items-center mb-2">
              <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">2</span>
              <span className="text-green-600">🟢 Créez une branche pour chaque concept clé</span>
            </h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Reprenez la liste des concepts clés que vous avez déjà travaillés avec HALPI.</li>
              <li>Pour chaque concept, tracez une branche principale qui part du centre.</li>
              <li>Écrivez un mot-clé clair et court par branche.</li>
              <li>Laissez de la place autour pour les détails.</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 flex items-center mb-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">3</span>
              <span className="text-blue-600">🔵 Détaillez chaque concept de façon claire et synthétique</span>
            </h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Ajoutez des sous-branches pour les éléments importants :</li>
              <ul className="list-circle pl-6 text-gray-700 space-y-1">
                <li>définitions simples</li>
                <li>exemples concrets</li>
                <li>mots-clés</li>
                <li>comparaisons ou erreurs fréquentes</li>
              </ul>
            </ul>
            <div className="mt-2 bg-yellow-50 p-3 rounded-md">
              <p className="text-gray-700 flex items-center">
                <span className="text-amber-500 mr-2">🎯</span>
                <span><strong>Conseil</strong> : Pas de phrases longues — utilisez des termes clés que vous comprenez rapidement.</span>
              </p>
            </div>
            <div className="mt-2 bg-blue-50 p-3 rounded-md">
              <p className="text-gray-700">
                <strong>📌 Exemple :</strong><br />
                Branche : Mitochondrie<br />
                → "ATP" – "Énergie" – "Double membrane" – "Organite"
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 flex items-center mb-2">
              <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">4</span>
              <span className="text-purple-600">🔗 Ajoutez les connexions entre les éléments</span>
            </h4>
            <div className="mb-2">
              <p className="font-medium text-gray-700">Une branche spéciale "Connexions"</p>
              <p className="text-gray-700">Créez une branche dédiée pour y inscrire les liens logiques clés :</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>causes / conséquences</li>
                <li>différences / oppositions</li>
                <li>relations entre concepts éloignés</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 flex items-center mb-2">
              <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">5</span>
              <span className="text-red-600">🖍 Mettez en forme pour plus de lisibilité</span>
            </h4>
            <ul className="text-gray-700 grid grid-cols-2 gap-2">
              <li className="flex items-center">
                <span className="bg-orange-300 w-4 h-4 mr-2"></span>
                <span>Une couleur par branche principale</span>
              </li>
              <li className="flex items-center">
                <span className="bg-red-300 w-4 h-4 mr-2"></span>
                <span>Encadrez les éléments importants</span>
              </li>
              <li className="flex items-center">
                <span className="bg-blue-300 w-4 h-4 mr-2"></span>
                <span>Ajoutez des petits dessins ou symboles</span>
              </li>
              <li className="flex items-center">
                <span className="bg-yellow-300 w-4 h-4 mr-2"></span>
                <span>Gardez de l'espace pour la clarté</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-green-800 flex items-center mb-3">
            <span className="text-green-500 mr-2">✅</span>
            Ma mindmap est prête si…
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Mon sujet est bien visible au centre</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>J'ai 4 à 7 grandes branches (concepts clés)</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Chaque branche contient des détails clairs</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>J'ai mis des couleurs ou symboles</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>J'ai montré des connexions entre les idées</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <h3 className="font-medium text-gray-800 flex items-center mb-2">
            <span className="text-blue-500 mr-2">🧠</span>
            Et maintenant ?
          </h3>
          <p className="text-gray-700">
            Une fois votre mindmap manuscrite terminée, vous pourrez passer à l'étape suivante dans HALPI :
            <br />
            <span className="flex items-center mt-1">
              <span className="text-amber-500 mr-2">👉</span>
              <span className="font-medium">la reconstitution numérique de votre carte, à partir d'un formulaire guidé.</span>
            </span>
          </p>
          <p className="text-gray-700 mt-2">
            Cela vous permettra de recevoir un feedback personnalisé de l'IA et d'améliorer votre carte pour qu'elle devienne un outil de révision puissant.
          </p>
        </div>
      </div>

      {/* Bouton pour passer à l'étape suivante */}
      <div className="flex justify-end">
        <Button 
          variant="primary" 
          onClick={onNext}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2"
        >
          J'ai terminé ma carte manuscrite
        </Button>
      </div>
    </div>
  );
};

export default MindmappingManualStep;
