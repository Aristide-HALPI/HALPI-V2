/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * Plus le nombre est petit, plus les chaînes sont similaires
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  // Incrémente le long de la première colonne de chaque ligne
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Incrémente chaque colonne de la première ligne
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Remplit le reste de la matrice
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // suppression
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Normalise une chaîne de caractères pour la comparaison
 * - Convertit en minuscules
 * - Supprime les accents
 * - Supprime la ponctuation
 * - Supprime les espaces multiples
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Supprime la ponctuation
    .replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace
    .trim();
}

/**
 * Compare deux mots individuels et détermine leur similarité
 */
function compareWords(word1: string, word2: string): {
  similarity: number;
  hasTypo: boolean;
} {
  const distance = levenshteinDistance(word1, word2);
  const maxLength = Math.max(word1.length, word2.length);
  const similarity = 1 - (distance / maxLength);

  return {
    similarity,
    hasTypo: similarity >= 0.85 && similarity < 1
  };
}

/**
 * Compare deux ensembles de mots en tenant compte de l'ordre et des fautes de frappe
 */
function compareWordSets(words1: string[], words2: string[]): {
  similarity: number;
  hasTypo: boolean;
} {
  if (words1.length !== words2.length) {
    return { similarity: 0, hasTypo: false };
  }

  // Essaie d'abord dans l'ordre exact
  let exactOrderSimilarity = 0;
  let exactOrderTypos = 0;
  for (let i = 0; i < words1.length; i++) {
    const comparison = compareWords(words1[i], words2[i]);
    exactOrderSimilarity += comparison.similarity;
    if (comparison.hasTypo) exactOrderTypos++;
  }
  exactOrderSimilarity /= words1.length;

  // Si la similarité en ordre exact est très élevée, utilise ce résultat
  if (exactOrderSimilarity >= 0.9) {
    return {
      similarity: exactOrderSimilarity,
      hasTypo: exactOrderTypos > 0
    };
  }

  // Sinon, essaie toutes les combinaisons possibles
  let bestSimilarity = 0;
  let bestHasTypo = false;

  // Pour chaque mot dans words1, trouve le meilleur match dans words2
  const usedIndices = new Set<number>();
  for (const word1 of words1) {
    let bestWordSimilarity = 0;
    let wordHasTypo = false;

    for (let i = 0; i < words2.length; i++) {
      if (usedIndices.has(i)) continue;

      const comparison = compareWords(word1, words2[i]);
      if (comparison.similarity > bestWordSimilarity) {
        bestWordSimilarity = comparison.similarity;
        wordHasTypo = comparison.hasTypo;
      }
    }

    if (bestWordSimilarity > 0.85) {
      bestSimilarity += bestWordSimilarity;
      if (wordHasTypo) bestHasTypo = true;
      // Marque le meilleur match comme utilisé
      usedIndices.add(
        words2.findIndex((w, i) => 
          !usedIndices.has(i) && 
          compareWords(word1, w).similarity === bestWordSimilarity
        )
      );
    }
  }

  bestSimilarity /= words1.length;

  return {
    similarity: bestSimilarity,
    hasTypo: bestHasTypo
  };
}

/**
 * Compare deux chaînes de caractères et détermine si elles sont équivalentes
 * en tenant compte des fautes de frappe possibles et des mots multiples
 */
export function compareTexts(input: string, reference: string): {
  isCorrect: boolean;
  hasTypo: boolean;
  score: number;
} {
  // Normaliser les deux textes
  const normalizedInput = normalizeText(input);
  const normalizedReference = normalizeText(reference);

  console.log('Comparaison de textes :', {
    original: { input, reference },
    normalized: { input: normalizedInput, reference: normalizedReference }
  });

  // Si les textes normalisés sont identiques, c'est une correspondance parfaite
  if (normalizedInput === normalizedReference) {
    console.log('Correspondance parfaite !');
    return { isCorrect: true, hasTypo: false, score: 1 };
  }

  // Diviser les textes en mots
  const inputWords = normalizedInput.split(' ');
  const referenceWords = normalizedReference.split(' ');

  console.log('Mots à comparer :', {
    input: inputWords,
    reference: referenceWords
  });

  // Comparer les ensembles de mots
  const result = compareWordSets(inputWords, referenceWords);
  
  console.log('Résultat de la comparaison :', {
    similarity: result.similarity,
    hasTypo: result.hasTypo,
    isCorrect: result.similarity >= 0.9
  });

  return {
    isCorrect: result.similarity >= 0.9,
    hasTypo: result.hasTypo,
    score: result.similarity
  };
}
