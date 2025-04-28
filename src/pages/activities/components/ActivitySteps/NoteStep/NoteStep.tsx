import React, { useState, useEffect } from 'react';
import OutlineSection from './OutlineSection';
import BoxSection from './BoxSection';
import QuestionSection from './QuestionSection';
import { supabase } from '../../../../../lib/supabaseClient';

interface Activity {
  id: string;
  title: string;
  // Autres propriétés nécessaires
}

interface NoteStepProps {
  activity: Activity;
}

const NoteStep: React.FC<NoteStepProps> = ({ activity }) => {
  const [showOutlineExample, setShowOutlineExample] = useState(false);
  const [showBoxExample, setShowBoxExample] = useState(false);
  const [showQuestionsExample, setShowQuestionsExample] = useState(false);
  
  // États pour stocker les données des composants enfants
  const [outlineContent, setOutlineContent] = useState('');
  const [boxesContent, setBoxesContent] = useState<any[]>([]);
  const [personalQuestions, setPersonalQuestions] = useState<{question: string, answer: string}[]>([]);
  const [examQuestions, setExamQuestions] = useState<{question: string, answer: string}[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Charger les données depuis localStorage au montage du composant
  useEffect(() => {
    const storageKey = `notes_${activity.id}`;
    console.log('Loading notes from localStorage with key:', storageKey);
    const savedData = localStorage.getItem(storageKey);
    console.log('Saved data found:', savedData ? 'YES' : 'NO');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Parsed data:', parsedData);
        setOutlineContent(parsedData.outline || '');
        setBoxesContent(parsedData.boxes || []);
        setPersonalQuestions(parsedData.questions?.personal || []);
        setExamQuestions(parsedData.questions?.exam || []);
        console.log('States updated with saved data');
      } catch (error) {
        console.error('Error parsing saved notes:', error);
      }
    }
  }, [activity.id]);

  // Sauvegarder automatiquement dans localStorage quand les données changent
  useEffect(() => {
    // Éviter de sauvegarder si toutes les données sont vides (premier rendu)
    if (!outlineContent && boxesContent.length === 0 && personalQuestions.length === 0 && examQuestions.length === 0) {
      console.log('Skipping initial empty save');
      return;
    }
    
    const storageKey = `notes_${activity.id}`;
    const dataToSave = {
      outline: outlineContent,
      boxes: boxesContent,
      questions: {
        personal: personalQuestions,
        exam: examQuestions
      }
    };
    
    console.log('Saving to localStorage with key:', storageKey);
    console.log('Data to save:', dataToSave);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log('Data saved successfully to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [activity.id, outlineContent, boxesContent, personalQuestions, examQuestions]);

  const handleSaveNotes = async () => {
    setSaving(true);
    console.log('Saving notes to database...');
    
    // Utiliser les états pour construire l'objet content
    const content = {
      outline: outlineContent,
      boxes: boxesContent,
      questions: {
        personal: personalQuestions,
        exam: examQuestions
      }
    };
    
    console.log('Content to save:', content);
    
    try {
      // Récupérer l'utilisateur actuel
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      console.log('Current user ID:', userId);
      
      if (!userId) {
        console.error('No user ID found');
        alert("Erreur: Utilisateur non connecté");
        setSaving(false);
        return;
      }
      
      const { error } = await supabase
        .from('activity_notes')
        .upsert([{ 
          activity_id: activity.id, 
          content,
          user_id: userId
        }], { 
          onConflict: 'activity_id,user_id' 
        });
      
      if (error) {
        console.error('Error saving notes to database:', error);
        alert("Erreur lors de l'enregistrement: " + error.message);
      } else {
        console.log('Notes saved successfully to database');
        alert('Notes enregistrées avec succès');
      }
    } catch (error) {
      console.error('Exception during save:', error);
      alert("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center mr-4">
            <span className="text-[#bd8c0f] text-2xl">📝</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Prise de notes</h2>
        </div>
      </div>
      
      {/* Introduction à la méthode en 3 temps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="border-l-4 border-[#bd8c0f] px-6 py-5 bg-amber-50">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">La méthode HALPI en 3 temps</h3>
          <p className="text-gray-600">Une structure complète pour organiser efficacement tes notes</p>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Cette méthode te propose une structure en 3 zones complémentaires pour organiser tes notes de façon efficace. Chaque zone a un objectif précis et t'aide à structurer ta pensée.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="bg-amber-50 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-[#bd8c0f] font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-800">Outlines</h4>
              </div>
              <p className="text-gray-600">Un plan hiérarchisé qui reprend la structure logique du chapitre, avec titres et sous-titres.</p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="bg-amber-50 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-[#bd8c0f] font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-800">Boxes</h4>
              </div>
              <p className="text-gray-600">Des boîtes thématiques qui expliquent les notions importantes avec tes mots.</p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="bg-amber-50 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <span className="text-[#bd8c0f] font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-800">Questions</h4>
              </div>
              <p className="text-gray-600">Des questions pour clarifier tes doutes et anticiper les évaluations.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Les trois sections de prise de notes */}
      <div className="flex flex-col space-y-8">
        <OutlineSection 
          showExample={showOutlineExample}
          setShowExample={setShowOutlineExample}
          value={outlineContent}
          onChange={setOutlineContent}
        />
        
        <BoxSection 
          showExample={showBoxExample}
          setShowExample={setShowBoxExample}
          boxes={boxesContent}
          setBoxes={setBoxesContent}
        />
        
        <QuestionSection 
          showExample={showQuestionsExample}
          setShowExample={setShowQuestionsExample}
          personalQuestions={personalQuestions}
          setPersonalQuestions={setPersonalQuestions}
          examQuestions={examQuestions}
          setExamQuestions={setExamQuestions}
        />
      </div>
      
      <div className="flex justify-center mt-8 mb-4">
        <button
          onClick={handleSaveNotes}
          disabled={saving}
          className="px-8 py-3 bg-[#bd8c0f] text-white rounded-lg hover:bg-[#a37a0e] disabled:opacity-50 font-medium flex items-center justify-center shadow-sm transition-all"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
        </button>
      </div>
    </div>
  );
};

export default NoteStep;
