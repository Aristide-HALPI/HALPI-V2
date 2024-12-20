export interface GPTQuizPreparationProps {
  pathId: string;
}

export interface ConceptData {
  id: string;
  what: string;
  how: string;
  why: string;
  [key: string]: any; // Pour les champs personnalisés
}
