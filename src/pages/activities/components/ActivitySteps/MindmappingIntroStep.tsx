import React from 'react';
import { Brain } from 'lucide-react';
import Button from '../../../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  type: string;
  introduction?: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface MindmappingIntroStepProps {
  activity: Activity;
  onNext: () => void;
}

const MindmappingIntroStep: React.FC<MindmappingIntroStepProps> = ({ activity, onNext }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="flex items-center mb-6">
        <Brain className="h-8 w-8 text-amber-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Introduction : Mindmapping</h2>
      </div>

      {/* Contenu principal */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <p className="text-gray-700 mb-4">
          Bienvenue dans l'activité de Mindmapping, une étape essentielle de votre parcours HALPI.
        </p>
        
        <p className="text-gray-700 mb-4">
          Après avoir identifié et mémorisé vos concepts clés, vous allez maintenant les organiser visuellement sous forme de carte mentale (mindmap).
          Cet exercice vous aide à structurer votre compréhension, à renforcer vos connexions logiques entre les notions, et à préparer vos révisions avec clarté.
        </p>

        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Pourquoi faire un mindmap ?</h3>
        <p className="text-gray-700 mb-2">
          Le mindmapping est une méthode pédagogique reconnue pour :
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
          <li>Visualiser les liens entre les idées principales et secondaires.</li>
          <li>Structurer l'information de manière logique et hiérarchisée.</li>
          <li>Renforcer la mémorisation grâce à une représentation spatiale et intuitive.</li>
          <li>Évaluer votre compréhension globale d'un chapitre sans support.</li>
        </ul>
        <p className="text-gray-700 mb-6">
          C'est une stratégie d'apprentissage puissante, surtout dans les matières complexes ou riches en concepts.
        </p>

        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
          <Brain className="h-5 w-5 text-amber-500 mr-2" />
          Comment cela va-t-il se dérouler ?
        </h3>

        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">1. Création du mindmap de mémoire</h4>
          <p className="text-gray-700 mb-2">
            Vous commencerez par réaliser un mindmap manuscrit, sur papier ou tablette, sans consulter votre cours.
            L'objectif : retrouver de mémoire les concepts clés du chapitre et les organiser en une carte structurée.
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">2. Reconstitution dans HALPI</h4>
          <p className="text-gray-700 mb-2">
            Une fois votre carte manuscrite terminée, vous la reproduirez dans HALPI à l'aide d'un formulaire simple et guidé.
            Vous y renseignerez :
          </p>
          <ul className="list-disc pl-6 mb-2 text-gray-700 space-y-1">
            <li>Le titre principal (le thème général du chapitre).</li>
            <li>Les branches principales (les grandes idées).</li>
            <li>Les sous-branches (les détails ou exemples).</li>
            <li>Les liens logiques entre les idées, si pertinents.</li>
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">3. Analyse automatisée par HALPI</h4>
          <p className="text-gray-700 mb-2">
            Votre carte sera analysée par l'IA pédagogique de HALPI, qui vous fournira un feedback personnalisé :
          </p>
          <ul className="list-disc pl-6 mb-2 text-gray-700 space-y-1">
            <li>Qualité de l'organisation (clarté, hiérarchie, logique).</li>
            <li>Complétude par rapport aux concepts clés attendus.</li>
            <li>Éléments oubliés ou mal reliés.</li>
            <li>Suggestions concrètes d'amélioration.</li>
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-2">4. Amélioration après relecture</h4>
          <p className="text-gray-700 mb-2">
            Après ce premier retour, vous serez invité(e) à relire votre chapitre avec attention.
            Sur base de cette relecture et du feedback de HALPI, vous pourrez corriger, enrichir ou ajuster votre mindmap directement dans la plateforme.
          </p>
          <p className="text-gray-700">
            Ce cycle peut être répété : HALPI vous accompagne jusqu'à ce que votre carte soit complète, cohérente et mémorable.
            C'est une méthode d'apprentissage progressif et actif, au service de votre réussite.
          </p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
          <h4 className="font-medium text-gray-800 flex items-center mb-2">
            <span className="text-amber-500 mr-2">🎯</span>
            Conseil final :
          </h4>
          <p className="text-gray-700">
            Ne voyez pas le mindmap comme un "dessin à rendre", mais comme un outil vivant qui évolue avec votre compréhension.
            Plus vous vous investissez dans sa construction et son amélioration, plus il deviendra un pilier puissant de votre apprentissage.
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
          Commencer l'activité
        </Button>
      </div>
    </div>
  );
};

export default MindmappingIntroStep;
