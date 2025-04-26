import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import AddCourseForm from '../../components/Courses/AddCourseForm';
import Button from '../../components/common/Button';
import { ArrowLeft } from 'lucide-react';

const EditCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<any>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        
        // Récupérer les données du cours
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (courseError) throw courseError;
        
        // Récupérer les données utilisateur-cours
        const { data: userCourseData, error: userCourseError } = await supabase
          .from('user_courses')
          .select('*')
          .eq('course_id', courseId)
          .single();
        
        if (userCourseError) throw userCourseError;
        
        // Combiner les données
        setCourseData({
          ...courseData,
          ...userCourseData
        });
      } catch (err: any) {
        console.error('Erreur lors de la récupération des données du cours:', err);
        setError(err.message || 'Une erreur est survenue lors de la récupération des données du cours');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement des informations du cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-6">
          {error}
        </div>
        <Button onClick={() => navigate('/courses')}>
          <ArrowLeft size={16} className="mr-2" />
          Retour aux cours
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate('/courses')} className="mr-4">
          <ArrowLeft size={16} className="mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Modifier le cours</h1>
      </div>
      
      {courseData && (
        <AddCourseForm 
          initialData={courseData}
          onSuccess={() => navigate('/courses')}
          onCancel={() => navigate('/courses')}
        />
      )}
    </div>
  );
};

export default EditCoursePage;
