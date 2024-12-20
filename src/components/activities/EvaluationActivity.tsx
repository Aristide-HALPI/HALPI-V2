import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Introduction } from './evaluation/Introduction';
import { ConceptList } from './evaluation/ConceptList';
import { Concept } from '../../types/concepts';

interface EvaluationActivityProps {
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

export default function EvaluationActivity({ data }: EvaluationActivityProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadConcepts();
  }, [user, data.step.chapterId]);

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
      setError('Une erreur est survenue lors du chargement des concepts');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return;
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
      setError('Une erreur est survenue lors de la finalisation de l\'activité');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement des concepts...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Évaluer pour apprendre</h1>
          </div>
          <button
            onClick={handleComplete}
            disabled={isCompleting || concepts.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isCompleting ? 'Finalisation...' : 'Terminer l\'exercice'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <Introduction />
          <ConceptList concepts={concepts} />
        </div>
      </div>
    </div>
  );
}