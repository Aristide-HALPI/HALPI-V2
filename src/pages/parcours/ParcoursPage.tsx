import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, BarChart2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface CourseProgress {
  id: string;               // user_course.id
  course_id: string;        // course.id
  title: string;            // course.name
  description: string;      // course.description
  level: string;            // course.level ou user_course.difficulty
  progress: number;         // calculé à partir des activités
  lastActivity: string;     // dernière activité ou date de création
  nextActivity?: {
    id: string;
    title: string;
    type: string;
    estimatedTime: number;
  };
  examDate?: string;        // user_course.exam_date
  timeSpent: number;        // temps passé sur le cours
  totalActivities: number;  // nombre total d'activités
  completedActivities: number; // nombre d'activités complétées
  chapter_count: number;    // nombre de chapitres
}

const ParcoursPage = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const fetchUserCourses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les cours de l'utilisateur depuis Supabase
      const { data: userCoursesData, error: userCoursesError } = await supabase
        .from('user_courses')
        .select(`
          id,
          course_id,
          exam_date,
          difficulty,
          estimated_time,
          course:courses(id, name, description, level, image_url)
        `)
        .eq('user_id', user.id);
      
      if (userCoursesError) throw userCoursesError;
      
      // Transformation des données pour correspondre au type CourseProgress
      const progressData: CourseProgress[] = [];
      
      for (const userCourse of userCoursesData || []) {
        // Récupérer le nombre de chapitres pour ce cours
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('id', { count: 'exact' })
          .eq('course_id', userCourse.course_id);
        
        if (chaptersError) throw chaptersError;
        
        const chapterCount = chaptersData?.length || 0;
        
        // Récupérer les activités pour ce cours (pour l'instant, simulées)
        // Dans une implémentation réelle, vous récupéreriez les vraies activités
        const totalActivities = chapterCount * 3; // Estimation: 3 activités par chapitre
        const completedActivities = Math.floor(Math.random() * totalActivities); // Simulé pour l'instant
        const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
        
        // Créer l'objet CourseProgress
        const courseInfo = Array.isArray(userCourse.course) && userCourse.course.length > 0 
          ? userCourse.course[0] 
          : { id: '', name: userCourse.course_id ? 'Introduction à la psychologie' : 'Cours sans titre', description: '', level: 'débutant' };
        
        progressData.push({
          id: userCourse.id,
          course_id: userCourse.course_id,
          title: courseInfo.name,
          description: courseInfo.description || 'Aucune description disponible',
          level: userCourse.difficulty || courseInfo.level || 'débutant',
          progress: progress,
          lastActivity: new Date().toISOString(), // Simulé pour l'instant
          examDate: userCourse.exam_date,
          timeSpent: parseInt(userCourse.estimated_time?.toString() || '0') * 60, // Conversion heures en minutes
          totalActivities: totalActivities,
          completedActivities: completedActivities,
          chapter_count: chapterCount,
          // Simuler une prochaine activité si le cours a des chapitres et n'est pas terminé
          ...(chapterCount > 0 && progress < 100 ? {
            nextActivity: {
              id: `activity-${userCourse.course_id}-${Math.floor(Math.random() * 1000)}`,
              title: `Chapitre ${Math.floor(Math.random() * chapterCount) + 1}`,
              type: ['lecture_active', 'quiz', 'pratique_deliberee'][Math.floor(Math.random() * 3)],
              estimatedTime: 20 + Math.floor(Math.random() * 40) // Entre 20 et 60 minutes
            }
          } : {})
        });
      }
      
      setCourses(progressData);
    } catch (err) {
      console.error('Error fetching user courses:', err);
      setError('Impossible de charger vos parcours');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchUserCourses();
    }
  }, [user]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} h`;
    } else {
      return `${hours} h ${mins} min`;
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
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
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">Vous n'avez pas encore de parcours</h2>
        <p className="text-gray-600 mb-6">Commencez par explorer notre catalogue de cours</p>
        <Link 
          to="/courses" 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Découvrir les cours
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Mes Parcours</h1>
        <p className="text-gray-600">Suivez votre progression et continuez votre apprentissage</p>
      </div>
      
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="bg-primary-100 p-3 rounded-full">
            <BarChart2 size={24} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Progression moyenne</p>
            <p className="text-xl font-semibold text-gray-900">
              {Math.round(courses.reduce((acc, course) => acc + course.progress, 0) / courses.length)}%
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
              {formatTime(courses.reduce((acc, course) => acc + course.timeSpent, 0))}
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
              {courses.some(course => course.examDate) 
                ? formatDate(courses
                    .filter(course => course.examDate)
                    .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime())[0]
                    .examDate!)
                : 'Aucun'
              }
            </p>
          </div>
        </Card>
      </div>
      
      {/* Liste des parcours */}
      <div className="space-y-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Informations du cours */}
              <div className="p-4 border-b border-gray-200 md:w-1/4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {course.title}
                  </h3>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {course.description}
                </p>
                {course.chapter_count === 0 && (
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm flex items-center">
                    <AlertCircle size={16} className="mr-1.5" />
                    Aucun chapitre disponible
                  </div>
                )}
              </div>
              
              {/* Contenu du cours */}
              <div className="p-6 md:w-3/4 flex flex-col">
                <div className="flex-1">
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Progression</span>
                      <span className="text-sm font-medium text-primary-600">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Statistiques du cours */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Activités</p>
                      <p className="font-medium text-gray-900">{course.completedActivities}/{course.totalActivities}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Temps passé</p>
                      <p className="font-medium text-gray-900">{formatTime(course.timeSpent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dernière activité</p>
                      <p className="font-medium text-gray-900">
                        {new Date(course.lastActivity).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Examen</p>
                      <p className="font-medium text-gray-900">
                        {course.examDate 
                          ? formatDate(course.examDate)
                          : 'Non programmé'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Prochaine activité et bouton */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-200">
                  {course.nextActivity ? (
                    <div className="mb-4 sm:mb-0">
                      <p className="text-sm font-medium text-gray-700">Prochaine activité</p>
                      <p className="text-sm text-gray-900">{course.nextActivity.title}</p>
                      <p className="text-xs text-gray-500">
                        {course.nextActivity.type === 'lecture_active' ? 'Lecture active' :
                         course.nextActivity.type === 'quiz' ? 'Quiz' :
                         course.nextActivity.type === 'pratique_deliberee' ? 'Pratique délibérée' :
                         'Activité'} • {course.nextActivity.estimatedTime} min
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 sm:mb-0">
                      <p className="text-sm font-medium text-gray-700">Félicitations !</p>
                      <p className="text-sm text-gray-900">Vous avez terminé toutes les activités.</p>
                    </div>
                  )}
                  
                  <Link 
                    to={`/parcours/${course.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Continuer
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ParcoursPage;
