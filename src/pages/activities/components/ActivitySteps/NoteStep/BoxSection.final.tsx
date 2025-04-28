import React from 'react';

interface BoxSectionProps {
  showExample: boolean;
  setShowExample: React.Dispatch<React.SetStateAction<boolean>>;
  boxes: Box[];
  setBoxes: React.Dispatch<React.SetStateAction<Box[]>>;
}

interface Box {
  title: string;
  content: string;
  colorIdx: number;
  editing?: boolean;
}

// Couleurs distinctes pour s'assurer qu'elles ne se répètent pas
const COLORS = ["bg-amber-50", "bg-blue-50", "bg-green-50", "bg-rose-50", "bg-purple-50", "bg-orange-50"];
const TITLE_COLORS = ["bg-amber-100", "bg-blue-100", "bg-green-100", "bg-rose-100", "bg-purple-100", "bg-orange-100"];
const BORDER_COLORS = ["border-[#bd8c0f]", "border-blue-300", "border-green-300", "border-rose-300", "border-purple-300", "border-orange-300"];

const BoxSection: React.FC<BoxSectionProps> = ({ showExample, setShowExample, boxes, setBoxes }) => {
  const exampleBoxes: Box[] = [
    {
      title: 'Introduction à la photosynthèse',
      content: `1. Définition\n  • Processus biochimique permettant aux plantes de produire de la matière organique à partir de CO₂ et d'eau\n  • Utilise l'énergie lumineuse captée par la chlorophylle\n\n2. Importance pour les êtres vivants\n  • Base de la chaîne alimentaire\n  • Production d'oxygène atmosphérique`,
      colorIdx: 0,
      editing: false,
    },
    {
      title: 'Les étapes de la photosynthèse',
      content: `A. Phase lumineuse\n  • Capture de la lumière par les photosystèmes\n  • Production d'ATP et de NADPH\n  • Libération d'oxygène\n\nB. Phase sombre (cycle de Calvin)\n  • Fixation du CO₂\n  • Synthèse du glucose\n  • Utilisation de l'ATP et du NADPH`,
      colorIdx: 1,
      editing: false,
    },
    {
      title: 'Facteurs influençant la photosynthèse',
      content: `• Lumière (intensité et qualité)\n• Température (optimum entre 25-30°C)\n• Concentration de CO₂\n• Disponibilité en eau\n• Nutriments minéraux`,
      colorIdx: 2,
      editing: false,
    },
    {
      title: 'Bilan et importance écologique',
      content: `• Production de matière organique (6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂)\n• Libération d'oxygène\n• Régulation du CO₂ atmosphérique\n• Impact sur les écosystèmes et la biodiversité`,
      colorIdx: 3,
      editing: false,
    },
  ];

  // Utiliser les props boxes et setBoxes au lieu d'un état local
  // Si boxes est vide, initialiser avec des valeurs par défaut
  React.useEffect(() => {
    if (boxes.length === 0) {
      const initialUserBoxes: Box[] = [
        {
          title: '',
          content: '',
          colorIdx: 0,
          editing: true,
        },
        {
          title: '',
          content: '',
          colorIdx: 1,
          editing: true,
        },
      ];
      setBoxes(initialUserBoxes);
    }
  }, [boxes.length, setBoxes]);

  // Helpers for prefix insertion
  const numbers = Array.from({length: 99}, (_, i) => (i + 1) + ".");
  const letters = Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i) + ".");
  const romanLower = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x."];

  function getNextPrefix(type: 'N' | 'A' | 'ROMAN', content: string): string {
    const lines = content.split("\n");
    if (type === 'N') {
      let lastNum = 0;
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].trim().match(/^(\d+)\./);
        if (m) { lastNum = parseInt(m[1], 10); break; }
      }
      return numbers[lastNum] || numbers[0];
    }
    if (type === 'A') {
      let lastIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].trim().match(/^([A-Z]\.)/);
        if (m) { lastIdx = letters.findIndex(l => l === m[1]); break; }
      }
      return letters[(lastIdx + 1) % letters.length] || letters[0];
    }
    if (type === 'ROMAN') {
      let lastIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].trim().match(/^([ivx]+\.)/);
        if (m) { lastIdx = romanLower.findIndex(l => l === m[1]); break; }
      }
      return romanLower[(lastIdx + 1) % romanLower.length] || romanLower[0];
    }
    return '';
  }

  function insertPrefix(type: 'N' | 'A' | 'ROMAN' | 'BULLET', idx: number): void {
    setBoxes(prev => prev.map((box, i) => {
      if (i !== idx) return box;
      const textarea = document.getElementById(`box-content-${i}`) as HTMLTextAreaElement | null;
      if (!textarea) return box;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = box.content.slice(0, start);
      const lineStart = before.lastIndexOf("\n") + 1;
      let prefix = '';
      if (type === 'N') prefix = getNextPrefix('N', box.content) + ' ';
      else if (type === 'A') prefix = getNextPrefix('A', box.content) + ' ';
      else if (type === 'ROMAN') prefix = getNextPrefix('ROMAN', box.content) + ' ';
      else if (type === 'BULLET') prefix = '• ';
      const line = box.content.slice(lineStart, start);
      let newLine = line;
      if (!line.startsWith(prefix)) {
        newLine = prefix + line;
      }
      const newValue = box.content.slice(0, lineStart) + newLine + box.content.slice(start);
      setTimeout(() => textarea.setSelectionRange(start + prefix.length, end + prefix.length), 0);
      return { ...box, content: newValue };
    }));
  }

  function handleAddBox(): void {
    // Trouver un index de couleur qui n'est pas déjà utilisé
    const usedColorIndices = boxes.map(box => box.colorIdx);
    let newColorIdx = 0;
    
    // Chercher la première couleur disponible
    while (usedColorIndices.includes(newColorIdx % COLORS.length)) {
      newColorIdx++;
    }
    
    const newBox: Box = {
      title: '',
      content: '',
      colorIdx: newColorIdx % COLORS.length,
      editing: true,
    };
    setBoxes(prev => [...prev, newBox]);
  }

  function handleTitleChange(idx: number, val: string): void {
    setBoxes(prev => prev.map((box, i) => i === idx ? { ...box, title: val } : box));
  }

  function handleDeleteBox(idx: number): void {
    setBoxes(prev => prev.filter((_, i) => i !== idx));
  }

  function handleBlurBox(idx: number): void {
    setBoxes(prev => prev.map((box, i) => i === idx ? { ...box, editing: false } : box));
  }

  function handleEditBox(idx: number): void {
    setBoxes(prev => prev.map((box, i) => i === idx ? { ...box, editing: true } : box));
  }

  function handleContentChange(idx: number, val: string): void {
    setBoxes(prev => prev.map((box, i) => i === idx ? { ...box, content: val } : box));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-l-4 border-[#bd8c0f] px-6 py-5 bg-amber-50">
        <h3 className="text-xl font-semibold text-gray-800 mb-1 flex items-center">
          <span className="bg-[#bd8c0f] text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">2</span>
          Notes principales en Boxes
        </h3>
        <p className="text-gray-600">Crée des boîtes thématiques pour les concepts importants</p>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <button
            className="px-4 py-2 border border-[#bd8c0f] rounded-lg hover:bg-amber-50 font-medium text-[#bd8c0f] transition-colors flex items-center shadow-sm"
            title="Ajouter une box"
            onClick={handleAddBox}
          >
            <span className="mr-2">+</span> Ajouter une box
          </button>
          
          <button 
            onClick={() => setShowExample(!showExample)}
            className="flex items-center text-[#bd8c0f] hover:text-[#a37a0e] transition-colors"
          >
            <span className="mr-2">{showExample ? '▼' : '▶'}</span>
            <span className="font-medium">Voir un exemple</span>
          </button>
        </div>
        
        {showExample ? (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6">
            <p className="font-medium text-gray-800 mb-3 flex items-center">
              <span className="text-[#bd8c0f] mr-2">💡</span>
              Exemple de Boxes (Chapitre sur la photosynthèse)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {exampleBoxes.map((box, idx) => (
                <div key={idx} className={`border ${BORDER_COLORS[box.colorIdx]} rounded-lg p-4 bg-white shadow-sm w-full`}>
                  <h5 className={`font-medium ${TITLE_COLORS[box.colorIdx]} px-3 py-2 rounded-lg mb-3 text-center text-gray-800`}>
                    {box.title}
                  </h5>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {box.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {boxes.map((box, idx) => (
              <div 
                key={idx} 
                className={`border ${BORDER_COLORS[box.colorIdx % BORDER_COLORS.length]} rounded-lg p-4 ${COLORS[box.colorIdx % COLORS.length]} shadow-sm w-full`}
              >
                {/* Barre titre + actions */}
                <div className="flex items-center mb-3 relative">
                  <input
                    className={`w-full font-medium px-3 py-2 rounded-lg text-center ${TITLE_COLORS[box.colorIdx % TITLE_COLORS.length]}`}
                    value={box.title}
                    onChange={e => handleTitleChange(idx, e.target.value)}
                    placeholder="Titre de la box (obligatoire)"
                    required
                    maxLength={60}
                    style={{ paddingRight: 90 }} // espace réservé à droite pour les boutons
                  />
                  <div className="absolute right-2 top-1 flex gap-2 z-10">
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-600 focus:outline-none p-1"
                      title="Supprimer la box"
                      onClick={() => handleDeleteBox(idx)}
                      tabIndex={-1}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button 
                    type="button" 
                    className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 font-medium text-[#bd8c0f] shadow-sm transition-colors" 
                    title="Numérotation (1.)" 
                    onClick={() => insertPrefix('N', idx)}
                  >
                    1.
                  </button>
                  <button 
                    type="button" 
                    className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 font-medium text-[#bd8c0f] shadow-sm transition-colors" 
                    title="Lettre (A.)" 
                    onClick={() => insertPrefix('A', idx)}
                  >
                    A.
                  </button>
                  <button 
                    type="button" 
                    className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 font-medium text-[#bd8c0f] shadow-sm transition-colors" 
                    title="Chiffres romains (i.)" 
                    onClick={() => insertPrefix('ROMAN', idx)}
                  >
                    i.
                  </button>
                  <button 
                    type="button" 
                    className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 text-[#bd8c0f] shadow-sm transition-colors" 
                    title="Bullet point (•)" 
                    onClick={() => insertPrefix('BULLET', idx)}
                  >
                    •
                  </button>
                </div>
                {box.editing ? (
                  <textarea
                    id={`box-content-${idx}`}
                    className="w-full p-4 border border-gray-200 rounded-xl min-h-[200px] text-[1rem] font-normal focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f] bg-white shadow-sm transition-all resize-none"
                    value={box.content}
                    onChange={e => handleContentChange(idx, e.target.value)}
                    placeholder="Développe ici le contenu de la box..."
                    required
                    onBlur={() => handleBlurBox(idx)}
                    autoFocus
                  />
                ) : (
                  <div
                    className={`min-h-[200px] p-3 rounded-lg text-gray-700 ${COLORS[box.colorIdx % COLORS.length]} cursor-pointer`}
                    onDoubleClick={() => handleEditBox(idx)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleEditBox(idx); }}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {box.content || <span className="text-gray-400 italic">Double-cliquez pour éditer...</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoxSection;
