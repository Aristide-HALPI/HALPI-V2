import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../contexts/AuthContext';

interface MindmappingDigitalStepProps {
  activity: {
    id: string;
    title: string;
    content: string;
    chapterId: string;
  };
  onNext: () => void;
}

interface Branch {
  id: string;
  title: string;
  subBranches: SubBranch[];
}

interface SubBranch {
  id: string;
  title: string;
  details: string;
}

const MindmappingDigitalStep: React.FC<MindmappingDigitalStepProps> = ({ activity, onNext }) => {
  const { user } = useAuth();
  const [centralTopic, setCentralTopic] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  // État pour stocker les données de la mindmap sauvegardée

  // Charger la mindmap sauvegardée si elle existe
  useEffect(() => {
    if (user) {
      loadSavedMindmap();
    }
  }, [user, activity.id]);

  const loadSavedMindmap = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_mindmapping_progress')
        .select('*')
        .eq('activity_id', activity.id)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement de la mindmap:', error);
        return;
      }

      if (data) {
        setCentralTopic(data.central_topic || '');
        
        if (data.branches && Array.isArray(data.branches)) {
          setBranches(data.branches);
          
          // Initialiser les branches développées
          const expanded: Record<string, boolean> = {};
          data.branches.forEach((branch: Branch) => {
            expanded[branch.id] = true;
          });
          setExpandedBranches(expanded);
        }
        
        if (data.feedback) {
          setFeedback(data.feedback);
        }
        
        if (data.score !== undefined) {
          setScore(data.score);
        }
      }
    } catch (error) {
      console.error('Exception lors du chargement de la mindmap:', error);
    }
  };

  const saveMindmap = async () => {
    if (!user) return;

    try {
      const mindmapData = {
        activity_id: activity.id,
        user_id: user.id,
        chapter_id: activity.chapterId,
        central_topic: centralTopic,
        branches: branches,
        updated_at: new Date().toISOString(),
        feedback: feedback,
        score: score
      };

      const { error } = await supabase
        .from('activity_mindmapping_progress')
        .upsert([mindmapData], { 
          onConflict: 'activity_id,user_id' 
        });

      if (error) {
        console.error('Erreur lors de la sauvegarde de la mindmap:', error);
      }
    } catch (error) {
      console.error('Exception lors de la sauvegarde de la mindmap:', error);
    }
  };

  const addBranch = () => {
    const newBranch: Branch = {
      id: Date.now().toString(),
      title: '',
      subBranches: []
    };
    
    const updatedBranches = [...branches, newBranch];
    setBranches(updatedBranches);
    
    // Développer automatiquement la nouvelle branche
    setExpandedBranches({
      ...expandedBranches,
      [newBranch.id]: true
    });
  };

  const removeBranch = (branchId: string) => {
    setBranches(branches.filter(branch => branch.id !== branchId));
  };

  const updateBranchTitle = (branchId: string, title: string) => {
    setBranches(branches.map(branch => 
      branch.id === branchId ? { ...branch, title } : branch
    ));
  };

  const addSubBranch = (branchId: string) => {
    const newSubBranch: SubBranch = {
      id: Date.now().toString(),
      title: '',
      details: ''
    };
    
    setBranches(branches.map(branch => 
      branch.id === branchId 
        ? { ...branch, subBranches: [...branch.subBranches, newSubBranch] } 
        : branch
    ));
  };

  const removeSubBranch = (branchId: string, subBranchId: string) => {
    setBranches(branches.map(branch => 
      branch.id === branchId 
        ? { 
            ...branch, 
            subBranches: branch.subBranches.filter(sub => sub.id !== subBranchId) 
          } 
        : branch
    ));
  };

  const updateSubBranch = (branchId: string, subBranchId: string, field: 'title' | 'details', value: string) => {
    setBranches(branches.map(branch => 
      branch.id === branchId 
        ? { 
            ...branch, 
            subBranches: branch.subBranches.map(sub => 
              sub.id === subBranchId 
                ? { ...sub, [field]: value } 
                : sub
            ) 
          } 
        : branch
    ));
  };

  const toggleBranchExpansion = (branchId: string) => {
    setExpandedBranches({
      ...expandedBranches,
      [branchId]: !expandedBranches[branchId]
    });
  };

  const submitMindmap = async () => {
    if (centralTopic.trim() === '' || branches.length === 0) {
      alert('Veuillez remplir au moins le sujet central et ajouter une branche.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sauvegarde de la mindmap
      await saveMindmap();

      // Simulation d'une évaluation IA (à remplacer par un vrai appel API)
      // Note: Dans une implémentation réelle, vous feriez un appel à votre service d'IA
      setTimeout(() => {
        const simulatedFeedback = "Votre carte mentale est bien structurée. Le sujet central est clair et les branches principales sont pertinentes. Vous pourriez développer davantage certaines sous-branches pour approfondir votre réflexion.";
        const simulatedScore = 85;
        
        setFeedback(simulatedFeedback);
        setScore(simulatedScore);
        
        // Sauvegarder le feedback et le score
        saveMindmap();
        
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la soumission de la mindmap:', error);
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    saveMindmap();
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Création de votre carte mentale numérique</h2>
      
      <div className="bg-amber-50 border-l-4 border-[#bd8c0f] p-4 mb-6">
        <p className="text-sm text-gray-700">
          Maintenant que vous avez créé votre carte mentale manuscrite, transposez-la dans ce formulaire numérique. 
          Commencez par le sujet central, puis ajoutez des branches principales et leurs sous-branches.
        </p>
      </div>

      {/* Feedback de l'IA si disponible */}
      {feedback && (
        <div className="bg-white border rounded-md p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-[#bd8c0f] rounded-full p-1 mt-0.5">
              <Check size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Évaluation de votre carte mentale</h3>
              <p className="text-sm text-gray-600">{feedback}</p>
              {score !== null && (
                <div className="mt-2">
                  <span className="inline-block bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded">
                    Score: {score}/100
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de mindmapping */}
      <div className="space-y-6">
        {/* Sujet central */}
        <div className="bg-white border rounded-md p-4">
          <label htmlFor="central-topic" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <span className="bg-[#bd8c0f] text-white text-xs font-bold px-2 py-1 rounded mr-2">Sujet central</span>
          </label>
          <input
            id="central-topic"
            type="text"
            value={centralTopic}
            onChange={(e) => setCentralTopic(e.target.value)}
            placeholder="Entrez le sujet principal de votre carte mentale"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#bd8c0f]"
          />
        </div>

        {/* Branches */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Branches principales</h3>
            <button 
              onClick={addBranch}
              className="flex items-center gap-1 text-sm px-3 py-2 border border-[#bd8c0f] rounded-md text-[#bd8c0f] hover:bg-[#bd8c0f] hover:text-white"
            >
              <PlusCircle size={16} />
              Ajouter une branche
            </button>
          </div>

          {branches.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">Aucune branche ajoutée. Cliquez sur "Ajouter une branche" pour commencer.</p>
            </div>
          )}

          {branches.map((branch, index) => (
            <div key={branch.id} className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 flex-grow">
                  <button 
                    onClick={() => toggleBranchExpansion(branch.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedBranches[branch.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <input
                    type="text"
                    value={branch.title}
                    onChange={(e) => updateBranchTitle(branch.id, e.target.value)}
                    placeholder={`Branche ${index + 1}`}
                    className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 font-medium"
                  />
                </div>
                <button 
                  onClick={() => removeBranch(branch.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {expandedBranches[branch.id] && (
                <div className="p-3 space-y-4">
                  {/* Sous-branches */}
                  <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                    {branch.subBranches.map((subBranch) => (
                      <div key={subBranch.id} className="bg-white border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <input
                            type="text"
                            value={subBranch.title}
                            onChange={(e) => updateSubBranch(branch.id, subBranch.id, 'title', e.target.value)}
                            placeholder="Titre de la sous-branche"
                            className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 font-medium"
                          />
                          <button 
                            onClick={() => removeSubBranch(branch.id, subBranch.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <textarea
                          value={subBranch.details}
                          onChange={(e) => updateSubBranch(branch.id, subBranch.id, 'details', e.target.value)}
                          placeholder="Détails ou explications (optionnel)"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#bd8c0f]"
                          rows={2}
                        />
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => addSubBranch(branch.id)}
                      className="flex items-center gap-1 text-sm text-gray-600 bg-transparent border-none"
                    >
                      <PlusCircle size={14} />
                      Ajouter une sous-branche
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visualisation récapitulative */}
      {branches.length > 0 && (
        <div className="bg-white border rounded-md p-4 mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Récapitulatif de votre carte mentale</h3>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-center mb-4">
              <div className="bg-[#bd8c0f] text-white font-medium px-4 py-2 rounded-full">
                {centralTopic || "Sujet central"}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((branch) => (
                <div key={branch.id} className="border border-gray-200 rounded-md p-3 bg-white">
                  <h4 className="font-medium text-gray-800 mb-2">{branch.title || "Branche sans titre"}</h4>
                  
                  {branch.subBranches.length > 0 ? (
                    <ul className="pl-4 space-y-1">
                      {branch.subBranches.map((subBranch) => (
                        <li key={subBranch.id} className="text-sm">
                          <span className="font-medium">{subBranch.title || "Sous-branche sans titre"}</span>
                          {subBranch.details && (
                            <p className="text-xs text-gray-600 mt-1">{subBranch.details}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune sous-branche</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={() => saveMindmap()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Enregistrer
        </button>
        
        <div className="space-x-3">
          <button
            onClick={submitMindmap}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-[#bd8c0f] hover:bg-[#a57d0d] text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Évaluation en cours...' : 'Soumettre pour évaluation'}
          </button>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Terminer l'activité
          </button>
        </div>
      </div>
    </div>
  );
};

export default MindmappingDigitalStep;
