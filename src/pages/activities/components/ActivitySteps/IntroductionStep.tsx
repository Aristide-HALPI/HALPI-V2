import React from 'react';
import Button from '../../../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  type: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video' | 'concepts_cles' | 'memorization_concepts' | 'mindmapping';
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
        {activity.type === 'concepts_cles' ? (
          <div className="border-l-4 border-amber-500 px-6 py-5 bg-amber-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Élaboration des concepts clés</h3>
            <p className="text-gray-600">Identifiez et structurez les notions fondamentales pour mieux les mémoriser</p>
          </div>
        ) : activity.type === 'memorization_concepts' ? (
          <div className="border-l-4 border-amber-500 px-6 py-5 bg-amber-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Mémorisation des concepts clés</h3>
            <p className="text-gray-600">Testez votre mémoire et consolidez vos connaissances des concepts fondamentaux</p>
          </div>
        ) : (
          <div className="border-l-4 border-amber-500 px-6 py-5 bg-amber-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Une lecture active pour mieux apprendre</h3>
            <p className="text-gray-600">Découvre comment transformer ta façon d'étudier pour retenir plus efficacement</p>
          </div>
        )}
        
        <div className="p-6">
          {activity.type === 'memorization_concepts' ? (
            <>
              <p className="text-gray-700 mb-6">
                Dans cette activité, vous allez tester et renforcer votre mémorisation des concepts clés que vous avez précédemment identifiés et structurés.
              </p>
              
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="text-amber-500 mr-2">●</span> 
                Pourquoi mémoriser activement ?
              </h4>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  La mémorisation active est une technique d'apprentissage puissante qui vous permet d'ancrer durablement les connaissances dans votre mémoire à long terme.
                </p>
                
                <p className="text-gray-700 mb-3">
                  Contrairement à la simple relecture passive, la mémorisation active implique :
                </p>
                
                <ul className="space-y-2">
                  <li className="text-gray-600 flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Un effort mental conscient pour récupérer l'information de votre mémoire.
                  </li>
                  <li className="text-gray-600 flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Un processus d'auto-évaluation qui renforce les connexions neuronales.
                  </li>
                  <li className="text-gray-600 flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Une consolidation des connaissances qui facilite leur application future.
                  </li>
                </ul>
              </div>
              
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="text-blue-500 mr-2">●</span> 
                Déroulement de l'activité
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-center mb-3">
                    <div className="bg-amber-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <span className="text-amber-500 text-sm">1</span>
                    </div>
                    <h5 className="font-medium text-gray-800">Identification</h5>
                  </div>
                  <p className="text-gray-600">Vous devrez retrouver les titres des concepts clés que vous avez définis précédemment. Cet exercice teste votre capacité à vous rappeler des informations essentielles.</p>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-500 text-sm">2</span>
                    </div>
                    <h5 className="font-medium text-gray-800">Restitution</h5>
                  </div>
                  <p className="text-gray-600">Pour chaque concept, vous devrez compléter les champs que vous avez renseignés initialement (what, why, how, etc.). Cet exercice renforce votre compréhension en profondeur.</p>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-5 border border-green-100 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-green-500 text-lg">✓</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium mb-1">Bénéfices de cette activité</p>
                    <p className="text-gray-600">
                      En pratiquant régulièrement cet exercice de mémorisation active, vous améliorerez considérablement votre capacité à retenir et à appliquer les concepts clés de votre cours, ce qui est essentiel pour réussir vos examens et développer une compréhension durable de la matière.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : activity.type === 'concepts_cles' ? (
            <>
              <p className="text-gray-700 mb-6">
                Dans cette activité, vous allez apprendre à identifier et à structurer les concepts fondamentaux de votre chapitre.
              </p>
              
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="text-amber-500 mr-2">●</span> 
                Pourquoi travailler les concepts clés ?
              </h4>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Découvre pourquoi isoler et comprendre les concepts clés est essentiel pour apprendre efficacement.
                </p>
                
                <p className="text-gray-700 mb-3">
                  Lorsque vous étudiez un cours dense, il est facile de se perdre dans les détails ou de mémoriser de manière superficielle. Travailler les concepts clés permet de :
                </p>
                
                <ul className="space-y-2">
                  <li className="text-gray-600 flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Se concentrer sur l'essentiel.
                  </li>
                  <li className="text-gray-600 flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Construire une compréhension solide et durable.
                  </li>
                  <li className="text-gray-600 flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Faciliter les futures révisions et les applications pratiques.
                  </li>
                </ul>
              </div>
              
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="text-blue-500 mr-2">●</span> 
                Qu'est-ce qu'un concept clé ?
              </h4>
              
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
                <p className="text-gray-700 mb-3">
                  Un concept clé est une idée, une notion ou un principe fondamental que vous devez absolument retenir pour maîtriser un chapitre.
                </p>
                
                <ul className="space-y-2">
                  <li className="text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Il répond souvent aux grandes questions : Qui ? Quoi ? Où ? Quand ? Pourquoi ? Comment ?
                  </li>
                  <li className="text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Il est essentiel de savoir l'expliquer simplement et de l'illustrer par des exemples.
                  </li>
                </ul>
              </div>
              
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="text-amber-500 mr-2">●</span> 
                Comment va se dérouler cette activité ?
              </h4>
              
              <p className="text-gray-700 mb-3">Vous allez :</p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <div className="bg-amber-100 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-amber-500 text-sm font-medium">1</span>
                  </div>
                  <p className="text-gray-700">Identifier, sans support, les concepts clés de votre chapitre.</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-100 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-amber-500 text-sm font-medium">2</span>
                  </div>
                  <div>
                    <p className="text-gray-700">Créer une carte d'identité pour chaque concept :</p>
                    <ul className="mt-2 ml-6">
                      <li className="text-gray-600 flex items-start">
                        <span className="text-amber-500 mr-2">•</span>
                        Définition claire
                      </li>
                      <li className="text-gray-600 flex items-start">
                        <span className="text-amber-500 mr-2">•</span>
                        Exemples ou applications
                      </li>
                      <li className="text-gray-600 flex items-start">
                        <span className="text-amber-500 mr-2">•</span>
                        Schémas explicatifs si nécessaire
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-amber-100 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-amber-500 text-sm font-medium">3</span>
                  </div>
                  <p className="text-gray-700">Relire le chapitre pour vérifier et corriger vos cartes.</p>
                </div>
              </div>
              
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="text-amber-500 mr-2">●</span> 
                Objectifs d'apprentissage
              </h4>
              
              <ul className="space-y-3 mb-6">
                {[
                  'Comprendre les notions fondamentales de votre chapitre.',
                  'Organiser vos idées de manière claire et logique.',
                  'Renforcer votre mémorisation à long terme.',
                  'Développer une capacité à expliquer avec vos propres mots.'
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-amber-500 mr-3 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
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
            </>
          )}
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
