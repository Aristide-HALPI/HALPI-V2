export interface Concept {
  id?: string;
  concept: string;
  vulgarisation: string;
}

export interface KeyConceptsActivityProps {
  data: {
    step: {
      id: string;
      title: string;
      completed: boolean;
      chapterId?: string;
    };
    phase: any;
    pathId: string;
    pathData: any;
  };
}

export interface ConceptListProps {
  concepts: Concept[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export interface ConceptFormProps {
  concept: Concept;
  index: number;
  onSave: (concept: Concept, index: number) => void;
  onCancel: () => void;
}

export interface FileUploadProps {
  onUpload: (concepts: Concept[]) => void;
  isUploading: boolean;
  error: string | null;
}