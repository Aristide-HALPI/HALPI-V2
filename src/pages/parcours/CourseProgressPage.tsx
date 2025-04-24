import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Book, CheckCircle, Clock, Award } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { supabase } from '../../lib/supabaseClient';

interface Chapter {
  id: string;
  title: string;
  description: string;
  activities: Activity[];
  isCompleted: boolean;
}

interface Activity {
  id: string;
  title: string;
  type: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video';
  duration: number;
  isCompleted: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  image: string;
  chapters: Chapter[];
  progress: number;
  examDate?: string;
}

const CourseProgressPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Dans une implémentation réelle, nous récupérerions les données depuis Supabase
        // Pour l'instant, utilisons des données temporaires
        const tempCourse: Course = {
          id: courseId || '1',
          title: 'Les fondamentaux du windsurf',
          description: 'Maîtrisez les bases du windsurf : équipement, positionnement, et premiers déplacements.',
          level: 'Débutant',
          image: 'https://images.pexels.com/photos/1604869/pexels-photo-1604869.jpeg',
          progress: 35,
          examDate: '2025-06-15',
          chapters: [
            {
              id: 'c1',
              title: 'Introduction au windsurf',
              description: 'Découvrez l\'histoire et les principes de base du windsurf.',
              isCompleted: true,
              activities: [
                {
                  id: 'a1',
                  title: 'Histoire du windsurf',
                  type: 'lecture_active',
                  duration: 15,
                  isCompleted: true
                },
                {
                  id: 'a2',
                  title: 'Principes aérodynamiques',
                  type: 'video',
                  duration: 10,
                  isCompleted: true
                },
                {
                  id: 'a3',
                  title: 'Quiz: Concepts de base',
                  type: 'quiz',
                  duration: 5,
                  isCompleted: true
                }
              ]
            },
            {
              id: 'c2',
              title: 'Équipement',
              description: 'Apprenez à connaître et choisir votre équipement de windsurf.',
              isCompleted: false,
              activities: [
                {
                  id: 'a4',
                  title: 'Les planches de windsurf',
                  type: 'lecture_active',
                  duration: 20,
                  isCompleted: true
                },
                {
                  id: 'a5',
                  title: 'Les voiles et gréements',
                  type: 'lecture_active',
                  duration: 20,
                  isCompleted: false
                },
                {
                  id: 'a6',
                  title: 'Pratique: Choix de l\'équipement',
                  type: 'pratique_deliberee',
                  duration: 30,
                  isCompleted: false
                }
              ]
            },
            {
              id: 'c3',
              title: 'Techniques de base',
              description: 'Maîtrisez les techniques fondamentales du windsurf.',
              isCompleted: false,
              activities: [
                {
                  id: 'a7',
                  title: 'Position sur la planche',
                  type: 'video',
                  duration: 15,
                  isCompleted: false
                },
                {
                  id: 'a8',
                  title: 'Techniques de départ',
                  type: 'lecture_active',
                  duration: 25,
                  isCompleted: false
                }
              ]
            }
          ]
        };
        
        setCourse(tempCourse);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Impossible de charger les détails du cours');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  if (error || !course) {
    return <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md">{error || 'Cours non trouvé'}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/parcours" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4">
          <ChevronLeft size={16} className="mr-1" />
          Retour aux parcours
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600">{course.description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" leftIcon={<Book size={16} />}>
              Ressources
            </Button>
            <Button variant="default">
              Continuer
            </Button>
          </div>
        </div>
      </div>
      
      {/* Progress overview */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Progression du cours</h2>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Progression globale</span>
                <span className="text-sm font-medium text-primary-600">{course.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Chapitres complétés</p>
                <p className="font-medium text-gray-900">
                  {course.chapters.filter(c => c.isCompleted).length}/{course.chapters.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Activités complétées</p>
                <p className="font-medium text-gray-900">
                  {course.chapters.flatMap(c => c.activities).filter(a => a.isCompleted).length}/
                  {course.chapters.flatMap(c => c.activities).length}
                </p>
              </div>
              {course.examDate && (
                <div>
                  <p className="text-xs text-gray-500">Date d'examen</p>
                  <p className="font-medium text-gray-900">
                    {new Date(course.examDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Chapters list */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-gray-900">Contenu du cours</h2>
        
        {course.chapters.map((chapter, index) => (
          <Card key={chapter.id} className="overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900">{chapter.title}</h3>
                    {chapter.isCompleted && (
                      <CheckCircle size={16} className="text-success-500" />
                    )}
                  </div>
                  <p className="text-gray-600">{chapter.description}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 divide-y divide-gray-100">
              {chapter.activities.map((activity) => (
                <Link 
                  key={activity.id}
                  to={`/activities/${activity.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-full
                      ${activity.type === 'lecture_active' ? 'bg-blue-100' : 
                        activity.type === 'quiz' ? 'bg-accent-100' : 
                        activity.type === 'pratique_deliberee' ? 'bg-success-100' : 
                        'bg-primary-100'}
                    `}>
                      {activity.type === 'lecture_active' ? <Book size={16} className="text-blue-600" /> : 
                       activity.type === 'quiz' ? <Award size={16} className="text-accent-600" /> : 
                       <Clock size={16} className="text-success-600" />}
                    </div>
                    
                    <div>
                      <p className={`font-medium ${activity.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.type === 'lecture_active' ? 'Lecture active' : 
                         activity.type === 'quiz' ? 'Quiz' : 
                         activity.type === 'pratique_deliberee' ? 'Pratique délibérée' : 
                         'Vidéo'} • {activity.duration} min
                      </p>
                    </div>
                  </div>
                  
                  {activity.isCompleted ? (
                    <CheckCircle size={16} className="text-success-500" />
                  ) : (
                    <ChevronLeft size={16} className="text-gray-400 transform rotate-180" />
                  )}
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseProgressPage;
