import React, { useState, useEffect } from 'react';
import { AlertCircle, BookOpen, Plus, Brain, Edit3, Trash2, X, Pencil, Save, CheckCircle } from 'lucide-react';
import { HotspotEditor } from '../../../../components/InteractiveImage';
import Button from '../../../../components/common/Button';
import { supabase } from '../../../../lib/supabaseClient';

interface Activity {
  id: string;
  title: string;
  chapterPdfUrl?: string;
  courseId?: string;
}

interface ConceptsStepProps {
  activity: Activity;
}

interface CustomField {
  id: string;
  title: string;
  content: string;
}

interface Hotspot {
  id: string;
  shape: 'circle' | 'rect';
  coords: {
    x: number;
    y: number;
    w?: number;
    h?: number;
    r?: number;
  };
  title: string;
  description?: string;
  number?: number | null;
}

interface Concept {
  id: string;
  name: string;
  who: string;
  what: string;
  why: string;
  how: string;
  when: string;
  where: string;
  essentials: string;
  hasSchema: boolean;
  schemaImage?: string; // Base64 de l'image
  hotspots?: Hotspot[];
  exerciseType?: 'legend' | 'find';
  displayOptions?: {
    zoneDisplay: 'normal' | 'masked' | 'blurred' | 'transparent';
  };
  customFields: CustomField[];
}

