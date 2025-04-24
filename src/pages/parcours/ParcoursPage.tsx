import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, BarChart2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface CourseProgress {
  id: string;
  title: string;
  description: string;
  level: string;
  image: string;
  progress: number;
  lastActivity: string;
  nextActivity?: {
    id: string;
    title: string;
    type: string;
    estimatedTime: number;
  };
  examDate?: string;
  timeSpent: number;
  totalActivities: number;
  completedActivities: number;
}

const ParcoursPage = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!user) return;
      
      try {
        // Dans une implémentation réelle, nous récupérerions les données depuis Supabase
        // const { data, error } = await supabase
        //   .from('user_course_progress')
        //   .select(`
        //     id,
        //     progression_rate,
        //     total_study_time,
        //     exam_date,
        //     last_updated_at,
        //     courses (
        //       id,
        //       name,
        //       description,
        //       level,
        //       image_url
        //     )
        //   `)
        //   .eq('user_id', user.id);
        
        // if (error) throw error;
        
        // Pour l'instant, utilisons des données temporaires
        const tempData: CourseProgress[] = [
          {
            id: '1',
            title: 'Les fondamentaux du windsurf',
            description: 'Maîtrisez les bases du windsurf : équipement, positionnement, et premiers déplacements.',
            level: 'Débutant',
            image: 'https://images.pexels.com/photos/1604869/pexels-photo-1604869.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            progress: 35,
            lastActivity: '2025-04-20T14:30:00',
            nextActivity: {
              id: 'a1',
              title: 'Lecture active : Choix de l\'équipement',
              type: 'lecture_active',
              estimatedTime: 20
            },
            examDate: '2025-06-15',
            timeSpent: 180,
            totalActivities: 24,
            completedActivities: 8
          },
          {
            id: '4',
            title: 'Navigation par vent fort',
            description: 'Stratégies et techniques pour naviguer en toute sécurité dans des conditions de vent fort.',
            level: 'Intermédiaire',
            image: 'https://images.pexels.com/photos/1604869/pexels-photo-1604869.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            progress: 80,
            lastActivity: '2025-04-22T09:15:00',
            nextActivity: {
              id: 'a2',
              title: 'Quiz final',
              type: 'quiz',
              estimatedTime: 30
            },
            examDate: '2025-05-10',
            timeSpent: 420,
            totalActivities: 28,
            completedActivities: 22
          }
        ];
        
        setCourses(tempData);
      } catch (err) {
        console.error('Error fetching user courses:', err);
        setError('Impossible de charger vos parcours');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserCourses();
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
              {/* Image du cours */}
              <div className="md:w-1/4 h-48 md:h-auto relative">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <span className={`
                    text-xs font-medium px-2.5 py-0.5 rounded-full
                    ${course.level === 'Débutant' ? 'bg-success-100 text-success-800' : 
                      course.level === 'Intermédiaire' ? 'bg-primary-100 text-primary-800' : 
                      'bg-accent-100 text-accent-800'}
                  `}>
                    {course.level}
                  </span>
                </div>
              </div>
              
              {/* Contenu du cours */}
              <div className="p-6 md:w-3/4 flex flex-col">
                <div className="flex-1">
                  <h2 className="text-xl font-medium text-gray-900 mb-1">{course.title}</h2>
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
