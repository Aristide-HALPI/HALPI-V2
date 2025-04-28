import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Book, CheckCircle, Award, ChevronDown, ChevronUp, FileText,
  Brain, Lightbulb, PenTool, Map, Puzzle, Zap, BookOpen, Microscope
} from 'lucide-react';
import Card from '../../components/common/Card';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Chapter {
  id: string;
  title: string;
  description: string;
  activities: Activity[];
  isCompleted: boolean;
  is_introduction?: boolean;
  is_conclusion?: boolean;
}

interface Activity {
  id: string;
  title: string;
  type: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video' | 'header';
  duration: number;
  isCompleted: boolean;
  chapterId?: string;
  parentId?: string;
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
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPhases, setOpenPhases] = useState<{[key: string]: boolean}>({ c1: false, c2: false, c3: false });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!courseId || !user) {
          setError('Identifiant de cours ou utilisateur non disponible');
          setLoading(false);
          return;
        }

        // Récupérer d'abord le user_course pour obtenir le course_id
        console.log('Fetching user_course with ID:', courseId);
        const { data: userCourseData, error: userCourseError } = await supabase
          .from('user_courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (userCourseError) {
          console.error('Error fetching user_course:', userCourseError);
          throw new Error(`Erreur lors de la récupération du parcours: ${userCourseError.message}`);
        }
        
        if (!userCourseData) {
          console.error('No user_course found with ID:', courseId);
          throw new Error('Parcours non trouvé');
        }
        
        console.log('User course data:', JSON.stringify(userCourseData, null, 2));

        // Récupérer les informations du cours associé
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', userCourseData.course_id)
          .single();
        
        if (courseError) {
          console.error('Error fetching course:', courseError);
          throw new Error(`Erreur lors de la récupération du cours: ${courseError.message}`);
        }
        
        if (!courseData) {
          console.error('No course found with ID:', userCourseData.course_id);
          throw new Error('Cours associé non trouvé');
        }
        
        console.log('Course data:', JSON.stringify(courseData, null, 2));

        // Récupérer les chapitres du cours
        console.log('Fetching chapters for course ID:', userCourseData.course_id);
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', userCourseData.course_id)
          .order('order_index', { ascending: true });

        if (chaptersError) {
          console.error('Error fetching chapters data:', chaptersError);
          throw new Error(`Erreur lors de la récupération des chapitres: ${chaptersError.message}`);
        }
        
        console.log('Chapters data:', JSON.stringify(chaptersData, null, 2));
        
        // Filtrer les chapitres marqués comme introduction ou conclusion dans la base de données
        const filteredChapters = chaptersData ? [...chaptersData]
          .filter(chapter => {
            // On exclut les chapitres marqués comme introduction ou conclusion
            return !chapter.is_introduction && !chapter.is_conclusion;
          })
          .sort((a, b) => {
            return (a.order_index || 0) - (b.order_index || 0);
          }) : [];
        
        console.log('Chapitres filtrés (sans intro/conclusion):', JSON.stringify(filteredChapters, null, 2));
        console.log('Nombre de chapitres après filtrage:', filteredChapters.length);
        console.log('Chapitres introduction/conclusion exclus:', chaptersData ? chaptersData.filter(ch => ch.is_introduction || ch.is_conclusion).length : 0);
        
        // Si aucun chapitre n'est trouvé, créer des chapitres factices pour le test
        let chaptersToUse = filteredChapters;
        if (filteredChapters.length === 0) {
          console.log('Aucun chapitre trouvé, création de chapitres factices pour le test');
          chaptersToUse = [
            { id: 'fake-ch1', title: 'Chapitre 1', order_index: 1 },
            { id: 'fake-ch2', title: 'Chapitre 2', order_index: 2 },
            { id: 'fake-ch3', title: 'Chapitre 3', order_index: 3 }
          ] as any[];
        }
        
        // Créer la structure du cours pour l'affichage
        const phase1Activities: Activity[] = chaptersToUse.flatMap((chapter, chapterIndex) => [
          // Titre du chapitre comme activité de type 'header'
          {
            id: `a1-ch${chapterIndex}-header`,
            title: chapter.title,
            type: 'header' as const,
            duration: 0,
            isCompleted: false,
            chapterId: chapter.id
          },
          // Étape 1 pour ce chapitre
          {
            id: `a1-ch${chapterIndex}-step1`,
            title: 'Etape 1. Lecture active',
            type: 'lecture_active' as const,
            duration: 15,
            isCompleted: false,
            chapterId: chapter.id,
            parentId: `a1-ch${chapterIndex}-header`
          },
          // Étape 2 pour ce chapitre
          {
            id: `a1-ch${chapterIndex}-step2`,
            title: 'Etape 2. Élaboration des Concepts Clés',
            type: 'lecture_active' as const,
            duration: 20,
            isCompleted: false,
            chapterId: chapter.id,
            parentId: `a1-ch${chapterIndex}-header`
          }
        ]);
        
        const phase2Activities: Activity[] = chaptersToUse.flatMap((chapter, chapterIndex) => [
          // Titre du chapitre comme activité de type 'header'
          {
            id: `a2-ch${chapterIndex}-header`,
            title: chapter.title,
            type: 'header' as const,
            duration: 0,
            isCompleted: false,
            chapterId: chapter.id
          },
          // Étape 3 pour ce chapitre
          {
            id: `a2-ch${chapterIndex}-step3`,
            title: 'Etape 3. Mémorisation des concepts clés',
            type: 'lecture_active' as const,
            duration: 20,
            isCompleted: false,
            chapterId: chapter.id,
            parentId: `a2-ch${chapterIndex}-header`
          },
          // Étape 4 pour ce chapitre
          {
            id: `a2-ch${chapterIndex}-step4`,
            title: 'Etape 4. Mindmapping',
            type: 'pratique_deliberee' as const,
            duration: 30,
            isCompleted: false,
            chapterId: chapter.id,
            parentId: `a2-ch${chapterIndex}-header`
          }
        ]);
        
        console.log('Phase 1 activities:', phase1Activities.length);
        console.log('Phase 2 activities:', phase2Activities.length);
        
        const tempCourse: Course = {
          id: courseId,
          title: courseData.name || 'Introduction à la psychologie',
          description: courseData.description || '',
          level: userCourseData.difficulty || 'Débutant',
          image: courseData.image_url || '',
          progress: 0, // À calculer en fonction des activités complétées
          examDate: userCourseData.exam_date,
          chapters: [
            {
              id: 'c1',
              title: 'Phase 1 : Découvrir le savoir',
              description: '',
              isCompleted: false,
              activities: phase1Activities
            },
            {
              id: 'c2',
              title: 'Phase 2 : Comprendre le savoir',
              description: '',
              isCompleted: false,
              activities: phase2Activities
            },
            {
              id: 'c3',
              title: 'Phase 3 : Ancrer le savoir',
              description: '',
              isCompleted: false,
              activities: [
                // Consolidation 1 avec son groupe d'activités
                {
                  id: 'a13',
                  title: 'Consolidation 1',
                  type: 'header',
                  duration: 0,
                  isCompleted: false
                },
                {
                  id: 'a14',
                  title: 'Quiz 1',
                  type: 'quiz',
                  duration: 10,
                  isCompleted: false,
                  parentId: 'a13'
                },
                {
                  id: 'a15',
                  title: 'Remédiation 1',
                  type: 'pratique_deliberee',
                  duration: 15,
                  isCompleted: false,
                  parentId: 'a13'
                },
                
                // Consolidation 2 avec son groupe d'activités
                {
                  id: 'a16',
                  title: 'Consolidation 2',
                  type: 'header',
                  duration: 0,
                  isCompleted: false
                },
                {
                  id: 'a17',
                  title: 'Quiz 2',
                  type: 'quiz',
                  duration: 10,
                  isCompleted: false,
                  parentId: 'a16'
                },
                {
                  id: 'a18',
                  title: 'Remédiation 2',
                  type: 'pratique_deliberee',
                  duration: 15,
                  isCompleted: false,
                  parentId: 'a16'
                }
              ]
            }
          ]
        };
        
        console.log('Course structure:', JSON.stringify(tempCourse.chapters.map(ch => ({ id: ch.id, title: ch.title, activities: ch.activities.length })), null, 2));
        setCourse(tempCourse);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err instanceof Error ? err.message : 'Impossible de charger les détails du cours');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId, user]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  if (error || !course) {
    return <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md">{error || 'Cours non trouvé'}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="p-6 md:w-2/3">
            <div className="flex items-center gap-2 mb-4">
              <Link to="/parcours" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <ChevronLeft size={20} />
                <span>Retour aux parcours</span>
              </Link>
            </div>
            
            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.description}</p>
          </div>
        </div>
      </Card>
      
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
                  {course.chapters ? course.chapters.filter(c => c.isCompleted).length : 0}/{course.chapters ? course.chapters.length : 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Activités complétées</p>
                <p className="font-medium text-gray-900">
                  {course.chapters ? course.chapters.flatMap(c => c.activities).filter(a => a.isCompleted).length : 0}/
                  {course.chapters ? course.chapters.flatMap(c => c.activities).length : 0}
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
        <h2 className="text-xl font-medium text-gray-900">Contenu du parcours</h2>
        
        {course.chapters && course.chapters.map((chapter, index) => (
          <Card key={chapter.id} className="overflow-hidden">
            <button 
              className="w-full p-6 border-b border-gray-100 text-left focus:outline-none"
              onClick={() => {
                console.log('Toggling phase:', chapter.id, 'Current state:', openPhases[chapter.id]);
                setOpenPhases(prev => {
                  const newState = {
                    ...prev,
                    [chapter.id]: !prev[chapter.id]
                  };
                  console.log('New state:', newState);
                  return newState;
                });
              }}
            >
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
                <div>
                  {openPhases[chapter.id] ? (
                    <ChevronUp size={20} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-500" />
                  )}
                </div>
              </div>
            </button>
            

            
            <div className={`${openPhases[chapter.id] ? 'block' : 'hidden'} bg-gray-50 divide-y divide-gray-100`}>
              {chapter.activities && chapter.activities.length > 0 ? chapter.activities.map((activity) => {
                // Si c'est un header de chapitre, on affiche différemment
                if (activity.type === 'header') {
                  // Simplifier le titre du chapitre si nécessaire
                  let displayTitle = activity.title;
                  
                  // Si c'est un chapitre (pas une consolidation) et que le titre contient des deux-points, on garde seulement la première partie
                  if (!activity.title.includes('Consolidation') && displayTitle.includes(':')) {
                    displayTitle = displayTitle.split(':')[0].trim();
                  }
                  
                  // Si le titre contient "Introduction à la psychologie - Chapitre X", on extrait juste "Chapitre X"
                  if (displayTitle.includes('Introduction à la psychologie - ')) {
                    displayTitle = displayTitle.replace('Introduction à la psychologie - ', '');
                  }
                  
                  return (
                    <div key={activity.id} className="bg-gray-100 p-4 border-l-4 border-primary-500">
                      <div className="flex items-center gap-2">
                        {activity.title.includes('Consolidation') ? 
                          <Puzzle size={18} className="text-orange-600" /> : 
                          <FileText size={18} className="text-primary-600" />}
                        <h4 className="font-semibold text-gray-800">{displayTitle}</h4>
                      </div>
                    </div>
                  );
                }
                
                // Pour les activités normales
                return (
                  <Link 
                    key={activity.id}
                    to={`/activities/${activity.id}?returnTo=${courseId}`}
                    className={`flex items-center justify-between p-4 hover:bg-gray-100 transition-colors ${activity.parentId ? 'pl-16' : 'pl-10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-full
                        ${activity.title.includes('Lecture active') ? 'bg-blue-100' :
                          activity.title.includes('Élaboration des Concepts') ? 'bg-yellow-100' :
                          activity.title.includes('Mémorisation') ? 'bg-purple-100' :
                          activity.title.includes('Mindmapping') ? 'bg-green-100' :
                          activity.title.includes('Consolidation') ? 'bg-orange-100' :
                          activity.title.includes('Quiz') ? 'bg-accent-100' :
                          activity.title.includes('Remédiation') ? 'bg-pink-100' :
                          activity.type === 'lecture_active' ? 'bg-blue-100' :
                          activity.type === 'quiz' ? 'bg-accent-100' :
                          activity.type === 'pratique_deliberee' ? 'bg-success-100' :
                          'bg-primary-100'}
                      `}>
                        {activity.title.includes('Lecture active') ? <BookOpen size={16} className="text-blue-600" /> :
                         activity.title.includes('Élaboration des Concepts') ? <Lightbulb size={16} className="text-yellow-600" /> :
                         activity.title.includes('Mémorisation') ? <Brain size={16} className="text-purple-600" /> :
                         activity.title.includes('Mindmapping') ? <Map size={16} className="text-green-600" /> :
                         activity.title.includes('Consolidation') ? <Puzzle size={16} className="text-orange-600" /> :
                         activity.title.includes('Quiz') ? <Award size={16} className="text-accent-600" /> :
                         activity.title.includes('Remédiation') ? <Zap size={16} className="text-pink-600" /> :
                         activity.type === 'lecture_active' ? <Book size={16} className="text-blue-600" /> :
                         activity.type === 'quiz' ? <Award size={16} className="text-accent-600" /> :
                         activity.type === 'pratique_deliberee' ? <PenTool size={16} className="text-success-600" /> :
                         <Microscope size={16} className="text-primary-600" />}
                      </div>
                      
                      <div>
                        <p className={`font-medium ${activity.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.title.includes('Lecture active') ? 'Lecture active' :
                           activity.title.includes('Élaboration des Concepts') ? 'Élaboration' :
                           activity.title.includes('Mémorisation') ? 'Mémorisation' :
                           activity.title.includes('Mindmapping') ? 'Mindmapping' :
                           activity.title.includes('Consolidation') ? 'Consolidation' :
                           activity.title.includes('Quiz') ? 'Quiz' :
                           activity.title.includes('Remédiation') ? 'Remédiation' :
                           activity.type === 'lecture_active' ? 'Lecture active' : 
                           activity.type === 'quiz' ? 'Quiz' : 
                           activity.type === 'pratique_deliberee' ? 'Pratique délibérée' : 
                           'Activité'}{activity.duration > 0 ? ` • ${activity.duration} min` : ''}
                        </p>
                      </div>
                    </div>
                    
                    {activity.isCompleted ? (
                      <CheckCircle size={16} className="text-success-500" />
                    ) : (
                      <ChevronLeft size={16} className="text-gray-400 transform rotate-180" />
                    )}
                  </Link>
                );
              }) : (
                <div className="p-4 text-gray-500 italic">Aucune activité disponible pour cette phase</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseProgressPage;
