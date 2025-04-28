import React, { useState } from 'react';
import { CheckCircle, Flag, MessageSquare, AlertCircle } from 'lucide-react';
import Button from '../../../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  conclusion: string;
  // Autres propriétés nécessaires
}

interface FeedbackState {
  rating: number;
  comment: string;
  clarity: 'clear' | 'unclear' | 'very_unclear' | '';
  clarityJustification?: string;
  usefulness: 1 | 2 | 3 | 4 | 5 | null;
  usefulnessJustification?: string;
  difficulty: 'too_easy' | 'just_right' | 'too_difficult' | '';
  understanding: number;
  examReadiness: number;
  needReinforcement: 'yes' | 'maybe' | 'no' | '';
  needReinforcementJustification?: string;
}

interface ConclusionStepProps {
  activity: Activity;
  feedback: FeedbackState;
  setFeedback: React.Dispatch<React.SetStateAction<FeedbackState>>;
  submitFeedback: () => void;
  isCompleting: boolean;
}

// Fonction pour obtenir la couleur et la légende en fonction de la note
const getRatingInfo = (rating: number, type: 'understanding' | 'examReadiness') => {
  if (rating === 0) return { color: 'bg-gray-100', text: '', textColor: 'text-gray-400' };
  
  if (rating >= 1 && rating <= 5) {
    return { 
      color: 'bg-red-100', 
      text: type === 'understanding' ? 'Très faible compréhension' : 'Incapacité majeure à restituer correctement',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      dotColor: 'bg-red-500'
    };
  } else if (rating >= 6 && rating <= 10) {
    return { 
      color: 'bg-orange-100', 
      text: type === 'understanding' ? 'Compréhension fragile, incomplète' : 'Restitution partielle et hésitante',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300',
      dotColor: 'bg-orange-500'
    };
  } else if (rating >= 11 && rating <= 15) {
    return { 
      color: 'bg-amber-100', 
      text: type === 'understanding' ? 'Bonne compréhension générale, quelques flous' : 'Restitution correcte mais améliorable',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      dotColor: 'bg-amber-400'
    };
  } else if (rating >= 16 && rating <= 20) {
    return { 
      color: 'bg-green-100', 
      text: type === 'understanding' ? 'Compréhension complète et solide' : 'Restitution fluide, précise et maîtrisée',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      dotColor: 'bg-green-500'
    };
  }
  
  return { color: 'bg-gray-100', text: '', textColor: 'text-gray-400', borderColor: 'border-gray-300', dotColor: 'bg-gray-400' };
};

