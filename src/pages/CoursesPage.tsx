import { useState } from 'react';
import CourseList from '../components/Courses/CourseList';
import AddCourseForm from '../components/Courses/AddCourseForm';



const CoursesPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);

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
