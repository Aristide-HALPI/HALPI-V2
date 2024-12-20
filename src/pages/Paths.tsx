import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LearningPath, Phase } from '../types/learningPath';

interface PathWithCourse extends LearningPath {
  courseTitle: string;
}

export function Paths() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paths, setPaths] = useState<PathWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPaths() {
      if (!user) return;

      try {
        // 1. Récupérer tous les cours de l'utilisateur
        const coursesQuery = query(
          collection(db, 'courses'),
          where('userId', '==', user.uid)
        );
        const coursesSnapshot = await getDocs(coursesQuery);
        const courseIds = coursesSnapshot.docs.map(doc => doc.id);
        const coursesMap = new Map(
          coursesSnapshot.docs.map(doc => [doc.id, doc.data().title])
        );

        // 2. Récupérer tous les parcours
        const pathsQuery = query(
          collection(db, 'learningPaths'),
          where('userId', '==', user.uid)
        );
        const pathsSnapshot = await getDocs(pathsQuery);
        
        // 3. Gérer les parcours par courseId
        const pathsByCourse = new Map<string, { path: PathWithCourse, doc: any }[]>();
        
        pathsSnapshot.docs.forEach(pathDoc => {
          const pathData = pathDoc.data() as LearningPath;
          if (courseIds.includes(pathData.courseId)) {
            const paths = pathsByCourse.get(pathData.courseId) || [];
            paths.push({
              path: {
                ...pathData,
                id: pathDoc.id,
                courseTitle: coursesMap.get(pathData.courseId) || 'Cours sans titre'
              },
              doc: pathDoc
            });
            pathsByCourse.set(pathData.courseId, paths);
          }
        });

        // 4. Nettoyer les doublons et garder uniquement les parcours valides
        const validPaths: PathWithCourse[] = [];
        const deletePromises: Promise<void>[] = [];

        pathsByCourse.forEach((paths, courseId) => {
          if (paths.length > 1) {
            // Trier par date de mise à jour et garder le plus récent
            paths.sort((a, b) => 
              new Date(b.path.updatedAt).getTime() - new Date(a.path.updatedAt).getTime()
            );
            
            // Garder le premier (le plus récent)
            validPaths.push(paths[0].path);
            
            // Supprimer les autres
            paths.slice(1).forEach(({ doc: pathDoc }) => {
              deletePromises.push(deleteDoc(doc(db, 'learningPaths', pathDoc.id)));
            });
          } else if (paths.length === 1) {
            validPaths.push(paths[0].path);
          }
        });

        // 5. Exécuter les suppressions
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
        }

        setPaths(validPaths);
      } catch (error) {
        console.error('Error loading paths:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPaths();
  }, [user]);

  const calculatePhaseProgress = (phase: Phase) => {
    if (phase.chapters) {
      const totalSteps = phase.chapters.reduce((acc, chapter) => acc + chapter.steps.length, 0);
      const completedSteps = phase.chapters.reduce((acc, chapter) => 
        acc + chapter.steps.filter(step => step.completed).length, 0);
      return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    }
    
    if (phase.steps) {
      const completedSteps = phase.steps.filter(step => step.completed).length;
      return phase.steps.length > 0 ? Math.round((completedSteps / phase.steps.length) * 100) : 0;
    }

    return 0;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-8">Mes parcours</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement des parcours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mes parcours</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {paths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Vous n'avez pas encore de parcours. Commencez par créer un cours.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paths.map((path) => (
            <div 
              key={path.id}
              onClick={() => navigate(`/paths/${path.id}`)}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-6">{path.courseTitle}</h2>
              
              <div className="space-y-4">
                {path.phases.map((phase) => {
                  const progress = calculatePhaseProgress(phase);
                  return (
                    <div key={phase.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {progress > 0 ? (
                          <Clock className="w-5 h-5 text-gold" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                        <span className="text-gray-700">{phase.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-200">
                          <div 
                            className="h-full rounded-full bg-gold transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}