const ConceptsStep: React.FC<ConceptsStepProps> = ({ activity }) => {
  // État pour gérer les concepts créés
  const [concepts, setConcepts] = useState<Concept[]>([]);
  
  // État pour gérer l'affichage du formulaire de concept
  const [showConceptForm, setShowConceptForm] = useState(false);
  
  // États pour la sauvegarde dans la base de données
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // États pour gérer les sections dépliables dans le formulaire
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    who: false,
    what: false,
    why: false,
    how: false,
    when: false,
    where: false,
    essentials: false,
    schema: false,
    hotspots: false,
    other: false
  });
  
  // État pour gérer l'affichage de l'éditeur d'images interactives
  const [showHotspotEditor, setShowHotspotEditor] = useState(false);
  
  // Fonction pour basculer l'état d'une section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const [currentConcept, setCurrentConcept] = useState<Concept | null>(null);
  
  // État pour gérer le formulaire de nouveau concept
  const initialConcept: Concept = {
    id: '',
    name: '',
    who: '',
    what: '',
    why: '',
    how: '',
    when: '',
    where: '',
    essentials: '',
    hasSchema: false,
    schemaImage: '',
    hotspots: [],
    exerciseType: 'find',
    displayOptions: {
      zoneDisplay: 'normal'
    },
    customFields: []
  };
  const [newConcept, setNewConcept] = useState<Concept>(initialConcept);
  
  // Fonction pour ajouter un nouveau concept
  const handleAddConcept = () => {
    setShowConceptForm(true);
    setCurrentConcept(null);
    setNewConcept(initialConcept);
    setIsSaved(false); // Marquer comme non sauvegardé après modification
  };
  
  // Fonction pour fermer le formulaire
  const handleCloseForm = () => {
    setShowConceptForm(false);
  };
  
  // État pour gérer l'affichage du modal de détail
  const [showConceptDetail, setShowConceptDetail] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  // Fonction pour afficher le détail d'un concept
  const handleViewConceptDetail = (concept: Concept, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation pour éviter d'ouvrir le formulaire d'édition
    setSelectedConcept(concept);
    setShowConceptDetail(true);
  };

  // Fonction pour fermer le modal de détail
  const handleCloseDetail = () => {
    setShowConceptDetail(false);
    setSelectedConcept(null);
  };
  
  // Fonction pour sauvegarder tous les concepts dans la base de données
  const saveConceptsToDatabase = async () => {
    if (concepts.length === 0) {
      setSaveError("Vous devez créer au moins un concept avant de sauvegarder.");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Récupérer l'utilisateur actuel
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      if (!userId) {
        setSaveError("Erreur: Utilisateur non connecté");
        setIsSaving(false);
        return;
      }
      
      // Préparer les données à enregistrer
      const conceptsData = {
        activity_id: activity.id,
        user_id: userId,
        concepts: concepts,
        updated_at: new Date().toISOString()
      };
      
      // Enregistrer dans Supabase
      const { error } = await supabase
        .from('activity_concepts')
        .upsert([conceptsData], { 
          onConflict: 'activity_id,user_id' 
        });
      
      if (error) {
        console.error('Erreur lors de l\'enregistrement des concepts:', error);
        setSaveError("Erreur lors de l'enregistrement: " + error.message);
      } else {
        console.log('Concepts enregistrés avec succès');
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Exception lors de la sauvegarde des concepts:', error);
      setSaveError("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Charger les concepts existants au chargement du composant
  useEffect(() => {
    const loadConcepts = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        
        if (!userId || !activity.id) return;
        
        const { data, error } = await supabase
          .from('activity_concepts')
          .select('concepts')
          .eq('activity_id', activity.id)
          .eq('user_id', userId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          console.error('Erreur lors du chargement des concepts:', error);
          return;
        }
        
        if (data && data.concepts) {
          setConcepts(data.concepts);
          setIsSaved(true);
        }
      } catch (error) {
        console.error('Exception lors du chargement des concepts:', error);
      }
    };
    
    loadConcepts();
  }, [activity.id]);
  
  // Fonction pour éditer un concept existant
  const handleEditConcept = (concept: Concept, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation pour éviter d'ouvrir le détail
    setCurrentConcept(concept);
    setNewConcept({
      ...concept,
      // S'assurer que tous les champs sont présents même pour les anciens concepts
      who: concept.who || '',
      what: concept.what || '',
      why: concept.why || '',
      how: concept.how || '',
      when: concept.when || '',
      where: concept.where || '',
      essentials: concept.essentials || '',
      hasSchema: concept.hasSchema || false,
      schemaImage: concept.schemaImage || '',
      hotspots: concept.hotspots || [],
      exerciseType: concept.exerciseType || 'find',
      displayOptions: concept.displayOptions || { zoneDisplay: 'normal' },
      customFields: concept.customFields || []
    });
    setShowConceptForm(true);
    setIsSaved(false); // Marquer comme non sauvegardé après modification
  };
  
  // Fonction pour supprimer un concept
  const handleDeleteConcept = (conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation
    setConcepts(concepts.filter(c => c.id !== conceptId));
    setIsSaved(false); // Marquer comme non sauvegardé après modification
  };
  
  // Fonction pour sauvegarder un concept
  const handleSaveConcept = () => {
    if (currentConcept) {
      // Mise à jour d'un concept existant
      setConcepts(concepts.map(c => c.id === currentConcept.id ? { ...newConcept, id: currentConcept.id } : c));
    } else {
      // Ajout d'un nouveau concept
      const newId = (concepts.length + 1).toString();
      setConcepts([...concepts, { ...newConcept, id: newId }]);
    }
    setShowConceptForm(false);
    setIsSaved(false); // Marquer comme non sauvegardé après modification
  };
  
  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewConcept(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Fonction pour gérer le changement de l'état du schéma
  const handleSchemaChange = (hasSchema: boolean) => {
    setNewConcept(prev => ({
      ...prev,
      hasSchema
    }));
  };
  
  // Fonction pour gérer l'upload d'image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNewConcept(prev => ({
          ...prev,
          schemaImage: base64String,
          hasSchema: true
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Fonction pour gérer le collage d'image
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setNewConcept(prev => ({
              ...prev,
              schemaImage: base64String,
              hasSchema: true
            }));
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête avec icône */}
      <div className="flex items-start mb-6">
        <div className="bg-amber-50 p-3 rounded-lg mr-4">
          <Brain className="text-amber-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Identifier les concepts clés</h2>
          <p className="text-gray-600">
            Dans cet exercice, vous allez identifier et expliquer les concepts clés de votre chapitre. Pour chaque 
            concept, vous devrez fournir une explication détaillée et structurée.
          </p>
        </div>
      </div>
      
      {/* Section d'explication des concepts clés */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-3">Qu'est-ce qu'un concept clé ?</h3>
        <p className="text-gray-700 mb-4">
          Un concept clé est une notion centrale qui résume une idée, un événement, un processus ou 
          une théorie essentielle à la compréhension du sujet. C'est un élément fondamental autour 
          duquel s'organisent les connaissances.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Caractéristiques</h4>
            <ul className="space-y-1">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-gray-600">Synthétise l'information importante</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-gray-600">Relie différentes notions entre elles</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Objectifs</h4>
            <ul className="space-y-1">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-gray-600">Facilite la mémorisation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-gray-600">Structure les connaissances</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          variant="secondary" 
          onClick={() => window.open(activity.chapterPdfUrl, '_blank')}
          disabled={!activity.chapterPdfUrl}
          className="flex items-center"
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Ouvrir le chapitre
        </Button>
        
        <Button 
          variant="primary" 
          onClick={handleAddConcept}
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="mr-2 h-5 w-5" />
          Ajouter un concept
        </Button>
      </div>
      
      {/* Message d'erreur */}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="text-red-500 w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-red-700">{saveError}</div>
        </div>
      )}
      
      {/* Message de succès */}
      {isSaved && concepts.length > 0 && !saveError && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="text-green-500 w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-green-700">Vos concepts ont été enregistrés avec succès. Vous pouvez maintenant passer à l'étape suivante.</div>
        </div>
      )}
      
      {/* Bouton d'enregistrement des concepts (en bas à droite) */}
      <div className="flex justify-end mb-8">
        <Button 
          variant="outline" 
          onClick={saveConceptsToDatabase}
          disabled={isSaving || (isSaved && concepts.length > 0)}
          className={`flex items-center border-2 ${isSaved 
            ? 'bg-green-50 border-green-500 text-green-600 hover:bg-green-100' 
            : 'bg-white border-[#bd8c0f] text-[#bd8c0f] hover:bg-amber-50'}`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#bd8c0f] mr-2"></div>
              Enregistrement...
            </>
          ) : isSaved ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Enregistré
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Enregistrer les concepts
            </>
          )}
        </Button>
      </div>
      
      {/* Liste des concepts */}
      {concepts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {concepts.map(concept => (
            <div 
              key={concept.id} 
              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all relative group"
              onClick={(e) => handleViewConceptDetail(concept, e)}
            >
              {/* Contenu principal avec icône et titre */}
              <div className="flex items-center mb-3">
                <div className="bg-amber-100 rounded-full p-2 mr-2.5 flex-shrink-0">
                  <Brain className="text-amber-600 w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-800 text-base truncate">{concept.name}</h3>
              </div>
              
              {/* Badges pour les sections remplies */}
              <div className="flex flex-wrap gap-1.5 mt-2 pl-9">
                {concept.who && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">Qui</span>}
                {concept.what && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium">Quoi</span>}
                {concept.why && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium">Pourquoi</span>}
                {concept.how && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-medium">Comment</span>}
                {concept.when && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Quand</span>}
                {concept.where && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-medium">Où</span>}
                {concept.essentials && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">Essentiel</span>}
                {concept.hasSchema && <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-medium">Schéma</span>}
                {concept.customFields && concept.customFields.length > 0 && <span className="text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded-md font-medium">+{concept.customFields.length}</span>}
              </div>
              
              {/* Boutons d'action au survol */}
              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => handleEditConcept(concept, e)}
                  className="p-1.5 bg-gray-100 hover:bg-blue-100 rounded-full text-gray-600 hover:text-blue-600 transition-colors"
                  title="Modifier"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={(e) => handleDeleteConcept(concept.id, e)}
                  className="p-1.5 bg-gray-100 hover:bg-red-100 rounded-full text-gray-600 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center mb-6">
          <p className="text-gray-500 mb-2">Aucun concept clé n'a encore été ajouté.</p>
          <p className="text-gray-500">Cliquez sur "Ajouter un concept" pour commencer.</p>
        </div>
      )}
      
      {/* Modal de détail du concept */}
      {showConceptDetail && selectedConcept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{selectedConcept.name}</h3>
                <button 
                  onClick={handleCloseDetail}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Quoi ? */}
                {selectedConcept.what && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Quoi ?</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConcept.what}</p>
                  </div>
                )}
                
                {/* Pourquoi ? */}
                {selectedConcept.why && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Pourquoi ?</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConcept.why}</p>
                  </div>
                )}
                
                {/* Comment ? */}
                {selectedConcept.how && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Comment ?</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConcept.how}</p>
                  </div>
                )}
                
                {/* Qui ? */}
                {selectedConcept.who && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Qui ?</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConcept.who}</p>
                  </div>
                )}
                
                {/* Quand ? */}
                {selectedConcept.when && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Quand ?</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConcept.when}</p>
                  </div>
                )}
                
                {/* Où ? */}
                {selectedConcept.where && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Où ?</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConcept.where}</p>
                  </div>
                )}
                
                {/* Essentiel */}
                {selectedConcept.essentials && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">L'essentiel à retenir</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedConcept.essentials}</p>
                  </div>
                )}
                
                {/* Schéma */}
                {selectedConcept.hasSchema && selectedConcept.schemaImage && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Schéma</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={selectedConcept.schemaImage} 
                        alt={`Schéma pour ${selectedConcept.name}`}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                )}
                
                {/* Champs personnalisés */}
                {selectedConcept.customFields && selectedConcept.customFields.length > 0 && (
                  <div className="space-y-4">
                    {selectedConcept.customFields.map((field, index) => (
                      <div key={field.id || index}>
                        <h4 className="font-medium text-gray-700 mb-2">{field.title}</h4>
                        <p className="text-gray-600 whitespace-pre-line">{field.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={handleCloseDetail}
                >
                  Fermer
                </Button>
                <Button 
                  variant="primary" 
                  onClick={(e) => {
                    handleCloseDetail();
                    handleEditConcept(selectedConcept, e);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Pencil size={16} className="mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Formulaire de concept (modal) */}
      {showConceptForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentConcept ? 'Modifier le concept' : 'Ajouter un nouveau concept'}
                </h3>
                <button 
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                  <p className="text-blue-800 font-medium mb-2">Instructions pour remplir la carte d'identité :</p>
                  <ul className="list-disc pl-5 text-blue-700 text-sm">
                    <li>Le champ <strong>Nom du concept</strong> est obligatoire</li>
                    <li>Remplissez au minimum un autre champ de votre choix</li>
                    <li>Tous les champs ne doivent pas être nécessairement remplis, uniquement ceux pertinents pour votre concept clé</li>
                    <li>Concentrez-vous sur les aspects les plus importants pour la compréhension du concept</li>
                  </ul>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du concept <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newConcept.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Entrez le nom du concept"
                  />
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label htmlFor="who" className="block text-sm font-medium text-gray-700">
                      Qui ?
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('who')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.who ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.who && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>À quoi ou à qui associe-t-on ce concept ? Cela peut être :</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Un auteur / chercheur / théoricien</li>
                        <li>Un courant disciplinaire</li>
                        <li>Un contexte historique ou scientifique</li>
                      </ul>
                      <p className="mt-1"><strong>Exemples :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : Étudiée par Jan Ingenhousz</li>
                        <li>Troisième loi de Newton : Formulée par Isaac Newton</li>
                        <li>Dissonance cognitive : Théorie introduite par Leon Festinger</li>
                      </ul>
                    </div>
                  )}
                  
                  <textarea
                    id="who"
                    name="who"
                    value={newConcept.who}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder=""
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label htmlFor="what" className="block text-sm font-medium text-gray-700">
                      Quoi ? (définition)
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('what')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.what ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.what && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>Définition exacte du concept, telle que donnée dans le cours.</p>
                      <p className="mt-1"><strong>Ne pas reformuler avec ses propres mots.</strong></p>
                      <p className="mt-1"><strong>Exemples :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : "Processus par lequel les plantes convertissent l'énergie lumineuse en énergie chimique (glucose), en rejetant de l'oxygène."</li>
                        <li>Troisième loi de Newton : "Toute action provoque une réaction égale et opposée."</li>
                        <li>Dissonance cognitive : "Tension mentale provoquée par la contradiction entre deux cognitions simultanées (ex : croyance vs comportement)."</li>
                      </ul>
                    </div>
                  )}
                  
                  <textarea
                    id="what"
                    name="what"
                    value={newConcept.what}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder=""
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label htmlFor="why" className="block text-sm font-medium text-gray-700">
                      Pourquoi ?
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('why')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.why ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.why && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>À quoi sert ce concept dans le cours ? Quelle est son utilité ou fonction ?</p>
                      <p className="mt-1"><strong>Exemples :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : Explique la production d'oxygène et la base des chaînes alimentaires</li>
                        <li>Troisième loi de Newton : Permet de comprendre les interactions mécaniques et la propulsion</li>
                        <li>Dissonance cognitive : Sert à analyser les conflits internes et les changements d'attitude</li>
                      </ul>
                    </div>
                  )}
                  
                  <textarea
                    id="why"
                    name="why"
                    value={newConcept.why}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder=""
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label htmlFor="how" className="block text-sm font-medium text-gray-700">
                      Comment ?
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('how')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.how ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.how && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>Comment fonctionne ce concept ? Quelles sont ses étapes, son mécanisme, sa logique ?</p>
                      <p className="mt-1"><strong>Exemples :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : Phase photochimique (lumière captée), puis cycle de Calvin (synthèse du glucose)</li>
                        <li>Troisième loi de Newton : Lorsqu'un corps A exerce une force sur B, B exerce une force égale et opposée sur A (ex. : nageur qui pousse l'eau)</li>
                        <li>Dissonance cognitive : L'individu modifie ses croyances ou comportements pour réduire l'inconfort</li>
                      </ul>
                    </div>
                  )}
                  
                  <textarea
                    id="how"
                    name="how"
                    value={newConcept.how}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder=""
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label htmlFor="when" className="block text-sm font-medium text-gray-700">
                      Quand ?
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('when')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.when ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.when && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>Dans quels contextes ce concept s'applique-t-il ? <em>OU</em> quand a-t-il été découvert/formulé ?</p>
                      <p className="mt-1"><strong>Exemples de contextes d'application :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : En journée, lorsque la lumière est présente</li>
                        <li>Troisième loi de Newton : Dès qu'il y a interaction physique (collision, poussée…)</li>
                        <li>Dissonance cognitive : Quand une personne agit contre ses valeurs ou croyances</li>
                      </ul>
                      <p className="mt-1"><strong>Exemples de découverte :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : Découverte au XVIIe siècle, précisée en 1779</li>
                        <li>Troisième loi de Newton : Formulée en 1687 dans les Principia Mathematica</li>
                        <li>Dissonance cognitive : Théorie élaborée en 1957</li>
                      </ul>
                    </div>
                  )}
                  
                  <textarea
                    id="when"
                    name="when"
                    value={newConcept.when}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder=""
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label htmlFor="where" className="block text-sm font-medium text-gray-700">
                      Où ?
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('where')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.where ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.where && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>Dans quel domaine, environnement ou discipline ce concept est-il utilisé ?</p>
                      <p className="mt-1"><strong>Exemples :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : Biologie végétale, écologie</li>
                        <li>Troisième loi de Newton : Physique, ingénierie, sport</li>
                        <li>Dissonance cognitive : Psychologie sociale, marketing, éducation</li>
                      </ul>
                    </div>
                  )}
                  
                  <textarea
                    id="where"
                    name="where"
                    value={newConcept.where}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder=""
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label htmlFor="essentials" className="block text-sm font-medium text-gray-700">
                      Points essentiels à mémoriser
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('essentials')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.essentials ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.essentials && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>Résumé des éléments clés à retenir : formules, mots-clés, pièges à éviter.</p>
                      <p className="mt-1"><strong>Exemples :</strong></p>
                      <ul className="list-disc pl-5">
                        <li>Photosynthèse : 6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂</li>
                        <li>Troisième loi de Newton : Action = Réaction (deux corps distincts)</li>
                        <li>Dissonance cognitive : Tension → Ajustement cognitif → Réduction de l'inconfort</li>
                      </ul>
                    </div>
                  )}
                  
                  <textarea
                    id="essentials"
                    name="essentials"
                    value={newConcept.essentials}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder=""
                  ></textarea>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Schéma / Illustration (optionnel)
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('schema')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.schema ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.schema && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>Schéma explicatif du concept.</p>
                      <p className="mt-1"><strong>Si un schéma est présent, le champ Explication / légende est obligatoire.</strong></p>
                    </div>
                  )}
                  
                  <div 
                    className={`border border-dashed ${newConcept.hasSchema ? 'border-amber-500 bg-amber-50' : 'border-gray-300'} rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50`}
                    onClick={() => !newConcept.schemaImage && handleSchemaChange(!newConcept.hasSchema)}
                    onPaste={handlePaste}
                    tabIndex={0}
                  >
                    {newConcept.schemaImage ? (
                      <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Image téléchargée</p>
                          <p className="text-xs text-gray-500 mt-1">L'image sera utilisée pour l'exercice interactif</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewConcept(prev => ({
                              ...prev,
                              schemaImage: '',
                              hasSchema: false
                            }));
                          }}
                          className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mx-auto ${newConcept.hasSchema ? 'text-amber-500' : 'text-gray-400'} mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500 mb-2">
                          Cliquez pour ajouter une image ou collez un screenshot
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="schema-upload"
                          onChange={handleImageUpload}
                        />
                        <label 
                          htmlFor="schema-upload" 
                          className="inline-block px-4 py-2 bg-[#bd8c0f] text-white rounded-md cursor-pointer hover:bg-amber-600 transition-colors"
                        >
                          Parcourir...
                        </label>
                      </>
                    )}
                  </div>
                </div>
                
                {newConcept.schemaImage && (
                  <div className="mb-4">
                    <div className="flex items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Créer un exercice interactif
                      </label>
                      <button 
                        type="button" 
                        className="ml-2 text-amber-500" 
                        onClick={() => toggleSection('hotspots')}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 transition-transform ${expandedSections.hotspots ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    
                    {expandedSections.hotspots && (
                      <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                        <p>Créez un exercice interactif basé sur cette image :</p>
                        <ul className="list-disc pl-5 mt-1">
                          <li><strong>Légender une image</strong> : L'apprenant doit placer les étiquettes sur les zones correspondantes</li>
                          <li><strong>Trouver sur l'image</strong> : L'apprenant doit cliquer sur les zones demandées</li>
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setShowHotspotEditor(!showHotspotEditor)}
                        className="flex items-center px-4 py-2 bg-[#bd8c0f] text-white rounded-md hover:bg-amber-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        {showHotspotEditor ? "Masquer l'éditeur" : "Créer des zones interactives"}
                      </button>
                      
                      <div className="text-sm text-gray-500">
                        {newConcept.hotspots && newConcept.hotspots.length > 0 ? 
                          `${newConcept.hotspots.length} zone${newConcept.hotspots.length > 1 ? 's' : ''} définie${newConcept.hotspots.length > 1 ? 's' : ''}` : 
                          "Aucune zone définie"}
                      </div>
                    </div>
                    
                    {showHotspotEditor && (
                      <div className="border border-gray-300 rounded-lg p-4 mb-4">
                        <HotspotEditor
                          imageUrl={newConcept.schemaImage}
                          initialHotspots={newConcept.hotspots || []}
                          onSave={(hotspots: any[], mode: string, displayOptions: any) => {
                            setNewConcept(prev => ({
                              ...prev,
                              hotspots: hotspots,
                              exerciseType: mode as 'legend' | 'find',
                              displayOptions: displayOptions
                            }));
                            setShowHotspotEditor(false);
                          }}
                          onCancel={() => setShowHotspotEditor(false)}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Champs personnalisés
                    </label>
                    <button 
                      type="button" 
                      className="ml-2 text-amber-500" 
                      onClick={() => toggleSection('other')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${expandedSections.other ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {expandedSections.other && (
                    <div className="mb-2 text-sm text-gray-600 bg-amber-50 p-2 rounded border border-amber-100">
                      <p>Ajoutez des champs personnalisés pour enrichir votre carte d'identité du concept.</p>
                      <p className="mt-1">Vous pouvez, par exemple, créer :</p>
                      <ul className="list-disc pl-5">
                        <li>Un champ "Exemple" avec une application concrète</li>
                        <li>Un champ "Anecdote" avec un fait intéressant</li>
                        <li>Un champ "Pièges à éviter" avec les erreurs courantes</li>
                      </ul>
                    </div>
                  )}
                  
                  {newConcept.customFields.map((field, index) => (
                    <div key={field.id} className="mb-3 p-3 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={field.title}
                          onChange={(e) => {
                            const updatedFields = [...newConcept.customFields];
                            updatedFields[index].title = e.target.value;
                            setNewConcept(prev => ({
                              ...prev,
                              customFields: updatedFields
                            }));
                          }}
                          className="font-medium border-b border-gray-300 focus:border-amber-500 focus:outline-none px-1 py-1 w-full"
                          placeholder="Titre du champ (ex: Exemple, Anecdote...)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedFields = newConcept.customFields.filter((_, i) => i !== index);
                            setNewConcept(prev => ({
                              ...prev,
                              customFields: updatedFields
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <textarea
                        value={field.content}
                        onChange={(e) => {
                          const updatedFields = [...newConcept.customFields];
                          updatedFields[index].content = e.target.value;
                          setNewConcept(prev => ({
                            ...prev,
                            customFields: updatedFields
                          }));
                        }}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder=""
                      ></textarea>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setNewConcept(prev => ({
                        ...prev,
                        customFields: [
                          ...prev.customFields,
                          { id: Date.now().toString(), title: '', content: '' }
                        ]
                      }));
                    }}
                    className="flex items-center text-[#bd8c0f] hover:text-amber-700 mt-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter un champ personnalisé
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="secondary" 
                  onClick={handleCloseForm}
                  className="mr-3"
                >
                  Annuler
                </Button>
                <Button 
                  variant="gold" 
                  onClick={handleSaveConcept}
                  disabled={!newConcept.name || (!newConcept.who && !newConcept.what && !newConcept.why && !newConcept.how && !newConcept.when && !newConcept.where && !newConcept.essentials && newConcept.customFields.length === 0)}
                >
                  {currentConcept ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Message d'erreur si pas de PDF */}
      {!activity.chapterPdfUrl && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2 mb-6">
          <AlertCircle size={18} />
          <p>Le PDF de ce chapitre n'est pas disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
};

export default ConceptsStep;