import { useState } from 'react';
import { Save, Trash2, ArrowRight, Plus, Edit2 } from 'lucide-react';

interface ConceptData {
  concept: string;
  explanation: string;
  questions: string[];
  answers: string[];
  feedbacks: string[]; // Changed to array - one feedback per question
}

interface QuestionsSectionProps {
  conceptsData: ConceptData[];
  onDeleteQuestion: (index: number) => void;
  onSave: () => void;
  onComplete: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

export function QuestionsSection({
  conceptsData,
  onDeleteQuestion,
  onSave,
  onComplete,
  saveStatus
}: QuestionsSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<ConceptData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConcept, setNewConcept] = useState<ConceptData>({
    concept: '',
    explanation: '',
    questions: [''],
    answers: [''],
    feedbacks: ['']
  });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedData({ ...conceptsData[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editedData) return;
    
    const updatedData = [...conceptsData];
    updatedData[editingIndex] = editedData;
    // Update parent state here
    
    setEditingIndex(null);
    setEditedData(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedData(null);
  };

  const handleAddQuestion = () => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      questions: [...editedData.questions, ''],
      answers: [...editedData.answers, ''],
      feedbacks: [...editedData.feedbacks, '']
    });
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      questions: editedData.questions.filter((_, i) => i !== qIndex),
      answers: editedData.answers.filter((_, i) => i !== qIndex),
      feedbacks: editedData.feedbacks.filter((_, i) => i !== qIndex)
    });
  };

  const handleAddNewConcept = () => {
    if (!newConcept.concept || !newConcept.explanation || 
        newConcept.questions.some(q => !q) || 
        newConcept.answers.some(a => !a) ||
        newConcept.feedbacks.some(f => !f)) {
      return;
    }

    // Add to parent state here
    setShowAddForm(false);
    setNewConcept({
      concept: '',
      explanation: '',
      questions: [''],
      answers: [''],
      feedbacks: ['']
    });
  };

  return (
    <section className="bg-white rounded-lg shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Questions importées</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-gold hover:text-gold/90"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
          <button
            onClick={onSave}
            disabled={saveStatus !== 'idle'}
            className="flex items-center gap-2 px-4 py-2 text-gold hover:text-gold/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'Enregistrement...' : 
             saveStatus === 'saved' ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Terminer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {showAddForm && (
          <div className="border-2 border-gold/20 rounded-lg p-6 bg-gold/5">
            <h4 className="font-medium mb-4">Ajouter un nouveau concept</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Concept</label>
                <input
                  type="text"
                  value={newConcept.concept}
                  onChange={e => setNewConcept({...newConcept, concept: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Explication</label>
                <textarea
                  value={newConcept.explanation}
                  onChange={e => setNewConcept({...newConcept, explanation: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                  rows={3}
                />
              </div>
              {newConcept.questions.map((q, i) => (
                <div key={i} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Question {i + 1}</label>
                    <input
                      type="text"
                      value={q}
                      onChange={e => {
                        const newQuestions = [...newConcept.questions];
                        newQuestions[i] = e.target.value;
                        setNewConcept({...newConcept, questions: newQuestions});
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Réponse {i + 1}</label>
                    <input
                      type="text"
                      value={newConcept.answers[i]}
                      onChange={e => {
                        const newAnswers = [...newConcept.answers];
                        newAnswers[i] = e.target.value;
                        setNewConcept({...newConcept, answers: newAnswers});
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Feedback {i + 1}</label>
                    <textarea
                      value={newConcept.feedbacks[i]}
                      onChange={e => {
                        const newFeedbacks = [...newConcept.feedbacks];
                        newFeedbacks[i] = e.target.value;
                        setNewConcept({...newConcept, feedbacks: newFeedbacks});
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddNewConcept}
                  className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        {conceptsData.map((item, index) => (
          <div key={index} className="border rounded-lg p-6">
            {editingIndex === index ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Concept</label>
                  <input
                    type="text"
                    value={editedData?.concept}
                    onChange={e => setEditedData(prev => prev ? {...prev, concept: e.target.value} : null)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Explication</label>
                  <textarea
                    value={editedData?.explanation}
                    onChange={e => setEditedData(prev => prev ? {...prev, explanation: e.target.value} : null)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                    rows={3}
                  />
                </div>
                {editedData?.questions.map((question, qIndex) => (
                  <div key={qIndex} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Question {qIndex + 1}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={question}
                          onChange={e => {
                            const newQuestions = [...editedData.questions];
                            newQuestions[qIndex] = e.target.value;
                            setEditedData({...editedData, questions: newQuestions});
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                        />
                        <button
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Réponse {qIndex + 1}</label>
                      <input
                        type="text"
                        value={editedData.answers[qIndex]}
                        onChange={e => {
                          const newAnswers = [...editedData.answers];
                          newAnswers[qIndex] = e.target.value;
                          setEditedData({...editedData, answers: newAnswers});
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Feedback {qIndex + 1}</label>
                      <textarea
                        value={editedData.feedbacks[qIndex]}
                        onChange={e => {
                          const newFeedbacks = [...editedData.feedbacks];
                          newFeedbacks[qIndex] = e.target.value;
                          setEditedData({...editedData, feedbacks: newFeedbacks});
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddQuestion}
                  className="text-gold hover:text-gold/90 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une question
                </button>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">{item.concept}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-gray-500 hover:text-gold"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteQuestion(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-sm text-gray-500">Explication :</p>
                    <p className="text-gray-700">{item.explanation}</p>
                  </div>
                  {item.questions.map((question, qIndex) => (
                    <div key={qIndex} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium mb-2">Question {qIndex + 1}</p>
                      <p className="text-gray-700 mb-2">{question}</p>
                      <p className="text-gray-700 mb-2">
                        <span className="font-medium">Réponse :</span> {item.answers[qIndex]}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Feedback :</span> {item.feedbacks[qIndex]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}