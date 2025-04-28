import React from 'react';

interface QuestionSectionProps {
  showExample: boolean;
  setShowExample: React.Dispatch<React.SetStateAction<boolean>>;
  personalQuestions: {question: string, answer: string}[];
  setPersonalQuestions: React.Dispatch<React.SetStateAction<{question: string, answer: string}[]>>;
  examQuestions: {question: string, answer: string}[];
  setExamQuestions: React.Dispatch<React.SetStateAction<{question: string, answer: string}[]>>;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({ 
  showExample, 
  setShowExample,
  personalQuestions,
  setPersonalQuestions,
  examQuestions,
  setExamQuestions
}) => {
  // Utiliser les props au lieu d'états locaux pour les questions
  const [personalOpen, setPersonalOpen] = React.useState<boolean[]>(Array(personalQuestions.length).fill(false));
  const [examOpen, setExamOpen] = React.useState<boolean[]>(Array(examQuestions.length).fill(false));
  
  // Mettre à jour les états d'ouverture quand les questions changent
  React.useEffect(() => {
    console.log('QuestionSection: personalQuestions changed', { personalQuestions, length: personalQuestions.length });
    setPersonalOpen(prev => {
      // Garder les états existants et ajouter false pour les nouvelles questions
      if (prev.length < personalQuestions.length) {
        console.log('QuestionSection: Updating personalOpen state for new questions');
        return [...prev, ...Array(personalQuestions.length - prev.length).fill(false)];
      }
      return prev.slice(0, personalQuestions.length);
    });
  }, [personalQuestions.length]);
  
  React.useEffect(() => {
    setExamOpen(prev => {
      if (prev.length < examQuestions.length) {
        return [...prev, ...Array(examQuestions.length - prev.length).fill(false)];
      }
      return prev.slice(0, examQuestions.length);
    });
  }, [examQuestions.length]);

  const addPersonalQuestion = () => {
    console.log('QuestionSection: Adding new personal question');
    const updatedQuestions = [...personalQuestions, {question: '', answer: ''}];
    console.log('QuestionSection: Updated personal questions', updatedQuestions);
    setPersonalQuestions(updatedQuestions);
    setPersonalOpen(arr => [...arr, true]);
  };
  
  const addExamQuestion = () => {
    console.log('QuestionSection: Adding new exam question');
    const updatedQuestions = [...examQuestions, {question: '', answer: ''}];
    console.log('QuestionSection: Updated exam questions', updatedQuestions);
    setExamQuestions(updatedQuestions);
    setExamOpen(arr => [...arr, true]);
  };

  const handlePersonalQuestionChange = (idx: number, field: 'question' | 'answer', value: string) => {
    console.log(`QuestionSection: Changing personal question ${idx} ${field}`, { oldValue: personalQuestions[idx]?.[field], newValue: value });
    setPersonalQuestions(qs => qs.map((q, i) => i === idx ? {...q, [field]: value} : q));
  };
  
  const handleExamQuestionChange = (idx: number, field: 'question' | 'answer', value: string) => {
    console.log(`QuestionSection: Changing exam question ${idx} ${field}`, { oldValue: examQuestions[idx]?.[field], newValue: value });
    setExamQuestions(qs => qs.map((q, i) => i === idx ? {...q, [field]: value} : q));
  };
  
  const removePersonalQuestion = (idx: number) => {
    setPersonalQuestions(qs => qs.filter((_, i) => i !== idx));
    setPersonalOpen(arr => arr.filter((_, i) => i !== idx));
  };
  
  const removeExamQuestion = (idx: number) => {
    setExamQuestions(qs => qs.filter((_, i) => i !== idx));
    setExamOpen(arr => arr.filter((_, i) => i !== idx));
  };
  
  const togglePersonalOpen = (idx: number) => {
    setPersonalOpen(arr => arr.map((v, i) => i === idx ? !v : v));
  };
  
  const toggleExamOpen = (idx: number) => {
    setExamOpen(arr => arr.map((v, i) => i === idx ? !v : v));
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-l-4 border-[#bd8c0f] px-6 py-5 bg-amber-50">
        <h3 className="text-xl font-semibold text-gray-800 mb-1 flex items-center">
          <span className="bg-[#bd8c0f] text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">3</span>
          Questions personnelles et d'examen
        </h3>
        <p className="text-gray-600">Prépare tes questions personnelles et anticipe les questions d'examen</p>
      </div>
      
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowExample(!showExample)}
            className="flex items-center text-[#bd8c0f] hover:text-[#a37a0e] transition-colors"
          >
            <span className="mr-2">{showExample ? '▼' : '▶'}</span>
            <span className="font-medium">Voir un exemple</span>
          </button>
        </div>
        
        {showExample && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6">
            <p className="font-medium text-gray-800 mb-3 flex items-center">
              <span className="text-[#bd8c0f] mr-2">💡</span>
              Exemple de questions (Chapitre sur la photosynthèse)
            </p>
            <div className="bg-white p-4 rounded-lg border border-amber-100">
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Questions personnelles :</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Comment expliquer simplement la photosynthèse à un enfant ?</li>
                  <li>Quelles sont les applications pratiques de la photosynthèse dans l'agriculture moderne ?</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Questions d'examen probables :</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Décrivez les deux phases principales de la photosynthèse et leurs produits.</li>
                  <li>Expliquez comment les facteurs environnementaux influencent le taux de photosynthèse.</li>
                  <li>Comparez et contrastez la photosynthèse et la respiration cellulaire.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Questions personnelles */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
            <h4 className="text-base font-medium text-gray-800 mb-3">1. Questions personnelles (facultatif)</h4>
            {personalQuestions.map((q, idx) => (
              <div key={idx} className="mb-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="relative">
                  <div className="w-full flex items-center gap-2 p-3 cursor-pointer group" style={{minHeight: 48}}>
                    <button
                      type="button"
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-[#bd8c0f] bg-white group-hover:bg-amber-50 transition-colors mr-2 focus:outline-none"
                      onClick={() => togglePersonalOpen(idx)}
                      tabIndex={0}
                      aria-label={personalOpen[idx] ? 'Replier la question' : 'Déplier la question'}
                    >
                      <span className={`transform transition-transform duration-200 text-[#bd8c0f] text-lg ${personalOpen[idx] ? 'rotate-90' : ''}`}>▶</span>
                    </button>
                    <div className="flex items-center w-full">
                      {personalOpen[idx] ? (
                        <input
                          className="font-medium text-gray-800 truncate bg-transparent border-b border-[#bd8c0f] focus:border-[#a37a0e] outline-none flex-1 mr-2"
                          placeholder="(Nouvelle question personnelle)"
                          value={q.question}
                          onChange={e => handlePersonalQuestionChange(idx, 'question', e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-gray-800 truncate flex-1">
                          {q.question || <span className="italic text-gray-400">(Nouvelle question personnelle)</span>}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Supprimer cette question"
                      onClick={() => removePersonalQuestion(idx)}
                    >
                      🗑️
                    </button>
                  </div>
                  {personalOpen[idx] && (
                    <div className="p-3 pt-0 bg-white">
                      <textarea
                        className="w-full border border-gray-200 rounded-lg p-3 min-h-[80px] mt-2 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f]"
                        placeholder="Ta réponse ou réflexion (facultatif)"
                        value={q.answer}
                        onChange={e => handlePersonalQuestionChange(idx, 'answer', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))} 
            <button
              type="button"
              className="mt-3 px-4 py-2 border border-[#bd8c0f] rounded-lg hover:bg-amber-50 font-medium text-[#bd8c0f] transition-colors flex items-center shadow-sm"
              onClick={addPersonalQuestion}
            >
              <span className="mr-2">+</span> Ajouter une question
            </button>
          </div>
          
          {/* Questions d'examen */}
          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5">
            <h4 className="text-base font-medium text-gray-800 mb-3">2. Questions d'examen probables (obligatoire)</h4>
            {examQuestions.map((q, idx) => (
              <div key={idx} className="mb-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="relative">
                  <div className="w-full flex items-center gap-2 p-3 cursor-pointer group" style={{minHeight: 48}}>
                    <button
                      type="button"
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-[#bd8c0f] bg-white group-hover:bg-amber-50 transition-colors mr-2 focus:outline-none"
                      onClick={() => toggleExamOpen(idx)}
                      tabIndex={0}
                      aria-label={examOpen[idx] ? 'Replier la question' : 'Déplier la question'}
                    >
                      <span className={`transform transition-transform duration-200 text-[#bd8c0f] text-lg ${examOpen[idx] ? 'rotate-90' : ''}`}>▶</span>
                    </button>
                    <div className="flex items-center w-full">
                      {examOpen[idx] ? (
                        <input
                          className="font-medium text-gray-800 truncate bg-transparent border-b border-[#bd8c0f] focus:border-[#a37a0e] outline-none flex-1 mr-2"
                          placeholder="(Nouvelle question d'examen)"
                          value={q.question}
                          onChange={e => handleExamQuestionChange(idx, 'question', e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-gray-800 truncate flex-1">
                          {q.question || <span className="italic text-gray-400">(Nouvelle question d'examen)</span>}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Supprimer cette question"
                      onClick={() => removeExamQuestion(idx)}
                    >
                      🗑️
                    </button>
                  </div>
                  {examOpen[idx] && (
                    <div className="p-3 pt-0 bg-white">
                      <textarea
                        className="w-full border border-gray-200 rounded-lg p-3 min-h-[80px] mt-2 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f]"
                        placeholder="Réponse (obligatoire)"
                        value={q.answer}
                        required
                        onChange={e => handleExamQuestionChange(idx, 'answer', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))} 
            <button
              type="button"
              className="mt-3 px-4 py-2 border border-[#bd8c0f] rounded-lg hover:bg-amber-50 font-medium text-[#bd8c0f] transition-colors flex items-center shadow-sm"
              onClick={addExamQuestion}
            >
              <span className="mr-2">+</span> Ajouter une question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSection;
