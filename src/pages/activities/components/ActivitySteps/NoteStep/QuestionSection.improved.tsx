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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center">
              <span className="bg-[#bd8c0f] text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 text-xs">1</span>
              Questions personnelles <span className="text-gray-500 ml-1 font-normal">(facultatif)</span>
            </h4>
            {personalQuestions.map((q, idx) => (
              <div key={idx} className="mb-3 bg-gray-50 rounded-lg shadow-sm">
                <div className="relative">
                  <div className="w-full flex items-center gap-2 p-3 cursor-pointer group" style={{minHeight: 48}}>
                    <button
                      type="button"
                      className="flex items-center justify-center w-6 h-6 text-[#bd8c0f]"
                      onClick={() => togglePersonalOpen(idx)}
                      tabIndex={0}
                      aria-label={personalOpen[idx] ? 'Replier la question' : 'Déplier la question'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform duration-200 ${personalOpen[idx] ? 'rotate-90' : ''}`}>
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
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
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 focus:outline-none transition-colors"
                      title="Supprimer cette question"
                      onClick={() => removePersonalQuestion(idx)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Ajouter une question
            </button>
          </div>
          
          {/* Questions d'examen */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center">
              <span className="bg-[#bd8c0f] text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 text-xs">2</span>
              Questions d'examen probables <span className="text-gray-500 ml-1 font-normal">(obligatoire)</span>
            </h4>
            {examQuestions.map((q, idx) => (
              <div key={idx} className="mb-3 bg-gray-50 rounded-lg shadow-sm">
                <div className="relative">
                  <div className="w-full flex items-center gap-2 p-3 cursor-pointer group" style={{minHeight: 48}}>
                    <button
                      type="button"
                      className="flex items-center justify-center w-6 h-6 text-[#bd8c0f]"
                      onClick={() => toggleExamOpen(idx)}
                      tabIndex={0}
                      aria-label={examOpen[idx] ? 'Replier la question' : 'Déplier la question'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform duration-200 ${examOpen[idx] ? 'rotate-90' : ''}`}>
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
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
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 focus:outline-none transition-colors"
                      title="Supprimer cette question"
                      onClick={() => removeExamQuestion(idx)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Ajouter une question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSection;
