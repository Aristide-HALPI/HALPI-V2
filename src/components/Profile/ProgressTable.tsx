import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Card from '../common/Card';
import { BarChart2, Clock, Calendar, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface CourseProgress {
  id: string;
  course_name: string;
  progression_rate: number;
  total_study_time: number;
  confidence_level: number;
  exam_date: string | null;
  last_updated_at: string;
  steps_completed?: string[];
  quiz_scores?: Record<string, number>;
}

interface ProgressTableProps {
  userId: string;
}

const ProgressTable: React.FC<ProgressTableProps> = ({ userId }) => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCourseProgress = async () => {
      try {
        // Requête pour obtenir la progression des cours de l'utilisateur
        const { data, error } = await supabase
          .from('user_course_progress')
          .select(`
            id,
            progression_rate,
            total_study_time,
            confidence_level,
            exam_date,
            last_updated_at,
            courses (
              name
            )
          `)
          .eq('user_id', userId);
        
        if (error) {
          throw error;
        }
        
        // Transformer les données pour l'affichage
        const formattedData = data.map((item: any) => ({
          id: item.id,
          course_name: item.courses?.name,
          progression_rate: item.progression_rate || 0,
          total_study_time: item.total_study_time || 0,
          confidence_level: item.confidence_level || 0,
          exam_date: item.exam_date,
          last_updated_at: item.last_updated_at,
          steps_completed: item.steps_completed || [],
          quiz_scores: item.quiz_scores || {}
        }));
        
        setCourses(formattedData);
      } catch (err) {
        console.error('Error fetching course progress:', err);
        setError('Impossible de charger vos données de progression');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchCourseProgress();
    }
  }, [userId]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin h-6 w-6 text-primary-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }
  
  if (courses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Vous n'avez pas encore commencé de cours.</p>
        <p className="mt-2">
          <a href="/courses" className="text-primary-600 hover:text-primary-700 font-medium">
            Découvrir les cours disponibles
          </a>
        </p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="bg-primary-100 p-3 rounded-full">
            <BarChart2 size={24} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Progression moyenne</p>
            <p className="text-xl font-semibold text-gray-900">
              {Math.round(courses.reduce((acc, course) => acc + course.progression_rate, 0) / courses.length)}%
            </p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4">
          <div className="bg-accent-100 p-3 rounded-full">
            <Clock size={24} className="text-accent-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Temps d'étude total</p>
            <p className="text-xl font-semibold text-gray-900">
              {courses.reduce((acc, course) => acc + course.total_study_time, 0)} min
            </p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4">
          <div className="bg-success-100 p-3 rounded-full">
            <Calendar size={24} className="text-success-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Prochain examen</p>
            <p className="text-xl font-semibold text-gray-900">
              {courses.some(course => course.exam_date) 
                ? new Date(Math.min(...courses
                    .filter(course => course.exam_date)
                    .map(course => new Date(course.exam_date!).getTime())))
                    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : 'Aucun'
              }
            </p>
          </div>
        </Card>
      </div>
      
      {/* Tableau de progression des cours */}
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{course.course_name}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <Clock size={16} className="mr-1" />
                  <span>{course.total_study_time} min d'étude</span>
                  {course.exam_date && (
                    <>
                      <span className="mx-2">•</span>
                      <Calendar size={16} className="mr-1" />
                      <span>Examen le {new Date(course.exam_date).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Progression globale</div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${course.progression_rate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{course.progression_rate}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Confiance</div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star} 
                        className={`w-4 h-4 ${star <= Math.round(course.confidence_level) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Étapes du parcours HALPI */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Parcours d'apprentissage HALPI</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Étape 1: Lecture */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('lecture') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">1. Lecture</h5>
                  {course.steps_completed?.includes('lecture') ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Lecture initiale du cours</p>
              </div>
              
              {/* Étape 2: Concepts clés - Partie 1 */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('concepts_1') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">2. Concepts clés I</h5>
                  {course.steps_completed?.includes('concepts_1') ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Identification des concepts clés</p>
              </div>
              
              {/* Étape 3: Concepts clés - Partie 2 */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('concepts_2') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">3. Concepts clés II</h5>
                  {course.steps_completed?.includes('concepts_2') ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Approfondissement des concepts</p>
              </div>
              
              {/* Étape 4: Mindmapping */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('mindmapping') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">4. Mindmapping</h5>
                  {course.steps_completed?.includes('mindmapping') ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Création de carte mentale</p>
              </div>
              
              {/* Étape 5: Préparation quiz */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('quiz_prep') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">5. Préparation quiz</h5>
                  {course.steps_completed?.includes('quiz_prep') ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Préparation aux évaluations</p>
              </div>
              
              {/* Étape 6: Quiz 1 + Correction */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('quiz_1') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">6. Quiz 1</h5>
                  {course.steps_completed?.includes('quiz_1') ? (
                    <div className="flex items-center">
                      <span className="text-xs font-medium mr-1">{course.quiz_scores?.quiz_1 || 0}/20</span>
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Premier quiz et correction</p>
              </div>
              
              {/* Étape 7: Quiz 2 + Correction */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('quiz_2') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">7. Quiz 2</h5>
                  {course.steps_completed?.includes('quiz_2') ? (
                    <div className="flex items-center">
                      <span className="text-xs font-medium mr-1">{course.quiz_scores?.quiz_2 || 0}/20</span>
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Second quiz et correction</p>
              </div>
              
              {/* Étape 8: Quiz 3 + Révision finale */}
              <div className={`p-3 rounded-lg border ${course.steps_completed?.includes('quiz_3') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium">8. Quiz 3</h5>
                  {course.steps_completed?.includes('quiz_3') ? (
                    <div className="flex items-center">
                      <span className="text-xs font-medium mr-1">{course.quiz_scores?.quiz_3 || 0}/20</span>
                      <CheckCircle size={16} className="text-green-500" />
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-gray-600">Quiz final et révision</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            Dernière mise à jour : {new Date(course.last_updated_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProgressTable;
