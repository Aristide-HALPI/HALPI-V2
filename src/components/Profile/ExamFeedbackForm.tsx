import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';
import Card from '../common/Card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  exam_date?: string;
}

interface ExamFeedbackFormProps {
  userId: string;
}

const ExamFeedbackForm: React.FC<ExamFeedbackFormProps> = ({ userId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [examGrade, setExamGrade] = useState('');
  const [examFeedback, setExamFeedback] = useState('');
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [preparednessRating, setPreparednessRating] = useState(3);
  const [examFeeling, setExamFeeling] = useState('');
  const [examStressLevel, setExamStressLevel] = useState(3);
  const [examTopics, setExamTopics] = useState('');
  
  useEffect(() => {
    const fetchUserCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('user_courses')
          .select(`
            course_id,
            exam_date,
            courses (
              id,
              name
            )
          `)
          .eq('user_id', userId);
        
        if (error) {
          throw error;
        }
        
        // Transformer les données pour l'affichage
        const formattedData = data.map((item: any) => ({
          id: item.courses?.id,
          name: item.courses?.name,
          exam_date: item.exam_date,
        }));
        
        setCourses(formattedData);
      } catch (err) {
        console.error('Error fetching user courses:', err);
        setError('Impossible de charger vos cours');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserCourses();
    }
  }, [userId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setError('Veuillez sélectionner un cours');
      return;
    }
    
    if (!examGrade) {
      setError('Veuillez indiquer votre note d\'examen');
      return;
    }
    
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      // Mettre à jour la progression du cours avec la note d'examen
      const { error: progressError } = await supabase
        .from('user_course_progress')
        .update({
          exam_grade: parseFloat(examGrade),
        })
        .eq('user_id', userId)
        .eq('course_id', selectedCourse);
      
      if (progressError) {
        throw progressError;
      }
      
      // Enregistrer le feedback d'examen
      const { error: feedbackError } = await supabase
        .from('exam_feedback')
        .insert([
          {
            user_id: userId,
            course_id: selectedCourse,
            grade: parseFloat(examGrade),
            feedback: examFeedback,
            difficulty_rating: difficultyRating,
            preparedness_rating: preparednessRating,
            exam_feeling: examFeeling,
            exam_stress_level: examStressLevel,
            exam_topics: examTopics,
            created_at: new Date(),
          }
        ]);
      
      if (feedbackError) {
        throw feedbackError;
      }
      
      setSuccess(true);
      setSelectedCourse('');
      setExamGrade('');
      setExamFeedback('');
      setDifficultyRating(3);
      setPreparednessRating(3);
      setExamFeeling('');
      setExamStressLevel(3);
      setExamTopics('');
      
      // Faire défiler jusqu'au message de succès
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error submitting exam feedback:', err);
      setError('Une erreur est survenue lors de l\'enregistrement de votre feedback');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin h-6 w-6 text-primary-500" />
      </div>
    );
  }
  
  if (courses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Vous n'avez pas encore de cours avec des examens programmés.</p>
        <p className="mt-2">
          <a href="/courses" className="text-primary-600 hover:text-primary-700 font-medium">
            Découvrir les cours disponibles
          </a>
        </p>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback d'examen</h3>
      <p className="text-gray-600 mb-6">
        Après avoir passé un examen, partagez vos résultats et votre expérience pour nous aider à améliorer nos cours.
      </p>
      
      {error && (
        <div className="mb-6 p-3 bg-error-50 border border-error-200 rounded-md flex items-start gap-2 text-error-800">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-3 bg-success-50 border border-success-200 rounded-md flex items-start gap-2 text-success-800">
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Feedback d'examen enregistré avec succès</p>
            <p className="text-sm">Merci pour votre retour ! Nous l'utiliserons pour améliorer nos cours.</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
            Cours
          </label>
          <select
            id="course"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            required
          >
            <option value="">Sélectionner un cours</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} {course.exam_date ? `(Examen le ${new Date(course.exam_date).toLocaleDateString('fr-FR')})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="examGrade" className="block text-sm font-medium text-gray-700 mb-1">
            Note obtenue
          </label>
          <input
            type="number"
            id="examGrade"
            min="0"
            max="20"
            step="0.1"
            value={examGrade}
            onChange={(e) => setExamGrade(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Entrez votre note sur 20
          </p>
        </div>
        
        <div>
          <label htmlFor="difficultyRating" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulté de l'examen
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Facile</span>
            <input
              type="range"
              id="difficultyRating"
              min="1"
              max="5"
              value={difficultyRating}
              onChange={(e) => setDifficultyRating(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-500">Difficile</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">1</span>
            <span className="text-xs text-gray-500">2</span>
            <span className="text-xs text-gray-500">3</span>
            <span className="text-xs text-gray-500">4</span>
            <span className="text-xs text-gray-500">5</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="preparednessRating" className="block text-sm font-medium text-gray-700 mb-1">
            Niveau de préparation
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Pas préparé</span>
            <input
              type="range"
              id="preparednessRating"
              min="1"
              max="5"
              value={preparednessRating}
              onChange={(e) => setPreparednessRating(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-500">Très préparé</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">1</span>
            <span className="text-xs text-gray-500">2</span>
            <span className="text-xs text-gray-500">3</span>
            <span className="text-xs text-gray-500">4</span>
            <span className="text-xs text-gray-500">5</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="examFeeling" className="block text-sm font-medium text-gray-700 mb-1">
            Ressenti général après l'examen
          </label>
          <select
            id="examFeeling"
            value={examFeeling}
            onChange={(e) => setExamFeeling(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            required
          >
            <option value="">Sélectionnez votre ressenti</option>
            <option value="Très confiant">Très confiant</option>
            <option value="Plutôt confiant">Plutôt confiant</option>
            <option value="Mitigé">Mitigé</option>
            <option value="Plutôt inquiet">Plutôt inquiet</option>
            <option value="Très inquiet">Très inquiet</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="examStressLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Niveau de stress pendant l'examen
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Calme</span>
            <input
              type="range"
              id="examStressLevel"
              min="1"
              max="5"
              value={examStressLevel}
              onChange={(e) => setExamStressLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-500">Très stressé</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">1</span>
            <span className="text-xs text-gray-500">2</span>
            <span className="text-xs text-gray-500">3</span>
            <span className="text-xs text-gray-500">4</span>
            <span className="text-xs text-gray-500">5</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="examTopics" className="block text-sm font-medium text-gray-700 mb-1">
            Sujets abordés dans l'examen
          </label>
          <textarea
            id="examTopics"
            rows={3}
            value={examTopics}
            onChange={(e) => setExamTopics(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            placeholder="Listez les principaux thèmes ou questions qui sont apparus dans l'examen"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ces informations aideront à améliorer les recommandations pour les futurs étudiants
          </p>
        </div>
        
        <div>
          <label htmlFor="examFeedback" className="block text-sm font-medium text-gray-700 mb-1">
            Retour sur votre préparation
          </label>
          <textarea
            id="examFeedback"
            rows={4}
            value={examFeedback}
            onChange={(e) => setExamFeedback(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            placeholder="Comment évaluez-vous votre préparation avec HALPI ? Qu'est-ce qui a été utile ou aurait pu être amélioré ?"
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Enregistrer le feedback
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ExamFeedbackForm;
