import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileText, Plus, ArrowLeft, Save, Trash2, Edit2, Scissors, ExternalLink, HelpCircle, FolderOpen } from 'lucide-react';
import PdfSplitter from '../../components/Courses/PdfSplitter';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Chapter {
  id?: string;
  title: string;
  description: string;
  order_index: number;
  source_url?: string;
  file?: File;
}

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
  importance: string;
}

const CourseDetailsPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [userCourse, setUserCourse] = useState<UserCourse | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // État pour gérer l'affichage du formulaire de chapitre
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [savingChapters, setSavingChapters] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [mainCoursePdf, setMainCoursePdf] = useState<File | null>(null);
  const [showPdfSplitter, setShowPdfSplitter] = useState<boolean>(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  
  const [newChapter, setNewChapter] = useState<Chapter>({
    title: '',
    description: '',
    order_index: chapters.length,
  });

  useEffect(() => {
    if (!courseId || !user) return;
    
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les informations du cours
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (courseError) throw courseError;
        
        setCourse(courseData);
        
        // Récupérer l'association utilisateur-cours
        const { data: userCourseData, error: userCourseError } = await supabase
          .from('user_courses')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .single();
        
        if (userCourseError && userCourseError.code !== 'PGRST116') {
          throw userCourseError;
        }
        
        setUserCourse(userCourseData || null);
        
        // Récupérer les chapitres du cours
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
        
        if (chaptersError) throw chaptersError;
        
        setChapters(chaptersData || []);
        
      } catch (err: any) {
        console.error('Error fetching course data:', err);
        setError(err.message || 'Une erreur est survenue lors du chargement du cours');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, user]);

  const handleAddChapter = () => {
    setNewChapter({
      title: '',
      description: '',
      order_index: chapters.length,
    });
    setEditingChapter(null);
    setShowChapterForm(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setNewChapter({ ...chapter });
    setShowChapterForm(true);
  };

  const handleChapterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewChapter(prev => ({ ...prev, [name]: value }));
  };

  const handleChapterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewChapter(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleMainPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Vérifier que c'est bien un PDF
      if (file.type === 'application/pdf') {
        setMainCoursePdf(file);
      } else {
        setError('Veuillez sélectionner un fichier PDF');
      }
    }
  };
  
  // Fonction pour gérer le drop de plusieurs fichiers PDF (chapitres découpés)
  const handleMultipleChaptersDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    setUploadingFile(true);
    setError(null);
    
    try {
      const files = Array.from(e.dataTransfer.files);
      const pdfFiles = files.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length === 0) {
        setError('Aucun fichier PDF détecté. Veuillez déposer uniquement des fichiers PDF.');
        return;
      }
      
      // Trier les fichiers par nom (pour respecter l'ordre des chapitres)
      pdfFiles.sort((a, b) => a.name.localeCompare(b.name));
      
      let successCount = 0;
      
      // Traiter chaque fichier PDF comme un chapitre
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        
        // Générer un titre de chapitre basé sur le nom du fichier
        const fileName = file.name.replace('.pdf', '');
        const chapterTitle = fileName.replace(/[_-]/g, ' ').trim();
        
        // Créer un nouveau chapitre
        const newChapterData = {
          title: chapterTitle,
          description: '',
          order_index: chapters.length + i,
          course_id: courseId,
          file: file
        };
        
        // Uploader le fichier
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const filePath = `${user?.id}/${courseId}/${timestamp}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chapters')
          .upload(filePath, file);
        
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }
        
        // Récupérer l'URL du fichier
        const { data: urlData } = supabase.storage
          .from('chapters')
          .getPublicUrl(filePath);
        
        const sourceUrl = urlData.publicUrl;
        
        // Insérer le chapitre dans la base de données
        const { data: chapterData, error: insertError } = await supabase
          .from('chapters')
          .insert({
            title: newChapterData.title,
            description: newChapterData.description,
            order_index: newChapterData.order_index,
            course_id: courseId,
            source_url: sourceUrl
          })
          .select();
        
        if (insertError) {
          console.error('Error inserting chapter:', insertError);
          continue;
        }
        
        successCount++;
      }
      
      // Mettre à jour la liste des chapitres
      const { data: updatedChapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
      
      if (chaptersError) throw chaptersError;
      
      setChapters(updatedChapters || []);
      
      if (successCount > 0) {
        setError(`${successCount} chapitre(s) importé(s) avec succès !`);
      } else {
        setError('Aucun chapitre n\'a pu être importé. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Error processing dropped files:', err);
      setError(err.message || 'Une erreur est survenue lors du traitement des fichiers');
    } finally {
      setUploadingFile(false);
    }
  };
  
  // Fonction pour empêcher le comportement par défaut du navigateur lors du drag & drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSaveChapter = async () => {
    if (!courseId || !user) return;
    
    try {
      setUploadingFile(true);
      
      // Validation
      if (!newChapter.title.trim()) {
        throw new Error('Le titre du chapitre est requis');
      }
      
      let source_url = newChapter.source_url;
      
      // Si un fichier est sélectionné, le télécharger
      if (newChapter.file) {
        const fileName = `${user.id}/${courseId}/${Date.now()}_${newChapter.file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chapter_files')
          .upload(fileName, newChapter.file);
        
        if (uploadError) throw uploadError;
        
        // Obtenir l'URL publique du fichier
        const { data: publicUrlData } = supabase.storage
          .from('chapter_files')
          .getPublicUrl(fileName);
        
        source_url = publicUrlData.publicUrl;
      }
      
      // Créer ou mettre à jour le chapitre
      if (editingChapter?.id) {
        // Mise à jour d'un chapitre existant
        const { error: updateError } = await supabase
          .from('chapters')
          .update({
            title: newChapter.title,
            description: newChapter.description,
            source_url,
          })
          .eq('id', editingChapter.id);
        
        if (updateError) throw updateError;
        
        // Mettre à jour le chapitre dans l'état local
        setChapters(prev => prev.map(ch => 
          ch.id === editingChapter.id 
            ? { ...ch, title: newChapter.title, description: newChapter.description, source_url } 
            : ch
        ));
      } else {
        // Création d'un nouveau chapitre
        const { data: newChapterData, error: insertError } = await supabase
          .from('chapters')
          .insert({
            course_id: courseId,
            title: newChapter.title,
            description: newChapter.description,
            order_index: newChapter.order_index,
            source_url,
            chapter_type: 'savoir',
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Ajouter le nouveau chapitre à l'état local
        setChapters(prev => [...prev, newChapterData]);
      }
      
      // Réinitialiser le formulaire
      setNewChapter({
        title: '',
        description: '',
        order_index: chapters.length + 1,
      });
      setEditingChapter(null);
      setShowChapterForm(false);
      
    } catch (err: any) {
      console.error('Error saving chapter:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement du chapitre');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chapitre ?')) return;
    
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);
      
      if (error) throw error;
      
      // Mettre à jour l'état local
      setChapters(prev => prev.filter(ch => ch.id !== chapterId));
      
    } catch (err: any) {
      console.error('Error deleting chapter:', err);
      setError(err.message || 'Une erreur est survenue lors de la suppression du chapitre');
    }
  };

  const handleSaveChaptersOrder = async () => {
    try {
      setSavingChapters(true);
      
      // Mettre à jour l'ordre des chapitres
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        
        if (chapter.id) {
          const { error } = await supabase
            .from('chapters')
            .update({ order_index: i })
            .eq('id', chapter.id);
          
          if (error) throw error;
        }
      }
      
    } catch (err: any) {
      console.error('Error saving chapters order:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement de l\'ordre des chapitres');
    } finally {
      setSavingChapters(false);
    }
  };

  const handleProcessMainPdf = async () => {
    if (!mainCoursePdf || !courseId) return;
    
    try {
      setUploadingFile(true);
      
      // Télécharger le fichier PDF principal
      // Nettoyer le nom du fichier pour éviter les problèmes d'URL
      const cleanFileName = mainCoursePdf.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `main_${Date.now()}_${cleanFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-files')
        .upload(fileName, mainCoursePdf, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Obtenir l'URL publique du fichier
      const { data: publicUrlData } = supabase.storage
        .from('course-files')
        .getPublicUrl(fileName);
      
      const mainPdfUrl = publicUrlData.publicUrl;
      
      // Dans une implémentation réelle, vous pourriez appeler une fonction backend
      // pour traiter le PDF et extraire automatiquement les chapitres
      
      // Pour l'instant, créons simplement un chapitre pour le PDF complet
      const { data: newChapterData, error: insertError } = await supabase
        .from('chapters')
        .insert({
          course_id: courseId,
          title: 'Cours complet',
          description: 'Document PDF du cours complet',
          order_index: 0,
          source_url: mainPdfUrl,
          chapter_type: 'savoir',
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Ajouter le nouveau chapitre à l'état local
      setChapters(prev => [newChapterData, ...prev]);
      
      // Réinitialiser
      setMainCoursePdf(null);
      
    } catch (err: any) {
      console.error('Error processing main PDF:', err);
      setError(err.message || 'Une erreur est survenue lors du traitement du PDF');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
        <div className="mt-4">
          <Button onClick={() => navigate('/courses')}>
            <ArrowLeft size={16} className="mr-2" />
            Retour aux cours
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cours non trouvé</h3>
          <p className="text-gray-600 mb-6">Le cours que vous recherchez n'existe pas ou vous n'y avez pas accès.</p>
          <Button onClick={() => navigate('/courses')}>
            <ArrowLeft size={16} className="mr-2" />
            Retour aux cours
          </Button>
        </div>
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
        <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
      </div>
      
      {/* Informations du cours */}
      <Card className="mb-8 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={course.image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                alt={course.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          
          <div className="md:w-2/3">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{course.name}</h2>
            <p className="text-gray-600 mb-4">{course.description}</p>
            
            {userCourse && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Date de l'examen</p>
                  <p className="font-medium">
                    {userCourse.exam_date 
                      ? new Date(userCourse.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : "Pas de date d'examen fixée"}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Difficulté estimée</p>
                  <p className="font-medium">
                    {userCourse.difficulty === 'inconnu' 
                      ? "Non définie"
                      : <span className="capitalize">{userCourse.difficulty}</span>}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Temps d'étude estimé</p>
                  <p className="font-medium">
                    {userCourse.estimated_time 
                      ? `${userCourse.estimated_time} heures ou plus`
                      : "Non défini"}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Chapitres</p>
                  <p className="font-medium">{chapters.length} chapitres</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Importance (coefficient/crédits)</p>
                  <p className="font-medium">
                    {!userCourse.importance || userCourse.importance === 'inconnu'
                      ? "Non définie"
                      : userCourse.importance === 'eleve'
                        ? "Élevée"
                        : userCourse.importance === 'faible'
                          ? "Faible"
                          : "Moyenne"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* Gestion des chapitres */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Chapitres du cours</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveChaptersOrder} disabled={savingChapters}>
              <Save size={16} className="mr-2" />
              Enregistrer l'ordre
            </Button>
            <Button onClick={handleAddChapter}>
              <Plus size={16} className="mr-2" />
              Ajouter un chapitre
            </Button>
          </div>
        </div>
        
        {/* Upload du PDF principal */}
        <Card className="mb-6 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Télécharger le document PDF du cours complet</h3>
          <p className="text-gray-600 mb-4">
            Vous pouvez télécharger le document PDF de votre cours complet. 
            HALPI vous permettra ensuite de le découper en chapitres.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-grow">
              <label className="block w-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 block mb-1">
                  {mainCoursePdf ? mainCoursePdf.name : 'Cliquez pour sélectionner un fichier PDF'}
                </span>
                <span className="text-xs text-gray-500">PDF uniquement, max 20MB</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleMainPdfChange}
                />
              </label>
            </div>
            
            <Button 
              onClick={handleProcessMainPdf} 
              disabled={!mainCoursePdf || uploadingFile}
              className="whitespace-nowrap"
            >
              {uploadingFile ? 'Téléchargement...' : 'Télécharger le PDF'}
            </Button>
          </div>
        </Card>
        
        {/* Formulaire d'ajout/édition de chapitre */}
        {showChapterForm && (
          <Card className="mb-6 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingChapter ? 'Modifier le chapitre' : 'Ajouter un chapitre'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-base font-medium text-gray-800 mb-2">
                  Titre du chapitre
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newChapter.title}
                  onChange={handleChapterInputChange}
                  className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-base font-medium text-gray-800 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newChapter.description}
                  onChange={handleChapterInputChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-base font-medium text-gray-800 mb-2">
                  Document du chapitre (PDF)
                </label>
                <label className="block w-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 block mb-1">
                    {newChapter.file 
                      ? newChapter.file.name 
                      : newChapter.source_url 
                        ? 'Fichier déjà téléchargé' 
                        : 'Cliquez pour sélectionner un fichier PDF'}
                  </span>
                  <span className="text-xs text-gray-500">PDF uniquement, max 10MB</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleChapterFileChange}
                  />
                </label>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowChapterForm(false);
                    setEditingChapter(null);
                  }}
                  disabled={uploadingFile}
                >
                  Annuler
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveChapter}
                  disabled={uploadingFile}
                >
                  {uploadingFile 
                    ? 'Enregistrement...' 
                    : editingChapter 
                      ? 'Mettre à jour' 
                      : 'Ajouter le chapitre'}
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        {/* Guide de découpage de syllabus */}
        {chapters.length === 0 && !showPdfSplitter && (
          <Card className="p-6 mb-6 border-l-4 border-blue-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <Scissors className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  Découpez votre syllabus en chapitres
                  <HelpCircle size={16} className="ml-2 text-gray-400" />
                </h3>
                
                <p className="text-gray-700 mb-4">
                  Pour suivre efficacement les activités d'apprentissage proposées par HALPI, il est essentiel de découper votre syllabus en chapitres individuels.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium text-blue-700 mb-2">Comment procéder :</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Téléchargez un ou plusieurs fichiers PDF de votre syllabus</li>
                    <li>Marquez les points de découpage entre les pages</li>
                    <li>Créez automatiquement tous vos chapitres</li>
                  </ol>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => setShowPdfSplitter(true)}
                    className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Scissors size={16} className="mr-2" />
                    Découper mon syllabus maintenant
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddChapter}
                    className="inline-flex items-center"
                  >
                    <FolderOpen size={16} className="mr-2" />
                    Ajouter mes chapitres manuellement
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Outil de découpage PDF intégré */}
        {showPdfSplitter && (
          <div className="mb-6">
            <PdfSplitter 
              courseId={courseId || ''}
              userId={user?.id || ''}
              existingPdfs={[]}
              onSplitComplete={(chapterCount) => {
                setShowPdfSplitter(false);
                fetchCourseData();
                setError(`${chapterCount} chapitres ont été créés avec succès !`);
              }}
              onCancel={() => setShowPdfSplitter(false)}
            />
          </div>
        )}
        

        
        {/* Liste des chapitres */}
        {chapters.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun chapitre</h3>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore ajouté de chapitres à ce cours.</p>
            <Button onClick={handleAddChapter}>Ajouter mon premier chapitre</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <Card key={chapter.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center mr-4">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                      {chapter.description && (
                        <p className="text-sm text-gray-600">{chapter.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {chapter.source_url && (
                      <a 
                        href={chapter.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                      >
                        <FileText size={16} className="mr-1" />
                        Voir le PDF
                      </a>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditChapter(chapter)}
                      className="p-1"
                    >
                      <Edit2 size={16} className="text-primary-600" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => chapter.id && handleDeleteChapter(chapter.id)}
                      className="p-1"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage;
