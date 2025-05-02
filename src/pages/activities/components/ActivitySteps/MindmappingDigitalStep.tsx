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
  
  // Détection des modifications pour le rendu en temps réel
  useEffect(() => {
    // Afficher les branches dans la console pour débogage
    console.log('Branches actuelles:', branches);
    
    // Sauvegarder automatiquement les modifications pour assurer la cohérence
    if (user && (centralTopic || branches.length > 0)) {
      const timeoutId = setTimeout(() => {
        try {
          saveMindmap();
        } catch (error) {
          console.error('Erreur lors de la sauvegarde automatique:', error);
        }
      }, 500); // Délai pour éviter trop d'appels
      
      return () => clearTimeout(timeoutId);
    }
  }, [branches, centralTopic]);

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
      // S'assurer que les branches sont correctement sérialisées
      const serializedBranches = JSON.parse(JSON.stringify(branches));
      
      const mindmapData = {
        activity_id: activity.id,
        user_id: user.id,
        chapter_id: activity.chapterId,
        central_topic: centralTopic,
        branches: serializedBranches,
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

      {/* Visualisation récapitulative - toujours visible même si incomplet */}
      <div className="bg-white border rounded-md p-4 mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Récapitulatif de votre carte mentale</h3>
        
        <div className="bg-white p-4 rounded-md relative overflow-hidden" style={{ minHeight: '600px' }}>
          {/* Message d'aide si aucune branche n'est créée */}
          {branches.length === 0 && centralTopic === '' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 z-5">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg">Votre carte mentale s'affichera ici</p>
              <p className="text-sm mt-2">Commencez par saisir un sujet central et ajoutez des branches</p>
            </div>
          )}
          
          {/* Visualisation style mindmap professionnel */}
          <div className="relative w-full h-full" style={{ minHeight: '550px' }}>
            {/* Sujet central */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              {centralTopic && (
                <div className="bg-white border-2 border-blue-600 text-blue-800 font-bold px-6 py-4 rounded-lg shadow-lg text-center min-w-[180px]">
                  {centralTopic}
                </div>
              )}
            </div>
            
            {/* Branches principales et sous-branches */}
            {branches.length > 0 && (
              <div className="absolute inset-0">
                {/* Lignes de connexion */}
                {branches.map((branch, index) => {
                  // Définir les formes et couleurs pour chaque branche principale
                  const branchStyles = [
                    { color: '#4285F4', lightBg: '#D6E4FF', shape: 'rounded-full', icon: '🔵' }, // Cercle bleu
                    { color: '#34A853', lightBg: '#D7F4E3', shape: 'rounded-md', icon: '🟢' },     // Rectangle vert
                    { color: '#FBBC05', lightBg: '#FFF2D6', shape: 'rounded-md', icon: '🟡' },     // Rectangle jaune
                    { color: '#EA4335', lightBg: '#FFDAD6', shape: 'hexagon', icon: '🔴' },        // Hexagone rouge
                    { color: '#8E44AD', lightBg: '#F0D9FF', shape: 'rounded-full', icon: '🟣' },   // Cercle violet
                    { color: '#F39C12', lightBg: '#FFECD6', shape: 'hexagon', icon: '🟠' },        // Hexagone orange
                    { color: '#16A085', lightBg: '#D6F4F0', shape: 'rounded-md', icon: '🟩' }      // Rectangle turquoise
                  ];
                  
                  const style = branchStyles[index % branchStyles.length];
                  const totalBranches = branches.length;
                  
                  // Calculer la position de chaque branche principale
                  let positionX: number = 0, positionY: number = 0, lineX1: number = 0, lineY1: number = 0, lineX2: number = 0, lineY2: number = 0;
                  const centerX = 50; // Centre en pourcentage
                  const centerY = 50; // Centre en pourcentage
                  
                  // Distribuer les branches selon leur position dans le tableau
                  if (totalBranches <= 4) {
                    // Pour 1 à 4 branches, les placer aux 4 côtés
                    switch (index % 4) {
                      case 0: // Droite
                        positionX = 75;
                        positionY = 50;
                        lineX1 = centerX + 10;
                        lineY1 = centerY;
                        lineX2 = positionX - 10;
                        lineY2 = positionY;
                        break;
                      case 1: // Bas
                        positionX = 50;
                        positionY = 75;
                        lineX1 = centerX;
                        lineY1 = centerY + 10;
                        lineX2 = positionX;
                        lineY2 = positionY - 10;
                        break;
                      case 2: // Gauche
                        positionX = 25;
                        positionY = 50;
                        lineX1 = centerX - 10;
                        lineY1 = centerY;
                        lineX2 = positionX + 10;
                        lineY2 = positionY;
                        break;
                      case 3: // Haut
                        positionX = 50;
                        positionY = 25;
                        lineX1 = centerX;
                        lineY1 = centerY - 10;
                        lineX2 = positionX;
                        lineY2 = positionY + 10;
                        break;
                    }
                  } else {
                    // Pour plus de 4 branches, les répartir en cercle
                    const angle = ((index * (360 / totalBranches)) * Math.PI) / 180;
                    const distance = 25; // Distance du centre en pourcentage
                    
                    positionX = centerX + Math.cos(angle) * distance;
                    positionY = centerY + Math.sin(angle) * distance;
                    
                    // Points de départ et d'arrivée de la ligne
                    const innerDistance = 10;
                    const outerDistance = 10;
                    
                    lineX1 = centerX + Math.cos(angle) * innerDistance;
                    lineY1 = centerY + Math.sin(angle) * innerDistance;
                    lineX2 = positionX - Math.cos(angle) * outerDistance;
                    lineY2 = positionY - Math.sin(angle) * outerDistance;
                  }
                  
                  return (
                    <div key={branch.id} className="absolute" style={{ 
                      width: '100%', 
                      height: '100%',
                      pointerEvents: 'none'
                    }}>
                      {/* Ligne de connexion */}
                      <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ zIndex: 10 }}>
                        <line 
                          x1={`${lineX1}%`} 
                          y1={`${lineY1}%`} 
                          x2={`${lineX2}%`} 
                          y2={`${lineY2}%`} 
                          stroke={style.color} 
                          strokeWidth="2" 
                        />
                      </svg>
                      
                      {/* Branche principale */}
                      <div className="absolute" style={{ 
                        left: `${positionX}%`, 
                        top: `${positionY}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}>
                        <div className={`${style.shape === 'hexagon' ? 'hexagon' : ''} shadow-lg p-3 text-center font-bold min-w-[120px]`}
                          style={{
                            backgroundColor: style.color,
                            color: 'white',
                            borderRadius: style.shape === 'rounded-full' ? '9999px' : style.shape === 'rounded-md' ? '0.375rem' : '0'
                          }}>
                          {branch.title || "Branche sans titre"}
                        </div>
                        
                        {/* Sous-branches */}
                        {branch.subBranches.length > 0 && (
                          <div className="mt-4 space-y-2" style={{ 
                            maxWidth: '200px',
                            position: 'relative',
                            zIndex: 25
                          }}>
                            {branch.subBranches.map((subBranch) => {
                              // Déterminer la direction des sous-branches
                              const isLeft = positionX < centerX;
                              const marginDirection = isLeft ? 'mr-auto' : 'ml-auto';
                              const borderDirection = isLeft ? 'border-l-4' : 'border-r-4';
                              
                              return (
                                <div key={subBranch.id} 
                                  className={`${marginDirection} ${borderDirection} rounded-md p-2 shadow-md`} 
                                  style={{ 
                                    backgroundColor: style.lightBg,
                                    borderColor: style.color,
                                    maxWidth: '180px'
                                  }}>
                                  <div className="font-medium text-sm">{subBranch.title || "Sous-branche"}</div>
                                  {subBranch.details && (
                                    <p className="text-xs mt-1 text-gray-700">{subBranch.details}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Style pour les formes hexagonales */}
      <style>{`
        .hexagon {
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
      `}</style>

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
