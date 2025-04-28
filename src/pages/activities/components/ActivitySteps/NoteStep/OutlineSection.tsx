import React from 'react';

interface OutlineSectionProps {
  showExample: boolean;
  setShowExample: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
}

const OutlineSection: React.FC<OutlineSectionProps> = ({ showExample, setShowExample, value, onChange }) => {
  // Utiliser les props value et onChange au lieu d'un état local
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Helpers pour séquences
  // Génère jusqu'à 99 pour chaque type
  const numbers = Array.from({length: 99}, (_, i) => (i + 1) + ".");
  const letters = Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i) + ".");
  const romanLower = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x."];

  // Trouve le prochain préfixe de la séquence selon le type, en scannant le dernier utilisé
  function getNextPrefix(type: 'N' | 'A' | 'ROMAN', textareaValue: string): string {
    const lines = textareaValue.split("\n");
    
    // Trouver la ligne courante et son indentation
    let currentLineIndex = -1;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const before = textareaValue.slice(0, start);
      const lineStart = before.lastIndexOf('\n') + 1;
      
      // Trouver l'index de la ligne courante
      let position = 0;
      for (let i = 0; i < lines.length; i++) {
        if (position + lines[i].length >= lineStart) {
          currentLineIndex = i;
          break;
        }
        // +1 pour le caractère de nouvelle ligne
        position += lines[i].length + 1;
      }
    }
    
    if (currentLineIndex === -1) {
      // Fallback si on ne peut pas déterminer la ligne courante
      if (type === 'N') return numbers[0];
      if (type === 'A') return letters[0];
      if (type === 'ROMAN') return romanLower[0];
      return '';
    }
    
    // Déterminer l'indentation de la ligne courante
    const currentLine = lines[currentLineIndex];
    const currentIndentMatch = currentLine.match(/^(\s*)/);
    const currentIndent = currentIndentMatch ? currentIndentMatch[1] : '';
    
    if (type === 'N') {
      // Pour les numéros, chercher le dernier numéro avec la même indentation
      let lastNum = 0;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (i === currentLineIndex) continue; // Ignorer la ligne courante
        
        const line = lines[i];
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        // Si c'est une ligne avec la même indentation
        if (indent === currentIndent) {
          const m = line.substring(indent.length).match(/^(\d+)\./);
          if (m) {
            lastNum = parseInt(m[1], 10);
            break;
          }
        }
      }
      return numbers[lastNum] || numbers[0];
    }
    
    if (type === 'A') {
      // Pour les lettres, chercher la dernière lettre avec la même indentation
      // ET dans le même contexte (même point principal)
      let lastIdx = -1;
      let contextFound = false;
      
      // Déterminer le contexte (point principal parent)
      let parentContext = null;
      if (currentIndent.length > 0) {
        // Chercher le point principal parent (avec une indentation moindre)
        const parentIndent = currentIndent.substring(0, Math.max(0, currentIndent.length - 2));
        
        for (let i = currentLineIndex; i >= 0; i--) {
          const line = lines[i];
          const indentMatch = line.match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[1] : '';
          
          if (indent === parentIndent) {
            // Trouvé le parent, enregistrer son numéro comme contexte
            const numMatch = line.substring(indent.length).match(/^(\d+)\./);
            if (numMatch) {
              parentContext = parseInt(numMatch[1], 10);
              break;
            }
          }
        }
      }
      
      // Chercher la dernière lettre dans le même contexte
      for (let i = lines.length - 1; i >= 0; i--) {
        if (i === currentLineIndex) continue; // Ignorer la ligne courante
        
        const line = lines[i];
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        // Si c'est une ligne avec la même indentation
        if (indent === currentIndent) {
          // Vérifier si c'est dans le même contexte (même parent)
          let lineParentContext = null;
          if (parentContext !== null) {
            // Chercher le parent de cette ligne
            const lineParentIndent = indent.substring(0, Math.max(0, indent.length - 2));
            
            for (let j = i; j >= 0; j--) {
              const parentLine = lines[j];
              const parentIndentMatch = parentLine.match(/^(\s*)/);
              const parentIndent = parentIndentMatch ? parentIndentMatch[1] : '';
              
              if (parentIndent === lineParentIndent) {
                // Trouvé le parent, vérifier si c'est le même contexte
                const numMatch = parentLine.substring(parentIndent.length).match(/^(\d+)\./);
                if (numMatch) {
                  lineParentContext = parseInt(numMatch[1], 10);
                  break;
                }
              }
            }
          }
          
          // Si on a trouvé un contexte parent et qu'il correspond
          if (parentContext === null || lineParentContext === null || parentContext === lineParentContext) {
            const m = line.substring(indent.length).match(/^([A-Z])\./);
            if (m) {
              lastIdx = letters.findIndex(l => l === m[1] + ".");
              contextFound = true;
              break;
            }
          }
        }
      }
      
      if (contextFound && lastIdx !== -1) {
        return letters[(lastIdx + 1) % letters.length] || letters[0];
      } else {
        return letters[0];
      }
    }
    
    if (type === 'ROMAN') {
      // Pour les chiffres romains, chercher le dernier avec la même indentation
      let lastIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (i === currentLineIndex) continue; // Ignorer la ligne courante
        
        const line = lines[i];
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        // Si c'est une ligne avec la même indentation
        if (indent === currentIndent) {
          const m = line.substring(indent.length).match(/^([ivx]+)\./);
          if (m) {
            lastIdx = romanLower.findIndex(r => r === m[1] + ".");
            break;
          }
        }
      }
      return romanLower[(lastIdx + 1) % romanLower.length] || romanLower[0];
    }
    
    return '';
  }

  // Insère ou remplace un préfixe intelligent (utilise la valeur réelle du textarea pour éviter les bugs de double clic)
  function insertPrefix(type: 'N' | 'A' | 'ROMAN' | 'BULLET') {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    
    // Trouver le début de la ligne courante
    const lineStart = before.lastIndexOf("\n") + 1;
    const line = before.slice(lineStart);
    
    // Déterminer l'indentation actuelle
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    
    // Supprimer tout préfixe existant (numéro, lettre, puce)
    const contentMatch = line.match(/^(\s*)(?:[0-9]+\.|[A-Z]\.|[ivx]+\.|\u2022)?\s*(.*)/);
    const content = contentMatch ? contentMatch[2] : line.substring(indent.length);
    
    // Déterminer le nouveau préfixe selon le type
    let prefix = '';
    if (type === 'N') prefix = getNextPrefix('N', value) + ' ';
    else if (type === 'A') prefix = getNextPrefix('A', value) + ' ';
    else if (type === 'ROMAN') prefix = getNextPrefix('ROMAN', value) + ' ';
    else if (type === 'BULLET') prefix = '• ';
    
    // Construire la nouvelle ligne avec le préfixe
    const newLine = indent + prefix + content;
    const newValue = value.slice(0, lineStart) + newLine + after;
    
    // Mettre à jour la valeur et positionner le curseur après le préfixe
    onChange(newValue);
    
    // Positionner le curseur après le préfixe
    const newPos = lineStart + indent.length + prefix.length;
    setTimeout(() => {
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  }

  // Indente la ligne courante
  function indentLine() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    
    // Trouver le début de la ligne courante
    const lineStart = before.lastIndexOf("\n") + 1;
    const line = before.slice(lineStart);
    
    // Ajouter deux espaces au début de la ligne
    const newLine = "  " + line;
    const newValue = value.slice(0, lineStart) + newLine + after;
    
    // Mettre à jour la valeur et positionner le curseur
    onChange(newValue);
    
    // Ajuster la position du curseur
    const newPos = start + 2;
    setTimeout(() => {
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  }

  // Désindente la ligne courante avec une approche simple et robuste
  function unindentLine() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    
    // Trouver le début de la ligne courante
    const lineStart = before.lastIndexOf("\n") + 1;
    const line = before.slice(lineStart);
    
    // Vérifier s'il y a au moins 2 espaces au début
    const indentMatch = line.match(/^(\s*)/);
    const currentIndent = indentMatch ? indentMatch[1] : '';
    
    if (currentIndent.length < 2) {
      // Pas assez d'indentation pour désindenter
      return;
    }
    
    // Supprimer 2 espaces au début
    const newIndent = currentIndent.substring(0, currentIndent.length - 2);
    const content = line.substring(currentIndent.length);
    
    // Analyser le contenu pour déterminer le type de liste
    const prefixMatch = content.match(/^([0-9]+\.|[A-Z]\.|[ivx]+\.|\u2022)?\s*(.*)/);
    const prefix = prefixMatch && prefixMatch[1] ? prefixMatch[1] + ' ' : '';
    const textContent = prefixMatch ? prefixMatch[2] : content;
    
    // Déterminer le nouveau préfixe selon le niveau d'indentation
    let newPrefix = prefix;
    
    // Si on a un préfixe, il faut peut-être le changer selon le nouveau niveau
    if (prefix) {
      const isNumber = prefix.match(/^[0-9]+\./);
      const isLetter = prefix.match(/^[A-Z]\./);
      const isRoman = prefix.match(/^[ivx]+\./);
      // Pas besoin de vérifier les puces car elles sont traitées différemment
      
      // Trouver toutes les lignes du document
      const lines = value.split("\n");
      
      // Trouver l'index de la ligne courante
      let currentLineIndex = -1;
      let position = 0;
      for (let i = 0; i < lines.length; i++) {
        if (position + lines[i].length >= lineStart) {
          currentLineIndex = i;
          break;
        }
        position += lines[i].length + 1; // +1 pour le caractère de nouvelle ligne
      }
      
      if (isLetter) {
        // LETTRES -> CHIFFRES
        // 1. Déterminer la nouvelle indentation (un niveau au-dessus)
        // 2. Trouver le parent direct (ligne avec la même indentation que newIndent)
        let parentIndex = -1;
        for (let i = currentLineIndex - 1; i >= 0; i--) {
          const line = lines[i];
          const lineIndentMatch = line.match(/^(\s*)/);
          const lineIndent = lineIndentMatch ? lineIndentMatch[1] : '';
          if (lineIndent.length === newIndent.length) {
            parentIndex = i;
            break;
          }
        }
        
        // 3. Trouver tous les numéros existants au même niveau que le parent
        let existingNumbers = [];
        if (parentIndex !== -1) {
          for (let i = 0; i < lines.length; i++) {
            if (i === currentLineIndex) continue;
            const line = lines[i];
            const lineIndentMatch = line.match(/^(\s*)/);
            const lineIndent = lineIndentMatch ? lineIndentMatch[1] : '';
            if (lineIndent.length === newIndent.length) {
              const numMatch = line.substring(lineIndent.length).match(/^([0-9]+)\./);
              if (numMatch) {
                existingNumbers.push(parseInt(numMatch[1], 10));
              }
            }
          }
        }
        
        // 4. Déterminer le prochain numéro
        if (existingNumbers.length === 0) {
          newPrefix = '1. ';
        } else {
          const lastNum = Math.max(...existingNumbers);
          newPrefix = (lastNum + 1) + '. ';
        }
      } else if (isRoman) {
        // CHIFFRES ROMAINS -> LETTRES
        // 1. Déterminer la nouvelle indentation (un niveau au-dessus)
        // 2. Trouver le parent direct (ligne avec la même indentation que newIndent)
        let parentIndex = -1;
        for (let i = currentLineIndex - 1; i >= 0; i--) {
          const line = lines[i];
          const lineIndentMatch = line.match(/^(\s*)/);
          const lineIndent = lineIndentMatch ? lineIndentMatch[1] : '';
          if (lineIndent.length === newIndent.length) {
            parentIndex = i;
            break;
          }
        }
        
        // 3. Trouver toutes les lettres existantes au même niveau que le parent
        let existingLetters = [];
        if (parentIndex !== -1) {
          for (let i = 0; i < lines.length; i++) {
            if (i === currentLineIndex) continue;
            const line = lines[i];
            const lineIndentMatch = line.match(/^(\s*)/);
            const lineIndent = lineIndentMatch ? lineIndentMatch[1] : '';
            if (lineIndent.length === newIndent.length) {
              const letterMatch = line.substring(lineIndent.length).match(/^([A-Z])\./);
              if (letterMatch) {
                existingLetters.push(letterMatch[1] + '.');
              }
            }
          }
        }
        
        // 4. Déterminer la prochaine lettre
        if (existingLetters.length === 0) {
          newPrefix = 'A. ';
        } else {
          const lastLetter = existingLetters.sort().pop();
          if (lastLetter) {
            const lastLetterIndex = letters.indexOf(lastLetter);
            if (lastLetterIndex !== -1) {
              newPrefix = letters[(lastLetterIndex + 1) % letters.length] + ' ';
            } else {
              newPrefix = 'A. ';
            }
          } else {
            newPrefix = 'A. ';
          }
        }
      } else if (isNumber) {
        // CHIFFRES -> RIEN (ou conserver si c'est le niveau 0)
        if (newIndent.length === 0) {
          // Conserver le numéro au niveau 0
          newPrefix = prefix;
        } else {
          // Sinon, chercher le bon préfixe selon le contexte
          // Trouver le parent direct
          let parentIndex = -1;
          for (let i = currentLineIndex - 1; i >= 0; i--) {
            const line = lines[i];
            const lineIndentMatch = line.match(/^(\s*)/);
            const lineIndent = lineIndentMatch ? lineIndentMatch[1] : '';
            if (lineIndent.length === newIndent.length) {
              parentIndex = i;
              break;
            }
          }
          
          // Analyser le préfixe du parent
          if (parentIndex !== -1) {
            const parentLine = lines[parentIndex];
            const parentIndentMatch = parentLine.match(/^(\s*)/);
            const parentIndent = parentIndentMatch ? parentIndentMatch[1] : '';
            const parentContent = parentLine.substring(parentIndent.length);
            const parentPrefixMatch = parentContent.match(/^([0-9]+\.|[A-Z]\.|[ivx]+\.|\u2022)?\s*(.*)/);
            const parentPrefix = parentPrefixMatch && parentPrefixMatch[1] ? parentPrefixMatch[1] : '';
            
            if (parentPrefix.match(/^[0-9]+\./)) {
              // Si le parent est un numéro, utiliser une lettre
              newPrefix = 'A. ';
            } else if (parentPrefix.match(/^[A-Z]\./)) {
              // Si le parent est une lettre, utiliser un chiffre romain
              newPrefix = 'i. ';
            } else {
              // Sinon, utiliser un numéro par défaut
              newPrefix = '1. ';
            }
          } else {
            // Pas de parent trouvé, utiliser un numéro par défaut
            newPrefix = '1. ';
          }
        }
      }
    }
    
    // Construire la nouvelle ligne
    const newLine = newIndent + newPrefix + textContent;
    const newValue = value.slice(0, lineStart) + newLine + after;
    
    // Mettre à jour la valeur et positionner le curseur
    onChange(newValue);
    
    // Ajuster la position du curseur
    const newPos = lineStart + newIndent.length + newPrefix.length;
    setTimeout(() => {
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-l-4 border-[#bd8c0f] px-6 py-5 bg-amber-50">
        <h3 className="text-xl font-semibold text-gray-800 mb-1 flex items-center">
          <span className="bg-[#bd8c0f] text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">1</span>
          Résumé en Outlines
        </h3>
        <p className="text-gray-600">Structure hiérarchique des points importants du chapitre</p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button 
            type="button" 
            className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 font-medium text-[#bd8c0f] shadow-sm transition-colors" 
            title="Numérotation (1.)" 
            onClick={() => insertPrefix('N')}
          >
            1.
          </button>
          <button 
            type="button" 
            className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 font-medium text-[#bd8c0f] shadow-sm transition-colors" 
            title="Lettre (A.)" 
            onClick={() => insertPrefix('A')}
          >
            A.
          </button>
          <button 
            type="button" 
            className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 font-medium text-[#bd8c0f] shadow-sm transition-colors" 
            title="Chiffres romains (i.)" 
            onClick={() => insertPrefix('ROMAN')}
          >
            i.
          </button>
          <button 
            type="button" 
            className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 text-[#bd8c0f] shadow-sm transition-colors" 
            title="Bullet point (•)" 
            onClick={() => insertPrefix('BULLET')}
          >
            •
          </button>
          <div className="h-5 border-r border-gray-200 mx-1"></div>
          <button 
            type="button" 
            className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 text-[#bd8c0f] shadow-sm transition-colors" 
            title="Indenter" 
            onClick={indentLine}
          >
            →
          </button>
          <button 
            type="button" 
            className="px-3 py-1 border border-gray-200 rounded-lg bg-white hover:bg-amber-50 text-[#bd8c0f] shadow-sm transition-colors" 
            title="Désindenter" 
            onClick={unindentLine}
          >
            ←
          </button>
          
          <div className="ml-auto">
            <button 
              onClick={() => setShowExample(!showExample)}
              className="flex items-center text-[#bd8c0f] hover:text-[#a37a0e] transition-colors"
            >
              <span className="mr-2">{showExample ? '▼' : '▶'}</span>
              <span className="font-medium">Voir un exemple</span>
            </button>
          </div>
        </div>
        
        {showExample && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6">
            <p className="font-medium text-gray-800 mb-3 flex items-center">
              <span className="text-[#bd8c0f] mr-2">💡</span>
              Exemple d'Outline (Chapitre sur la photosynthèse)
            </p>
            <div className="bg-white p-4 rounded-lg border border-amber-100 whitespace-pre-wrap text-gray-700">
              <p><strong>1. Introduction à la photosynthèse</strong></p>
              <p>  A. Définition et importance</p>
              <p>  B. Localisation dans la cellule</p>
              <p><strong>2. Phases de la photosynthèse</strong></p>
              <p>  A. Phase lumineuse</p>
              <p>    i. Photosystèmes</p>
              <p>    ii. Production d'ATP</p>
              <p>  B. Phase sombre (cycle de Calvin)</p>
              <p>    i. Fixation du CO₂</p>
              <p>    ii. Synthèse des glucides</p>
              <p><strong>3. Facteurs influençant la photosynthèse</strong></p>
              <p>  A. Lumière</p>
              <p>  B. Température</p>
              <p>  C. Concentration en CO₂</p>
            </div>
          </div>
        )}
        
        <textarea
          ref={textareaRef}
          className="w-full h-[300px] p-4 border border-gray-200 rounded-xl text-[1rem] font-normal focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-[#bd8c0f] bg-white shadow-sm transition-all"
          placeholder={"Construis ici ton plan du chapitre comme tu le ferais sur Word ou Google Docs.\nUtilise la mise en forme que tu veux grâce aux boutons ci-dessus (1. / A. / i. / •) et structure librement ton plan."}
          value={value}
          onChange={e => {
            console.log('OutlineSection: Textarea onChange', { oldValue: value, newValue: e.target.value });
            onChange(e.target.value);
          }}
          spellCheck={true}
          autoCorrect="on"
          autoCapitalize="sentences"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const textarea = textareaRef.current;
              if (!textarea) return;
              const start = textarea.selectionStart;
              const before = value.slice(0, start);
              const after = value.slice(start);
              const lineStart = before.lastIndexOf("\n") + 1;
              const currentLine = before.slice(lineStart);
              
              // Capturer l'indentation et le préfixe de liste
              // Recherche d'indentation (espaces) + préfixe de liste (1., A., i., •, etc.)
              const formatMatch = currentLine.match(/^(\s*)([0-9]+\.|[A-Z]\.|[ivx]+\.|\u2022)?\s*/);
              let prefix = '';
              
              if (formatMatch) {
                // Conserver l'indentation
                const indent = formatMatch[1] || '';
                
                // Déterminer le type de liste pour générer le prochain préfixe
                const listPrefix = formatMatch[2] || '';
                
                if (listPrefix) {
                  // Si la ligne actuelle est vide (juste un préfixe), ne pas ajouter de nouveau préfixe
                  const contentAfterPrefix = currentLine.substring(formatMatch[0].length).trim();
                  if (!contentAfterPrefix) {
                    // Ligne vide, juste conserver l'indentation sans préfixe
                    prefix = indent;
                  } else {
                    // Ligne avec contenu, générer le prochain préfixe du même type
                    if (listPrefix.match(/^[0-9]+\./)) {
                      // Liste numérique
                      const numMatch = listPrefix.match(/^([0-9]+)\./); 
                      const num = numMatch && numMatch[1] ? parseInt(numMatch[1], 10) : 1;
                      prefix = `${indent}${num + 1}. `;
                    } else if (listPrefix.match(/^[A-Z]\./)) {
                      // Liste alphabétique
                      const letter = listPrefix.charAt(0);
                      const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
                      prefix = `${indent}${nextLetter}. `;
                    } else if (listPrefix.match(/^[ivx]+\./)) {
                      // Liste romaine
                      const romanMatch = listPrefix.match(/^([ivx]+)\./); 
                      const roman = romanMatch && romanMatch[1] ? romanMatch[1] : 'i';
                      const romanIndex = romanLower.findIndex(r => r === `${roman}.`);
                      if (romanIndex !== -1 && romanIndex < romanLower.length - 1) {
                        prefix = `${indent}${romanLower[romanIndex + 1]} `;
                      } else {
                        prefix = `${indent}${listPrefix} `;
                      }
                    } else if (listPrefix === '•') {
                      // Liste à puces
                      prefix = `${indent}• `;
                    }
                  }
                } else {
                  // Pas de préfixe, juste conserver l'indentation
                  prefix = indent;
                }
              }
              
              e.preventDefault();
              const newValue = before + "\n" + prefix + after;
              console.log('OutlineSection: Enter key pressed', { currentLine, prefix, newValue });
              onChange(newValue);
              setTimeout(() => {
                const pos = start + 1 + prefix.length;
                textarea.setSelectionRange(pos, pos);
              }, 0);
            }
          }}
        />
      </div>
    </div>
  );
};

export default OutlineSection;