// Composant pour l'échelle de notation avec boutons numériques
const RatingScale: React.FC<{
  value: number;
  onChange: (value: number) => void;
  type: 'understanding' | 'examReadiness';
}> = ({ value, onChange, type }) => {
  const { color, text, textColor, borderColor } = getRatingInfo(value, type);
  
  // Créer des groupes de 5 boutons pour une meilleure organisation
  const buttonGroups = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20]
  ];
  
  return (
    <div className="mb-6">
      {/* Boutons de notation de 1 à 20 */}
      <div className="mb-4">
        {buttonGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="flex mb-2">
            {group.map(num => {
              const { dotColor, borderColor } = getRatingInfo(num, type);
              return (
                <button
                  key={num}
                  onClick={() => onChange(num)}
                  className={`flex-1 py-2 mx-0.5 text-sm font-medium rounded border transition-all ${
                    value === num 
                      ? `${borderColor} ${color} ${textColor} border-2` 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                  aria-label={`Note de ${num} sur 20`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Affichage de la note sélectionnée et de sa signification */}
      <div className="flex items-center justify-between">
        <div className="font-medium text-gray-800">Note: {value > 0 ? value : '-'}/20</div>
        {value > 0 && (
          <div className={`px-3 py-1 rounded-md ${color} ${textColor} text-sm font-medium border ${borderColor}`}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour la légende des notes
const RatingLegend: React.FC<{
  type: 'understanding' | 'examReadiness';
}> = ({ type }) => {
  return (
    <div className="mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h6 className="font-medium text-gray-800 mb-3">Légende HALPI :</h6>
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center p-2 rounded-md bg-red-50 border border-red-200">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
          <div>
            <span className="font-medium text-red-700">0 à 5 Rouge : </span>
            <span className="text-gray-700">{type === 'understanding' ? 'Très faible compréhension' : 'Incapacité majeure à restituer correctement'}</span>
          </div>
        </div>
        
        <div className="flex items-center p-2 rounded-md bg-orange-50 border border-orange-200">
          <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
          <div>
            <span className="font-medium text-orange-700">6 à 10 Orange : </span>
            <span className="text-gray-700">{type === 'understanding' ? 'Compréhension fragile, incomplète' : 'Restitution partielle et hésitante'}</span>
          </div>
        </div>
        
        <div className="flex items-center p-2 rounded-md bg-amber-50 border border-amber-200">
          <div className="w-4 h-4 bg-amber-400 rounded-full mr-3"></div>
          <div>
            <span className="font-medium text-amber-700">11 à 15 Jaune : </span>
            <span className="text-gray-700">{type === 'understanding' ? 'Bonne compréhension générale, quelques flous' : 'Restitution correcte mais améliorable'}</span>
          </div>
        </div>
        
        <div className="flex items-center p-2 rounded-md bg-green-50 border border-green-200">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
          <div>
            <span className="font-medium text-green-700">16 à 20 Vert : </span>
            <span className="text-gray-700">{type === 'understanding' ? 'Compréhension complète et solide' : 'Restitution fluide, précise et maîtrisée'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConclusionStep: React.FC<ConclusionStepProps> = ({ 
  activity, 
  feedback, 
  setFeedback, 
  submitFeedback, 
  isCompleting 
}) => {
  // État local pour suivre si le formulaire est valide
  const [formErrors, setFormErrors] = useState<string[]>([]);
  
  // Vérifier si le formulaire est valide avant de soumettre
  const validateAndSubmit = () => {
    const errors: string[] = [];
    
    if (!feedback.clarity) {
      errors.push("Veuillez indiquer si la consigne était claire");
    }
    
    if (!feedback.usefulness) {
      errors.push("Veuillez évaluer l'utilité de l'activité");
    }
    

    
    if (feedback.understanding === 0) {
      errors.push("Veuillez évaluer votre compréhension du chapitre");
    }
    
    if (feedback.examReadiness === 0) {
      errors.push("Veuillez évaluer votre préparation à l'examen");
    }
    
    if (!feedback.needReinforcement) {
      errors.push("Veuillez indiquer si vous avez besoin de renforcement");
    }
    
    setFormErrors(errors);
    
    if (errors.length === 0) {
      submitFeedback();
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center mr-4">
            <Flag className="text-[#bd8c0f] w-7 h-7" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Conclusion</h2>
        </div>
        <div className="text-gray-700 text-lg">
          <p>{activity.conclusion}</p>
        </div>
      </div>
      
      {/* Carte de feedback */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="border-l-4 border-[#bd8c0f] px-6 py-5 bg-amber-50">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">Formulaire Final</h3>
          <p className="text-gray-600">Ton avis nous aide à améliorer les activités et à suivre ton progrès</p>
        </div>
        
        <div className="p-6">
          {/* Section 1: Feedback sur l'activité */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-[#bd8c0f] bg-amber-50 p-3 rounded-t-lg">
              1. Feedback sur l'Activité elle-même
            </h4>
            
            {/* Question 0: Clarté */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-800 mb-3">
                La consigne et l'objectif de l'activité étaient-ils clairs pour toi ?
              </h5>
              <p className="text-sm text-gray-500 mb-3">(Sélectionne une réponse)</p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="clarity" 
                    checked={feedback.clarity === 'clear'} 
                    onChange={() => setFeedback(prev => ({ ...prev, clarity: 'clear', clarityJustification: '' }))}
                    className="w-4 h-4 text-[#bd8c0f] focus:ring-[#bd8c0f]"
                  />
                  <span className="text-gray-800">Oui parfaitement</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="clarity" 
                    checked={feedback.clarity === 'unclear'} 
                    onChange={() => setFeedback(prev => ({ ...prev, clarity: 'unclear' }))}
                    className="w-4 h-4 text-[#bd8c0f] focus:ring-[#bd8c0f]"
                  />
                  <span className="text-gray-800">Un peu flou</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="clarity" 
                    checked={feedback.clarity === 'very_unclear'} 
                    onChange={() => setFeedback(prev => ({ ...prev, clarity: 'very_unclear' }))}
                    className="w-4 h-4 text-[#bd8c0f] focus:ring-[#bd8c0f]"
                  />
                  <span className="text-gray-800">Non, je n'ai pas compris ce qu'on attendait de moi</span>
                </label>
                
                {(feedback.clarity === 'unclear' || feedback.clarity === 'very_unclear') && (
                  <div className="mt-3 pl-7">
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f] outline-none transition-all"
                      placeholder="Peux-tu préciser ce qui n'était pas clair ? (facultatif)"
                      value={feedback.clarityJustification || ''}
                      onChange={e => setFeedback(prev => ({ ...prev, clarityJustification: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Question 1: Utilité */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-800 mb-3">
                As-tu trouvé cette activité utile pour progresser sur ce chapitre ?
              </h5>
              <p className="text-sm text-gray-500 mb-3">(Sélectionne une réponse)</p>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 1, label: 'Pas du tout utile' },
                  { value: 2, label: 'Peu utile' },
                  { value: 3, label: 'Moyennement utile' },
                  { value: 4, label: 'Très utile' },
                  { value: 5, label: 'Extrêmement utile' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFeedback(prev => ({ ...prev, usefulness: option.value as any }))}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      feedback.usefulness === option.value 
                        ? 'bg-[#bd8c0f] text-white border-[#bd8c0f]' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {(feedback.usefulness === 1 || feedback.usefulness === 2 || feedback.usefulness === 3) && (
                <div className="mt-4">
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f] outline-none transition-all"
                    placeholder="Peux-tu nous dire pourquoi cette activité n'a pas été suffisamment utile pour toi ? (facultatif)"
                    value={feedback.usefulnessJustification || ''}
                    onChange={e => setFeedback(prev => ({ ...prev, usefulnessJustification: e.target.value }))}
                    rows={3}
                  />
                </div>
              )}
            </div>
            

          </div>
          
          {/* Section 2: Auto-évaluation */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-[#bd8c0f] bg-amber-50 p-3 rounded-t-lg">
              2. Auto-évaluation de ta maîtrise
            </h4>
            
            {/* Question 6: Compréhension */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-800 mb-3">
                Si tu devais évaluer ta compréhension globale de ce chapitre aujourd'hui, sur 20, quelle note te donnerais-tu ?
              </h5>
              <p className="text-sm text-gray-500 mb-3">(Sélectionne une note de 1 à 20)</p>
              
              <RatingScale 
                value={feedback.understanding} 
                onChange={(value) => setFeedback(prev => ({ ...prev, understanding: value }))}
                type="understanding"
              />
              
              <RatingLegend type="understanding" />
            </div>
            
            {/* Question 7: Préparation à l'examen */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-800 mb-3">
                Si tu devais passer un examen sur ce chapitre demain, sans support (ni notes, ni cours), quelle note sur 20 penses-tu obtenir ?
              </h5>
              <p className="text-sm text-gray-500 mb-3">(Sélectionne une note de 1 à 20)</p>
              
              <RatingScale 
                value={feedback.examReadiness} 
                onChange={(value) => setFeedback(prev => ({ ...prev, examReadiness: value }))}
                type="examReadiness"
              />
              
              <RatingLegend type="examReadiness" />
            </div>
          </div>
          
          {/* Section 3: Besoin de renforcement */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-[#bd8c0f] bg-amber-50 p-3 rounded-t-lg">
              3. Besoin de Renforcement
            </h4>
            
            {/* Question 9: Renforcement */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-800 mb-3">
                Penses-tu avoir besoin de refaire une activité de renforcement sur ce chapitre ?
              </h5>
              <p className="text-sm text-gray-500 mb-3">(Sélectionne une réponse)</p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="reinforcement" 
                    checked={feedback.needReinforcement === 'yes'} 
                    onChange={() => setFeedback(prev => ({ ...prev, needReinforcement: 'yes' }))}
                    className="w-4 h-4 text-[#bd8c0f] focus:ring-[#bd8c0f]"
                  />
                  <span className="text-gray-800">Oui, absolument</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="reinforcement" 
                    checked={feedback.needReinforcement === 'maybe'} 
                    onChange={() => setFeedback(prev => ({ ...prev, needReinforcement: 'maybe' }))}
                    className="w-4 h-4 text-[#bd8c0f] focus:ring-[#bd8c0f]"
                  />
                  <span className="text-gray-800">Peut-être, selon le temps disponible</span>
                </label>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="reinforcement" 
                    checked={feedback.needReinforcement === 'no'} 
                    onChange={() => setFeedback(prev => ({ ...prev, needReinforcement: 'no' }))}
                    className="w-4 h-4 text-[#bd8c0f] focus:ring-[#bd8c0f]"
                  />
                  <span className="text-gray-800">Non, je me sens prêt(e)</span>
                </label>
                
                {(feedback.needReinforcement === 'yes' || feedback.needReinforcement === 'maybe') && (
                  <div className="mt-3 pl-7">
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f] outline-none transition-all"
                      placeholder="Sur quels aspects aimerais-tu te renforcer ? (facultatif)"
                      value={feedback.needReinforcementJustification || ''}
                      onChange={e => setFeedback(prev => ({ ...prev, needReinforcementJustification: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Commentaire additionnel */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <MessageSquare className="text-[#bd8c0f] w-5 h-5 mr-2" />
              Un commentaire à ajouter ? (facultatif)
            </h4>
            
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f] outline-none transition-all"
              rows={4}
              placeholder="Ton avis nous aide à améliorer les activités..."
            />
          </div>
          
          {/* Erreurs de validation */}
          {formErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="text-red-500 w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-red-700 mb-2">Veuillez compléter tous les champs obligatoires :</h5>
                  <ul className="list-disc pl-5 text-red-600 text-sm space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Bouton de soumission */}
          <div className="flex justify-center">
            <Button 
              variant="gold" 
              onClick={validateAndSubmit}
              isLoading={isCompleting}
              className="px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Terminer l'activité
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConclusionStep;
