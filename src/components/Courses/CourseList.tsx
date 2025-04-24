import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, BookOpen, Edit2, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Course {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

interface UserCourse {
  id: string;
  course_id: string;
  exam_date: string;
  difficulty: string;
  estimated_time: number;
  course: Course;
  chapter_count?: number;
}

interface CourseListProps {
  onAddCourse: () => void;
}

const CourseList = ({ onAddCourse }: CourseListProps) => {
  const { user } = useAuth();
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCourses();
  }, [user]);

  const fetchUserCourses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('user_courses')
        .select(`
          id,
          course_id,
          exam_date,
          difficulty,
          estimated_time,
          course:courses(id, name, description, image_url)
        `)
        .eq('user_id', user.id);
      
      if (fetchError) throw fetchError;
      
      // Transformation des données pour correspondre au type UserCourse
      const typedUserCourses: UserCourse[] = (data || []).map((item: any) => ({
        id: item.id,
        course_id: item.course_id,
        exam_date: item.exam_date,
        difficulty: item.difficulty,
        estimated_time: item.estimated_time,
        course: Array.isArray(item.course) && item.course.length > 0 ? item.course[0] : {
          id: '',
          name: 'Cours non disponible',
          description: '',
          image_url: ''
        },
        chapter_count: 0 // Initialisation à 0, sera mis à jour ensuite
      }));
      
      // Récupérer le nombre de chapitres pour chaque cours
      for (const userCourse of typedUserCourses) {
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('id', { count: 'exact' })
          .eq('course_id', userCourse.course_id);
        
        if (!chaptersError) {
          userCourse.chapter_count = chaptersData?.length || 0;
        }
      }
      
      setUserCourses(typedUserCourses);
    } catch (err: any) {
      console.error('Error fetching user courses:', err);
      setError('Impossible de charger vos cours');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (userCourseId: string, courseId: string) => {
    if (!user) return;
    
    try {
      setDeletingCourseId(userCourseId);
      
      // Supprimer l'association utilisateur-cours
      const { error: deleteUserCourseError } = await supabase
        .from('user_courses')
        .delete()
        .eq('id', userCourseId)
        .eq('user_id', user.id);
      
      if (deleteUserCourseError) throw deleteUserCourseError;
      
      // Vérifier si d'autres utilisateurs utilisent ce cours
      const { count, error: countError } = await supabase
        .from('user_courses')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', courseId);
      
      if (countError) throw countError;
      
      // Si personne d'autre n'utilise ce cours, le supprimer
      if (count === 0) {
        const { error: deleteCourseError } = await supabase
          .from('courses')
          .delete()
          .eq('id', courseId);
        
        if (deleteCourseError) throw deleteCourseError;
      }
      
      // Mettre à jour la liste des cours
      setUserCourses(prev => prev.filter(uc => uc.id !== userCourseId));
      
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError('Impossible de supprimer le cours');
    } finally {
      setDeletingCourseId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return 'bg-green-100 text-green-800';
      case 'moyen':
        return 'bg-blue-100 text-blue-800';
      case 'difficile':
        return 'bg-red-100 text-red-800';
      case 'tres-difficile':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Fonction pour obtenir une image en fonction du titre du cours
  const getCourseImage = (courseName: string) => {
    // Liste d'images par catégorie de cours
    const courseImages = {
      math: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg',
      maths: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg',
      mathématiques: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg',
      algèbre: 'https://images.pexels.com/photos/5428833/pexels-photo-5428833.jpeg',
      géométrie: 'https://images.pexels.com/photos/5428833/pexels-photo-5428833.jpeg',
      calcul: 'https://images.pexels.com/photos/5428833/pexels-photo-5428833.jpeg',
      
      physique: 'https://images.pexels.com/photos/714699/pexels-photo-714699.jpeg',
      chimie: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg',
      biologie: 'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg',
      sciences: 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg',
      
      histoire: 'https://images.pexels.com/photos/2402926/pexels-photo-2402926.jpeg',
      géographie: 'https://images.pexels.com/photos/269633/pexels-photo-269633.jpeg',
      économie: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg',
      
      droit: 'https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg',
      justice: 'https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg',
      
      informatique: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
      programmation: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
      code: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg',
      
      langue: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg',
      français: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg',
      anglais: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg',
      espagnol: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg',
      allemand: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg',
      
      philosophie: 'https://images.pexels.com/photos/3769707/pexels-photo-3769707.jpeg',
      psychologie: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
      sociologie: 'https://images.pexels.com/photos/3184433/pexels-photo-3184433.jpeg',
      
      marketing: 'https://images.pexels.com/photos/905163/pexels-photo-905163.jpeg',
      management: 'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg',
      finance: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg',
      
      médecine: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
      santé: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
      
      art: 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg',
      musique: 'https://images.pexels.com/photos/4088801/pexels-photo-4088801.jpeg',
      
      // Image par défaut si aucune correspondance n'est trouvée
      default: 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'
    };
    
    // Convertir le nom du cours en minuscules pour la recherche
    const lowerCourseName = courseName.toLowerCase();
    
    // Rechercher une correspondance dans les clés du dictionnaire
    for (const [keyword, imageUrl] of Object.entries(courseImages)) {
      if (lowerCourseName.includes(keyword.toLowerCase())) {
        return imageUrl;
      }
    }
    
    // Retourner l'image par défaut si aucune correspondance n'est trouvée
    return courseImages.default;
  };

  const formatExamDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDaysUntilExam = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    
    // Réinitialiser les heures pour comparer uniquement les dates
    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Mes Cours</h1>
        <Button onClick={onAddCourse}>Ajouter un cours</Button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement de vos cours...</p>
        </div>
      ) : userCourses.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours</h3>
          <p className="text-gray-600 mb-6">Vous n'avez pas encore ajouté de cours à votre profil.</p>
          <Button onClick={onAddCourse}>Ajouter mon premier cours</Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userCourses.map((userCourse) => (
            <Card key={userCourse.id} className="h-full overflow-hidden">
              <div className="relative aspect-video w-full overflow-hidden">
                <img
                  src={userCourse.course.image_url || getCourseImage(userCourse.course.name)}
                  alt={userCourse.course.name}
                  className="h-full w-full object-cover"
                />
                
                {userCourse.chapter_count === 0 && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1.5 m-2 rounded-md flex items-center text-xs font-medium shadow-md animate-pulse">
                    <AlertCircle size={14} className="mr-1.5" />
                    Ajoutez des chapitres
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getDifficultyColor(userCourse.difficulty)}`}>
                      {userCourse.difficulty.charAt(0).toUpperCase() + userCourse.difficulty.slice(1)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white truncate">
                    {userCourse.course.name}
                  </h3>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>Examen: {formatExamDate(userCourse.exam_date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} />
                  <span>{userCourse.estimated_time} heures d'étude estimées</span>
                </div>
                
                {getDaysUntilExam(userCourse.exam_date) > 0 ? (
                  <div className="py-2 px-3 bg-primary-50 text-primary-700 rounded-md text-sm">
                    <span className="font-medium">J-{getDaysUntilExam(userCourse.exam_date)}</span> avant l'examen
                  </div>
                ) : (
                  <div className="py-2 px-3 bg-red-50 text-red-700 rounded-md text-sm">
                    <span className="font-medium">Examen passé</span> depuis {Math.abs(getDaysUntilExam(userCourse.exam_date))} jours
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCourse(userCourse.id, userCourse.course_id)}
                      disabled={deletingCourseId === userCourse.id}
                      className="p-1"
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                    <Link to={`/courses/${userCourse.course_id}`}>
                      <Button variant="outline" size="sm" className="p-1">
                        <Edit2 size={18} className="text-primary-500" />
                      </Button>
                    </Link>
                  </div>
                  
                  <Link 
                    to={`/courses/${userCourse.course_id}`}
                    className={`flex items-center font-medium text-sm gap-1 hover:gap-2 transition-all ${userCourse.chapter_count === 0 ? 'text-red-600 font-semibold' : 'text-primary-600'}`}
                  >
                    <span>{userCourse.chapter_count === 0 ? 'Ajouter des chapitres' : 'Gérer les chapitres'}</span>
                    <ChevronRight size={16} className="hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
