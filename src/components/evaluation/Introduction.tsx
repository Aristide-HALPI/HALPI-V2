import { Brain } from 'lucide-react';

export function Introduction() {
  return (
    <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
      <h2 className="text-xl font-bold mb-6">Auto-évaluation des connaissances</h2>
      <p className="text-gray-600 mb-6">
        Dans cette activité, vous allez analyser et évaluer des questions clés générées par l'IA 
        pour chaque concept important du chapitre. Cette approche, basée sur les principes de 
        l'apprentissage actif, vous permet de développer votre esprit critique et de renforcer 
        votre compréhension.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Bénéfices pour l'apprentissage</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
              <span>Développer votre esprit critique en évaluant la pertinence des questions</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
              <span>Renforcer votre compréhension en analysant différentes perspectives</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
              <span>Identifier les aspects essentiels de chaque concept</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
              <span>Préparer efficacement vos révisions futures</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Pourquoi c'est efficace ?</h3>
          <p className="text-gray-600 mb-4">
            L'IA génère des questions variées qui explorent différentes facettes de chaque concept. 
            En évaluant ces questions, vous :
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
              <span>Approfondissez votre compréhension</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
              <span>Découvrez de nouvelles perspectives</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2"></div>
              <span>Consolidez vos connaissances</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-4">Questions clés</h3>
        <p className="text-blue-800 mb-4">
          Une question clé est une question complexe et stratégique, conçue pour vérifier la 
          compréhension approfondie d'un concept ou d'un sujet donné. Elle va au-delà des simples 
          faits ou définitions en demandant d'expliquer, analyser, ou appliquer les connaissances 
          dans un contexte particulier.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Caractéristiques</h4>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Couvre un aspect essentiel du sujet</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Stimule la réflexion approfondie</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Objectifs</h4>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Mesure la maîtrise du concept</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Explore différents angles du sujet</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}