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
  const [examDate, setExamDate] = useState('');
  const [examGradeNumerator, setExamGradeNumerator] = useState('');
  const [examGradeDenominator, setExamGradeDenominator] = useState('20');
  const [examFeedback, setExamFeedback] = useState('');
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [examFeeling, setExamFeeling] = useState(3);
  const [examStressLevel, setExamStressLevel] = useState(3);
  
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
        console.log('Courses with exam dates:', formattedData);
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
    
    if (!examGradeNumerator) {
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
          exam_grade: parseFloat(examGradeNumerator),
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
            exam_date: examDate,
            grade: parseFloat(examGradeNumerator),
            grade_denominator: parseFloat(examGradeDenominator),
            feedback: examFeedback,
            difficulty_rating: difficultyRating,
            exam_feeling: examFeeling,
            exam_stress_level: examStressLevel,
            created_at: new Date(),
          }
        ]);
      
      if (feedbackError) {
        throw feedbackError;
      }
      
      setSuccess(true);
      setSelectedCourse('');
      setExamDate('');
      setExamGradeNumerator('');
      setExamGradeDenominator('20');
      setExamFeedback('');
      setDifficultyRating(3);
      setExamFeeling(3);
      setExamStressLevel(3);
      
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
          <label htmlFor="selectedCourse" className="block text-sm font-medium text-gray-700 mb-1">
            Cours concerné
          </label>
          <select
            id="selectedCourse"
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              // Trouver la date d'examen correspondante
              const selectedCourseData = courses.find(course => course.id === e.target.value);
              if (selectedCourseData && selectedCourseData.exam_date) {
                setExamDate(selectedCourseData.exam_date);
              } else {
                setExamDate('');
              }
            }}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            required
          >
            <option value="">Sélectionnez un cours</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="examDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date de l'examen
          </label>
          <input
            type="date"
            id="examDate"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            required
          />
        </div>
        
        <div>
          <label htmlFor="examGrade" className="block text-sm font-medium text-gray-700 mb-1">
            Note obtenue
          </label>
          <div className="flex items-center">
            <div className="w-24 mr-1">
              <input
                type="number"
                id="examGradeNumerator"
                min="0"
                max="100"
                step="0.5"
                value={examGradeNumerator}
                onChange={(e) => setExamGradeNumerator(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                placeholder="Ex: 15.5"
                required
              />
            </div>
            <span className="text-sm font-medium mx-1">/</span>
            <div className="w-20">
              <select
                id="examGradeDenominator"
                value={examGradeDenominator}
                onChange={(e) => setExamGradeDenominator(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                required
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Entrez votre note et sélectionnez le barème
          </p>
        </div>
        
        <div>
          <label htmlFor="examStressLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Niveau de stress avant l'examen ressenti sur 5
          </label>
          <div className="flex justify-between w-full mt-2 mb-6">
            {[1, 2, 3, 4, 5].map((value) => (
              <div 
                key={value} 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setExamStressLevel(value)}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${value === examStressLevel ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}
                >
                  {value}
                </div>
                <span className="text-xs text-gray-500">
                  {value === 1 ? 'Très calme' : 
                   value === 2 ? 'Calme' : 
                   value === 3 ? 'Neutre' : 
                   value === 4 ? 'Stressé' : 'Très stressé'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="difficultyRating" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulté de l'examen ressentie sur 5
          </label>
          <div className="flex justify-between w-full mt-2 mb-6">
            {[1, 2, 3, 4, 5].map((value) => (
              <div 
                key={value} 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setDifficultyRating(value)}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${value === difficultyRating ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}
                >
                  {value}
                </div>
                <span className="text-xs text-gray-500">
                  {value === 1 ? 'Très facile' : 
                   value === 2 ? 'Facile' : 
                   value === 3 ? 'Moyen' : 
                   value === 4 ? 'Difficile' : 'Très difficile'}
                </span>
              </div>
            ))}
          </div>
        </div>
        

        
        <div>
          <label htmlFor="examFeeling" className="block text-sm font-medium text-gray-700 mb-1">
            Ressenti général après l'examen
          </label>
          <div className="flex justify-between w-full mt-2 mb-6">
            {[1, 2, 3, 4, 5].map((value) => (
              <div 
                key={value} 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setExamFeeling(value)}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${value === examFeeling ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}
                >
                  {value}
                </div>
                <span className="text-xs text-gray-500">
                  {value === 1 ? 'Très inquiet' : 
                   value === 2 ? 'Plutôt inquiet' : 
                   value === 3 ? 'Mitigé' : 
                   value === 4 ? 'Plutôt confiant' : 'Très confiant'}
                </span>
              </div>
            ))}
          </div>
        </div>
        

        

        
        <div>
          <label htmlFor="examFeedback" className="block text-sm font-medium text-gray-700 mb-1">
            Retour libre général
          </label>
          <textarea
            id="examFeedback"
            rows={4}
            value={examFeedback}
            onChange={(e) => setExamFeedback(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            placeholder="Partagez vos impressions générales sur l'examen et votre expérience"
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
