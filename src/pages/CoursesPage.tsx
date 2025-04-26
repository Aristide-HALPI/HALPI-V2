import { useState, useRef, useEffect } from 'react';
import { usePageVisibility } from '../hooks/usePageVisibility';
import CourseList from '../components/Courses/CourseList';
import AddCourseForm from '../components/Courses/AddCourseForm';



const CoursesPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const { isVisible } = usePageVisibility();
  
  // Référence pour stabiliser l'état entre les changements d'onglet
  const stateRef = useRef<{ showAddForm: boolean }>({ showAddForm });
  
  // Mettre à jour la référence quand l'état change
  useEffect(() => {
    stateRef.current.showAddForm = showAddForm;
  }, [showAddForm]);
  
  // Restaurer l'état quand la page redevient visible
  useEffect(() => {
    if (isVisible) {
      setShowAddForm(stateRef.current.showAddForm);
    }
  }, [isVisible]);

  return (
    <div className="container mx-auto px-4 py-8">
      {showAddForm ? (
        <AddCourseForm 
          onSuccess={() => setShowAddForm(false)} 
          onCancel={() => setShowAddForm(false)} 
        />
      ) : (
        <CourseList onAddCourse={() => setShowAddForm(true)} />
      )}
    </div>
  );
};

export default CoursesPage;
