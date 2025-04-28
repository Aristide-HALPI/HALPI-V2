import React, { useState } from 'react';
import InteractiveImage, { Hotspot, ExerciseMode, DisplayOptions } from './InteractiveImage';

interface HotspotEditorProps {
  imageUrl: string;
  initialHotspots?: Hotspot[];
  onSave?: (hotspots: Hotspot[], mode: ExerciseMode, displayOptions: DisplayOptions) => void;
  onCancel?: () => void;
}

const HotspotEditor: React.FC<HotspotEditorProps> = ({
  imageUrl,
  initialHotspots = [],
  onSave,
  onCancel
}) => {
  const [hotspots, setHotspots] = useState<Hotspot[]>(initialHotspots);
  // Mode est géré en interne via showPreview et exerciseType
  const [displayOptions] = useState<DisplayOptions>({
    zoneDisplay: 'normal'
  });
  // L'exercice sera toujours "Légender une image", mais la prévisualisation utilise le mode 'preview'
  const exerciseType = 'legend';
  const previewMode = 'preview';
  const [showPreview, setShowPreview] = useState(false);

  // Gérer l'ajout d'un nouveau hotspot
  const handleHotspotCreate = (hotspot: Hotspot) => {
    setHotspots([...hotspots, hotspot]);
  };

  // Gérer la mise à jour d'un hotspot
  const handleHotspotUpdate = (updatedHotspot: Hotspot) => {
    setHotspots(hotspots.map(h => h.id === updatedHotspot.id ? updatedHotspot : h));
  };

  // Gérer la suppression d'un hotspot
  const handleHotspotDelete = (hotspotId: string) => {
    setHotspots(hotspots.filter(h => h.id !== hotspotId));
  };

  // Gérer la fin d'un exercice
  const handleExerciseComplete = (score: number, total: number) => {
    alert(`Exercice terminé ! Score : ${score}/${total}`);
    setShowPreview(false);
  };

  // Sauvegarder les modifications
  const handleSave = () => {
    if (onSave) {
      onSave(hotspots, 'legend', displayOptions);
    }
  };

  return (
    <div className="hotspot-editor">
      <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Légender une image</h3>
        <p className="text-gray-600 mb-4">
          Créez des zones interactives sur l'image pour vos exercices pédagogiques.
        </p>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <h4 className="font-medium text-gray-800 mb-2">Comment utiliser cet outil :</h4>
          <ul className="list-disc pl-5 text-gray-600 space-y-1">
            <li><strong>Zones numérotées</strong> : Créez des zones que l'apprenant devra identifier et légender</li>
            <li><strong>Zones masquées</strong> : Utilisez-les pour cacher des réponses ou étiquettes déjà présentes sur l'image d'origine</li>
            <li><strong>Déplacer</strong> : Cliquez sur une zone et faites-la glisser pour la repositionner</li>
            <li><strong>Redimensionner</strong> : Utilisez les poignées aux coins des rectangles pour les redimensionner</li>
            <li><strong>Modifier</strong> : Cliquez sur une zone pour la sélectionner et modifier ses propriétés ci-dessous</li>
          </ul>
        </div>

        {/* Boutons */}
        <div className="mb-4 space-y-3">
          <div className="bg-white p-3 rounded-lg border border-amber-100">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 bg-[#bd8c0f] text-white rounded-full text-xs font-bold">1</span>
              Zones à légender
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  // Créer un rectangle plus petit au centre de l'image avec un numéro
                  const newHotspot: Hotspot = {
                    id: Date.now().toString(),
                    shape: 'rect',
                    coords: {
                      x: 0.4,
                      y: 0.4,
                      w: 0.2,
                      h: 0.2
                    },
                    title: `Élément ${hotspots.filter(h => h.number !== undefined && h.number !== null).length + 1}`,
                    number: hotspots.filter(h => h.number !== undefined && h.number !== null).length + 1
                  };
                  handleHotspotCreate(newHotspot);
                }}
                className="px-3 py-2 bg-[#bd8c0f] text-white rounded-md hover:bg-amber-600 transition-colors text-sm flex-1"
              >
                + Rectangle numéroté
              </button>
              <button
                type="button"
                onClick={() => {
                  // Créer un cercle plus petit au centre de l'image avec un numéro
                  const newHotspot: Hotspot = {
                    id: Date.now().toString(),
                    shape: 'circle',
                    coords: {
                      x: 0.5,
                      y: 0.5,
                      r: 0.1
                    },
                    title: `Élément ${hotspots.filter(h => h.number !== undefined && h.number !== null).length + 1}`,
                    number: hotspots.filter(h => h.number !== undefined && h.number !== null).length + 1
                  };
                  handleHotspotCreate(newHotspot);
                }}
                className="px-3 py-2 bg-[#bd8c0f] text-white rounded-md hover:bg-amber-600 transition-colors text-sm flex-1"
              >
                + Cercle numéroté
              </button>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-amber-100">
            <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 bg-gray-700 text-white rounded-full text-xs font-bold">2</span>
              Masquer des éléments
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  // Créer un rectangle masqué sans numéro
                  const newHotspot: Hotspot = {
                    id: Date.now().toString(),
                    shape: 'rect',
                    coords: {
                      x: 0.4,
                      y: 0.4,
                      w: 0.2,
                      h: 0.2
                    },
                    title: "Zone masquée",
                    display: 'masked'
                  };
                  handleHotspotCreate(newHotspot);
                }}
                className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-sm flex-1"
              >
                + Rectangle masqué
              </button>
              <button
                type="button"
                onClick={() => {
                  // Créer un cercle flouté sans numéro
                  const newHotspot: Hotspot = {
                    id: Date.now().toString(),
                    shape: 'circle',
                    coords: {
                      x: 0.5,
                      y: 0.5,
                      r: 0.1
                    },
                    title: "Zone floutée",
                    display: 'blurred'
                  };
                  handleHotspotCreate(newHotspot);
                }}
                className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-sm flex-1"
              >
                + Cercle flouté
              </button>
            </div>
          </div>
        </div>

        {/* Composant d'image interactive */}
        <InteractiveImage
          imageUrl={imageUrl}
          hotspots={hotspots}
          mode={showPreview ? previewMode : 'edit'}
          displayOptions={displayOptions}
          onHotspotCreate={handleHotspotCreate}
          onHotspotUpdate={handleHotspotUpdate}
          onHotspotDelete={handleHotspotDelete}
          onExerciseComplete={handleExerciseComplete}
        />

        {/* Statistiques */}
        <div className="mt-4 mb-4 flex items-center gap-4">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md">
            {hotspots.length} zone{hotspots.length !== 1 ? 's' : ''} créée{hotspots.length !== 1 ? 's' : ''}
          </div>
          {hotspots.some(h => h.number !== undefined && h.number !== null) && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md">
              Numérotation active
            </div>
          )}
        </div>
        
        {/* Boutons de prévisualisation et d'enregistrement */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!showPreview ? (
            <>
              <button
                className="px-4 py-2 bg-[#bd8c0f] text-white rounded-md hover:bg-amber-600"
                onClick={() => setShowPreview(true)}
                disabled={hotspots.length === 0}
              >
                Prévisualiser l'exercice
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={handleSave}
              >
                Enregistrer
              </button>
              {onCancel && (
                <button
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={onCancel}
                >
                  Annuler
                </button>
              )}
            </>
          ) : (
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setShowPreview(false)}
            >
              Retour à l'édition
            </button>
          )}
        </div>
      </div>


    </div>
  );
};

export default HotspotEditor;
