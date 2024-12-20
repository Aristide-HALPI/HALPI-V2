import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Circle, Book, Clock, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LearningPath } from '../types/learningPath';
import { cn } from '../lib/utils';

export function PathDetail() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Référence pour le défilement
  const stepRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    async function loadPath() {
      if (!user || !pathId) return;

      try {
        const pathDoc = await getDoc(doc(db, 'learningPaths', pathId));
        if (pathDoc.exists()) {
          const pathData = { ...pathDoc.data(), id: pathDoc.id } as LearningPath;
          setPath(pathData);

          const courseDoc = await getDoc(doc(db, 'courses', pathData.courseId));
          if (courseDoc.exists()) {
            setCourseTitle(courseDoc.data().title);
          }

          // Récupérer le dernier stepId visité
          const lastStepId = localStorage.getItem(`lastStepId_${pathId}`);
          if (lastStepId) {
            // Attendre que le DOM soit mis à jour
            setTimeout(() => {
              const element = stepRefs.current[lastStepId];
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error loading path:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPath();
  }, [pathId, user]);

  const handleStepClick = (stepId: string) => {
    // Sauvegarder le stepId dans le localStorage
    localStorage.setItem(`lastStepId_${pathId}`, stepId);
    navigate(`/paths/${pathId}/activity/${stepId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement du parcours...</p>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Parcours non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/paths')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux parcours
          </button>
          <h1 className="text-2xl font-bold">{courseTitle}</h1>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      <div className="space-y-6">
        {path.phases.map((phase) => (
          <div key={phase.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{phase.title}</h2>
                  <p className="text-gray-600 text-sm mt-1">{phase.description}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {phase.chapters?.map((chapter) => (
                <div key={chapter.id} className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Chapitre {chapter.number}</h3>
                  <div className="space-y-2 pl-4">
                    {chapter.steps.map((step) => (
                      <button
                        key={step.id}
                        ref={(el) => stepRefs.current[step.id] = el}
                        onClick={() => handleStepClick(step.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                          "hover:bg-gray-50 text-left",
                          step.completed ? "text-gray-500" : "text-gray-700"
                        )}
                      >
                        <Book className="w-5 h-5 text-gold" />
                        <span>{step.title}</span>
                        {step.completed ? (
                          <Clock className="w-4 h-4 text-green-500 ml-auto" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {phase.steps?.map((step) => (
                <button
                  key={step.id}
                  ref={(el) => stepRefs.current[step.id] = el}
                  onClick={() => handleStepClick(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 transition-colors",
                    "hover:bg-gray-50 text-left",
                    step.completed ? "text-gray-500" : "text-gray-700"
                  )}
                >
                  <Book className="w-5 h-5 text-gold" />
                  <span>{step.title}</span>
                  {step.completed ? (
                    <Clock className="w-4 h-4 text-green-500 ml-auto" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}