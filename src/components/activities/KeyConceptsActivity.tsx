import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Introduction } from './KeyConcepts/Introduction';
import { ConceptForm } from './KeyConcepts/ConceptForm';
import { ConceptList } from './KeyConcepts/ConceptList';
import { Concept } from '../../types/concepts';
import { exportConceptsToCSV } from '../../utils/exportUtils';

interface KeyConceptsActivityProps {
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

export default function KeyConceptsActivity({ data }: KeyConceptsActivityProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [chapterUrl, setChapterUrl] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [isAddingConcept, setIsAddingConcept] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (data.step.chapterId) {
      loadChapterUrl();
      loadConcepts();
    }
  }, [data.step.chapterId, user]);

  const loadChapterUrl = async () => {
    if (!data.step.chapterId) return;

    try {
      const chapterDoc = await getDoc(doc(db, 'chapters', data.step.chapterId));
      if (chapterDoc.exists()) {
        setChapterUrl(chapterDoc.data().fileUrl);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
    }
  };

  const loadConcepts = async () => {
    if (!user || !data.step.chapterId) return;

    try {
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', user.uid),
        where('chapterId', '==', data.step.chapterId)
      );
      const querySnapshot = await getDocs(conceptsQuery);
      const conceptsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Concept[];
      setConcepts(conceptsData);
    } catch (error) {
      console.error('Error loading concepts:', error);
    }
  };

  const handleSubmitConcept = async (conceptData: Partial<Concept>) => {
    if (!user || !data.step.chapterId) return;

    try {
      if (editingConcept) {
        await updateDoc(doc(db, 'concepts', editingConcept.id), {
          ...conceptData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'concepts'), {
          ...conceptData,
          userId: user.uid,
          chapterId: data.step.chapterId,
          createdAt: new Date().toISOString()
        });
      }

      await loadConcepts();
      setIsAddingConcept(false);
      setEditingConcept(null);
    } catch (error) {
      console.error('Error saving concept:', error);
    }
  };

  const handleDeleteConcept = async (conceptId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'concepts', conceptId));
      await loadConcepts();
    } catch (error) {
      console.error('Error deleting concept:', error);
    }
  };

  const handleComplete = async () => {
    if (isCompleting || concepts.length === 0) return;
    setIsCompleting(true);

    try {
      const pathRef = doc(db, 'learningPaths', data.pathId);
      const pathDoc = await getDoc(pathRef);
      
      if (!pathDoc.exists()) {
        throw new Error('Path not found');
      }

      const pathData = pathDoc.data();
      const updatedPhases = pathData.phases.map((phase: any) => {
        if (phase.chapters) {
          return {
            ...phase,
            chapters: phase.chapters.map((chapter: any) => ({
              ...chapter,
              steps: chapter.steps.map((step: any) => 
                step.id === data.step.id ? { ...step, completed: true } : step
              )
            }))
          };
        }
        return phase;
      });

      await updateDoc(pathRef, { phases: updatedPhases });
      navigate(`/paths/${data.pathId}`);
    } catch (error) {
      console.error('Error completing activity:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/paths/${data.pathId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour au parcours
            </button>
            <h1 className="text-2xl font-bold">Concepts clés</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleComplete}
              disabled={isCompleting || concepts.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isCompleting ? 'Finalisation...' : 'Terminer l\'exercice'}
            </button>
            <button
              onClick={async () => {
                setIsExporting(true);
                try {
                  await exportConceptsToCSV(concepts);
                } catch (error) {
                  console.error('Error exporting concepts:', error);
                  // Vous pouvez ajouter ici une notification d'erreur si vous le souhaitez
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting || concepts.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {isExporting ? 'Export...' : 'Exporter en CSV'}
            </button>
          </div>
        </div>

        <Introduction 
          onAddConcept={() => setIsAddingConcept(true)}
          chapterUrl={chapterUrl}
        />

        {(isAddingConcept || editingConcept) && (
          <ConceptForm
            onSubmit={handleSubmitConcept}
            onCancel={() => {
              setIsAddingConcept(false);
              setEditingConcept(null);
            }}
            initialData={editingConcept || undefined}
          />
        )}

        {concepts.length > 0 && (
          <ConceptList
            concepts={concepts}
            onEdit={setEditingConcept}
            onDelete={handleDeleteConcept}
          />
        )}
      </div>
    </div>
  );
}