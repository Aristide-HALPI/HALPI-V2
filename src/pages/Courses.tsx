import { useState, useEffect } from 'react';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChaptersModal } from '../components/ChaptersModal';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { createLearningPath } from '../utils/createLearningPath';

interface Course {
  id: string;
  title: string;
  userId: string;
  pdfUrl: string;
  createdAt: string;
}

export function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChaptersModalOpen, setIsChaptersModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'courses'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Course));
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !newCourseTitle) return;
    
    setIsUploading(true);
    try {
      const fileRef = ref(storage, `courses/${user.uid}/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const pdfUrl = await getDownloadURL(fileRef);

      const courseData = {
        title: newCourseTitle,
        userId: user.uid,
        pdfUrl,
        createdAt: new Date().toISOString()
      };

      const courseDoc = await addDoc(collection(db, 'courses'), courseData);
      await createLearningPath(courseDoc.id, user.uid, []);

      setNewCourseTitle('');
      setSelectedFile(null);
      setIsModalOpen(false);
      loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!user) return;

    // Ask for confirmation before deleting
    const isConfirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le cours "${course.title}" ? Cette action est irréversible.`);
    
    if (!isConfirmed) return;

    try {
      // First, verify the course exists and check permissions
      const courseRef = doc(db, 'courses', course.id);
      const courseDoc = await getDoc(courseRef);
      
      if (!courseDoc.exists()) {
        console.error('Course not found');
        return;
      }

      const courseData = courseDoc.data();
      if (courseData.userId !== user.uid) {
        console.error('You do not have permission to delete this course');
        return;
      }

      // Delete associated learning paths first
      const pathsQuery = query(
        collection(db, 'learningPaths'),
        where('courseId', '==', course.id),
        where('userId', '==', user.uid)
      );
      const pathsSnapshot = await getDocs(pathsQuery);
      for (const pathDoc of pathsSnapshot.docs) {
        try {
          await deleteDoc(pathDoc.ref);
        } catch (error) {
          console.error('Error deleting learning path:', error);
          // Continue with other deletions
        }
      }

      // Try to delete the file from Storage if it exists
      if (course.pdfUrl) {
        try {
          const fileRef = ref(storage, course.pdfUrl);
          await deleteObject(fileRef);
        } catch (error) {
          // Ignore file not found errors
          if ((error as any)?.code !== 'storage/object-not-found') {
            console.error('Error deleting file:', error);
          }
        }
      }

      // Finally delete the course
      await deleteDoc(courseRef);
      
      // Reload the courses list
      loadCourses();
    } catch (error: any) {
      if (error?.code === 'permission-denied') {
        console.error('Permission denied to delete this course');
      } else {
        console.error('Error during course deletion:', error);
      }
    }
  };

  const handleEditTitle = async (courseId: string, newTitle: string) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        title: newTitle
      });
      
      // Update learning path title
      const pathsQuery = query(
        collection(db, 'learningPaths'),
        where('courseId', '==', courseId),
        where('userId', '==', user.uid)
      );
      const pathsSnapshot = await getDocs(pathsQuery);
      const updatePathPromises = pathsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, { courseTitle: newTitle })
      );
      await Promise.all(updatePathPromises);

      loadCourses();
      setEditingCourseId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating course title:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-blue">Mes cours</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          Déposer un cours
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Vous n'avez pas encore de cours. Commencez par déposer un cours.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-sm p-6 group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingCourseId(course.id);
                    setEditingTitle(course.title);
                  }}
                  className="p-1 text-gray-500 hover:text-gold transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCourse(course)}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {editingCourseId === course.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-gold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEditTitle(course.id, editingTitle);
                      } else if (e.key === 'Escape') {
                        setEditingCourseId(null);
                        setEditingTitle('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleEditTitle(course.id, editingTitle)}
                    className="px-2 py-1 text-sm bg-gold text-white rounded hover:bg-gold/90"
                  >
                    Sauvegarder
                  </button>
                </div>
              ) : (
                <h3 className="text-lg font-semibold mb-4">{course.title}</h3>
              )}

              <button 
                onClick={() => {
                  setSelectedCourse(course);
                  setIsChaptersModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Gérer les chapitres
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour créer un nouveau cours */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Nouveau cours</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du cours
                </label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syllabus (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="w-full"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Création...' : 'Créer le cours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestion des chapitres */}
      {selectedCourse && (
        <ChaptersModal
          isOpen={isChaptersModalOpen}
          onClose={() => {
            setIsChaptersModalOpen(false);
            setSelectedCourse(null);
          }}
          courseTitle={selectedCourse.title}
          courseId={selectedCourse.id}
        />
      )}
    </div>
  );
}