import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/api';
import { 
  Upload, 
  FileText, 
  Plus, 
  ArrowLeft, 
  Save, 
  Trash2, 
  Edit2, 
  Loader2, 
  X,
  BookOpen,
  ClipboardList,
  FileCheck,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

// Déclaration de type pour JSZip qui sera chargé dynamiquement
declare global {
  interface Window {
    JSZip: any;
  }
}

// Approche alternative pour gérer la sélection de dossier sans utiliser webkitdirectory
// import PdfSplitter from '../../components/Courses/PdfSplitter'; // Désactivé dans la nouvelle approche
import PdfSplitterMinimal, { ContentType } from '../../components/Courses/PdfSplitterMinimal';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Chapter {
  id?: string;
  title: string;
  description: string;
  order_index: number;
  source_url?: string;
  file?: File;
  is_introduction?: boolean;
  is_conclusion?: boolean;
  json_data?: any; // Contenu extrait du chapitre au format JSON
  chapter_type?: string; // Type de chapitre (savoir, exercice, etc.)
  content_type?: ContentType; // Type de contenu (course, exercise, exam)
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
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, message: '' });
  // État pour suivre les chapitres en cours de déplacement
  const [movingChapter, setMovingChapter] = useState<string | null>(null);
  // État pour suivre le chapitre qui vient d'être déplacé (pour l'animation)
  const [lastMovedChapter, setLastMovedChapter] = useState<string | null>(null);
  // Référence pour empêcher le défilement de la page
  const preventScrollRef = useRef<boolean>(false);
  // État supprimé car nous n'utilisons plus le workflow spécifique aux cours
  // const [mainCoursePdf, setMainCoursePdf] = useState<File | null>(null);
  // const [showPdfSplitter, setShowPdfSplitter] = useState<boolean>(false); // Désactivé dans la nouvelle approche
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('course');
  const [fileFilter, setFileFilter] = useState<'all' | ContentType>('all');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    url: string;
    content_type: ContentType;
    size: number;
    created_at: string;
  }>>([]);
  
  const [newChapter, setNewChapter] = useState<Chapter>({
    title: '',
    description: '',
    order_index: chapters.length,
  });

  // Fonction pour charger les fichiers téléchargés depuis Supabase
  const fetchUploadedFiles = async () => {
    console.log('Fetching uploaded files for course:', courseId);
    if (!courseId) return;
    
    // Forcer un petit délai pour s'assurer que les opérations précédentes sont terminées
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Récupérer la liste des fichiers supprimés depuis localStorage
      const deletedFiles = getDeletedFiles(courseId);
      console.log('Fichiers précédemment supprimés:', deletedFiles);
      
      // Récupérer les fichiers du bucket course-files pour ce cours
      const { data: files, error } = await supabase
        .storage
        .from('course-files')
        .list(`${courseId}`, {
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      // Récupérer également les fichiers du bucket chapters pour filtrer
      const { data: chapterFiles } = await supabase
        .storage
        .from('chapters')
        .list(`${courseId}`);
      
      // Créer un ensemble des noms de fichiers de chapitres pour filtrage rapide
      const chapterFileNames = new Set();
      chapterFiles?.forEach(file => {
        // Extraire le nom du fichier sans le timestamp
        const parts = file.name.split('_');
        if (parts.length > 1) {
          // Prendre tout sauf la première partie (timestamp)
          const originalName = parts.slice(1).join('_');
          chapterFileNames.add(originalName);
        } else {
          chapterFileNames.add(file.name);
        }
      });
      
      console.log('Fichiers de chapitres déjà uploadés:', Array.from(chapterFileNames));
      
      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
      
      console.log('Files found:', files);
      if (files && files.length > 0) {
        // Filtrer les fichiers qui ont été supprimés précédemment
        // ET ceux qui sont déjà dans le bucket chapters
        const filteredFiles = files.filter(file => {
          // Vérifier si le fichier n'est pas dans la liste des fichiers supprimés
          const notDeleted = !deletedFiles.includes(file.name);
          // Vérifier si le fichier n'est pas déjà dans le bucket chapters
          const notInChapters = !chapterFileNames.has(file.name);
          return notDeleted && notInChapters;
        });
        console.log('Files after filtering deleted ones:', filteredFiles);
        
        if (filteredFiles.length === 0) {
          console.log('Tous les fichiers ont été supprimés');
          setUploadedFiles([]);
          return;
        }
        
        // Récupérer les chapitres pour associer les fichiers aux bons types de contenu
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('source_url, content_type')
          .eq('course_id', courseId);
        
        // Créer une map des URLs vers les types de contenu
        const contentTypeMap = new Map();
        chaptersData?.forEach(chapter => {
          if (chapter.source_url) {
            // Extraire le nom du fichier de l'URL
            const fileName = chapter.source_url.split('/').pop();
            if (fileName) {
              contentTypeMap.set(fileName, chapter.content_type || 'course');
            }
          }
        });
        
        // Récupérer les URLs publiques pour chaque fichier
        const filesWithUrls = await Promise.all(filteredFiles.map(async (file) => {
          try {
            const { data: url } = supabase
              .storage
              .from('course-files')
              .getPublicUrl(`${courseId}/${file.name}`);
            
            // Vérification supplémentaire : essayer d'accéder au fichier pour confirmer qu'il existe
            // Cette approche est plus fiable que createSignedUrl
            try {
              const response = await fetch(url.publicUrl, { method: 'HEAD' });
              if (!response.ok) {
                console.log(`Le fichier ${file.name} n'est pas accessible (statut HTTP: ${response.status})`);
                return null;
              }
            } catch (fetchError) {
              console.error(`Erreur lors de la vérification du fichier ${file.name}:`, fetchError);
              return null;
            }
            
            // Déterminer le type de contenu en fonction de la map ou du nom du fichier
            let contentType: ContentType = 'course';
            
            // Vérifier d'abord dans la map des chapitres
            if (contentTypeMap.has(file.name)) {
              contentType = contentTypeMap.get(file.name) as ContentType;
            } else {
              // Sinon, déterminer par le nom du fichier
              const fileName = file.name.toLowerCase();
              if (fileName.includes('exercice') || fileName.includes('exercise')) {
                contentType = 'exercise';
              } else if (fileName.includes('exam')) {
                contentType = 'exam';
              }
            }
            
            return {
              name: file.name,
              url: url.publicUrl,
              content_type: contentType,
              size: file.metadata?.size || 0,
              created_at: file.created_at || new Date().toISOString()
            };
          } catch (error) {
            console.error(`Erreur lors du traitement du fichier ${file.name}:`, error);
            return null;
          }
        }));
        
        // Filtrer les fichiers nuls (ceux qui n'existent pas)
        const validFiles = filesWithUrls.filter((file): file is {
          name: string;
          url: string;
          content_type: ContentType;
          size: number;
          created_at: string;
        } => file !== null);
        
        setUploadedFiles(validFiles);
        console.log('Files with URLs:', validFiles);
      } else {
        console.log('No files found for this course');
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
    }
  };

  const fetchChapters = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true }); // Utiliser l'ordre d'upload (created_at)
      
      if (error) throw error;
      
      // Tri des chapitres pour s'assurer que l'ordre est correct
      const sortedChapters = data ? [...data].sort((a, b) => {
        // Cours complet toujours en premier (chapitre 0)
        if (a.title.toLowerCase().includes('complet')) return -1;
        if (b.title.toLowerCase().includes('complet')) return 1;
        
        // Introduction juste après le cours complet
        if (a.is_introduction) return -1;
        if (b.is_introduction) return 1;
        
        // Conclusion toujours en dernier
        if (a.is_conclusion) return 1;
        if (b.is_conclusion) return -1;
        
        // Sinon, conserver l'ordre d'upload (déjà trié par created_at)
        return 0;
      }) : [];
      
      setChapters(sortedChapters);
    } catch (err) {
      console.error('Error fetching chapters:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les informations du cours
  const fetchCourse = async () => {
    if (!courseId || !user) return;
    
    try {
      setLoading(true);
      
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
      
    } catch (err: any) {
      console.error('Error fetching course data:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement du cours');
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour gérer les fichiers supprimés dans localStorage
  const getDeletedFiles = (courseId: string) => {
    try {
      const deletedFilesJson = localStorage.getItem(`deleted_files_${courseId}`);
      return deletedFilesJson ? JSON.parse(deletedFilesJson) : [];
    } catch (e) {
      console.error('Erreur lors de la récupération des fichiers supprimés:', e);
      return [];
    }
  };

  const addDeletedFile = (courseId: string, fileName: string) => {
    try {
      const deletedFiles = getDeletedFiles(courseId);
      if (!deletedFiles.includes(fileName)) {
        deletedFiles.push(fileName);
        localStorage.setItem(`deleted_files_${courseId}`, JSON.stringify(deletedFiles));
      }
    } catch (e) {
      console.error('Erreur lors de l\'ajout d\'un fichier supprimé:', e);
    }
  };

  useEffect(() => {
    if (courseId && user) {
      fetchCourse();
      fetchChapters();
      fetchUploadedFiles();
    }
  }, [courseId, user]);

  // Ouvre le formulaire d'ajout manuel de chapitre
  const handleAddChapter = () => {
    setNewChapter({
      title: '',
      description: '',
      order_index: chapters.length,
    });
    setEditingChapter(null);
    setShowChapterForm(true);
  };
  
  // Ouvre le sélecteur de fichiers natif pour les PDFs
  const handleOpenFileSelector = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.multiple = true;
    fileInput.addEventListener('change', (e: any) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUploadChapterFiles(e.target.files);
      }
    });
    fileInput.click();
  };
  
  // Ouvre le sélecteur de fichiers multiple pour simuler la sélection de dossier
  const handleOpenFolderSelector = () => {
    const folderInput = document.createElement('input');
    folderInput.type = 'file';
    folderInput.multiple = true;
    folderInput.accept = '.pdf';
    
    // Utiliser setAttribute pour webkitdirectory car TypeScript ne reconnaît pas cette propriété
    folderInput.setAttribute('webkitdirectory', '');
    folderInput.setAttribute('directory', '');
    
    folderInput.addEventListener('change', (e: any) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUploadChapterFiles(e.target.files);
      }
    });
    folderInput.click();
  };
  
  // Ouvre le sélecteur de fichier pour les ZIPs et extrait les PDFs
  const handleOpenZipSelector = () => {
    const zipInput = document.createElement('input');
    zipInput.type = 'file';
    zipInput.accept = '.zip';
    zipInput.addEventListener('change', async (e: any) => {
      if (e.target.files && e.target.files.length > 0) {
        const zipFile = e.target.files[0];
        try {
          setUploadingFile(true);
          setError(null);
          
          // Vérifier que JSZip est disponible
          if (typeof window.JSZip === 'undefined') {
            // Si JSZip n'est pas disponible, charger dynamiquement le script
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
              script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
              script.crossOrigin = 'anonymous';
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('Impossible de charger JSZip'));
              document.head.appendChild(script);
            });
          }
          
          // Créer une instance JSZip
          const zip = new window.JSZip();
          
          // Lire le contenu du ZIP
          const zipContent = await zip.loadAsync(zipFile);
          
          // Extraire tous les fichiers PDF du ZIP
          const pdfFiles: File[] = [];
          const zipEntries = Object.keys(zipContent.files);
          
          for (const filename of zipEntries) {
            const zipEntry = zipContent.files[filename];
            
            // Ignorer les dossiers et les fichiers non-PDF
            if (zipEntry.dir || !filename.toLowerCase().endsWith('.pdf')) {
              continue;
            }
            
            // Extraire le contenu binaire du fichier
            const content = await zipEntry.async('blob');
            
            // Créer un objet File à partir du contenu
            const file = new File([content], filename.split('/').pop() || filename, { 
              type: 'application/pdf' 
            });
            
            pdfFiles.push(file);
          }
          
          if (pdfFiles.length === 0) {
            setError('Aucun fichier PDF trouvé dans l\'archive ZIP. Veuillez vérifier le contenu de votre archive.');
            setUploadingFile(false);
            return;
          }
          
          // Traiter les fichiers PDF extraits
          await handleUploadChapterFiles(pdfFiles as unknown as FileList);
          
        } catch (err: any) {
          console.error('Erreur lors de l\'extraction du ZIP:', err);
          setError(err.message || 'Une erreur est survenue lors de l\'extraction du ZIP');
          setUploadingFile(false);
        }
      }
    });
    zipInput.click();
  };
  
  // Gère l'upload des fichiers de cours, exercices et examens (étape 0)
  const handleUploadCourseFiles = async (files: FileList) => {
    if (!courseId) return;
    
    setUploadingFile(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length, message: 'Préparation des fichiers...' });
    console.log('Uploading course files, count:', files.length);
    
    try {
      // Accepter tous les types de fichiers supportés
      const supportedTypes = [
        'application/pdf',                                                // PDF
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/msword',                                             // DOC
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
        'application/vnd.ms-powerpoint',                                  // PPT
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel'                                         // XLS
      ];
      
      // Vérifier si le type MIME est supporté ou si l'extension est supportée
      const isSupported = (file: File) => {
        if (supportedTypes.includes(file.type)) return true;
        
        // Vérifier l'extension si le type MIME n'est pas reconnu
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        return ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension);
      };
      
      const validFiles = Array.from(files).filter(isSupported);
      
      if (validFiles.length === 0) {
        setError('Aucun fichier supporté détecté. Formats acceptés : PDF, Word, PowerPoint, Excel.');
        setUploadingFile(false);
        return;
      }
      
      let successCount = 0;
      
      // Traiter chaque fichier
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Mettre à jour la progression
        setUploadProgress({
          current: i + 1,
          total: validFiles.length,
          message: `Chargement du fichier ${i + 1}/${validFiles.length} : ${file.name}`
        });
        
        // Télécharger le fichier avec un chemin plus simple
        const timestamp = Date.now();
        const storagePath = `${courseId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('course-files')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (uploadError) throw uploadError;
          
          // Obtenir l'URL publique
          const { data: urlData } = supabase.storage
            .from('course-files')
            .getPublicUrl(storagePath);
          
          const source_url = urlData?.publicUrl;
          
          // Ajouter le fichier à l'état local des fichiers uploadés
          setUploadedFiles(prev => [
            ...prev,
            {
              name: file.name,
              url: source_url,
              content_type: contentType,
              size: file.size,
              created_at: new Date().toISOString()
            }
          ]);
          
          successCount++;
        } catch (err: any) {
          console.error(`Erreur lors de l'upload du fichier ${file.name}:`, err);
          setUploadProgress(prev => ({
            ...prev,
            message: `Erreur lors du chargement de ${file.name}. Passage au fichier suivant...`
          }));
          // Attendre un peu pour que l'utilisateur puisse voir le message d'erreur
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      
      // Afficher un message de succès final
      if (successCount > 0) {
        setUploadProgress({
          current: validFiles.length,
          total: validFiles.length,
          message: `Import terminé ! ${successCount} fichier(s) importé(s) avec succès.`
        });
        
        // Rafraîchir la liste des fichiers uploadés
        await fetchUploadedFiles();
        
        // Attendre 3 secondes avant de réinitialiser la progression
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        setError('Aucun fichier n\'a pu être importé. Veuillez réessayer.');
      }
      
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'importation des fichiers');
    } finally {
      setUploadingFile(false);
      setUploadProgress({ current: 0, total: 0, message: '' });
    }
  };
  
  // Gère l'upload des fichiers de chapitres (étape 1)
  const handleUploadChapterFiles = async (files: FileList) => {
    if (!courseId) return;
    
    // Vérifier l'authentification de l'utilisateur
    console.log('User auth status:', user ? 'Authentifié' : 'Non authentifié');
    console.log('User ID:', user?.id);
    
    setUploadingFile(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length, message: 'Préparation des fichiers...' });
    console.log('Uploading chapter files, count:', files.length);
    
    try {
      // Accepter tous les types de fichiers supportés
      const supportedTypes = [
        'application/pdf',                                                // PDF
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/msword',                                             // DOC
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
        'application/vnd.ms-powerpoint',                                  // PPT
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel'                                         // XLS
      ];
      
      // Vérifier si le type MIME est supporté ou si l'extension est supportée
      const isSupported = (file: File) => {
        if (supportedTypes.includes(file.type)) return true;
        
        // Vérifier l'extension si le type MIME n'est pas reconnu
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        return ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension);
      };
      
      const validFiles = Array.from(files).filter(isSupported);
      
      if (validFiles.length === 0) {
        setError('Aucun fichier supporté détecté. Formats acceptés : PDF, Word, PowerPoint, Excel.');
        setUploadingFile(false);
        return;
      }
      
      // Trier les fichiers par nom et numéro de chapitre (extraction numérique)
      validFiles.sort((a, b) => {
        // Extraire le préfixe alphabétique (ex: "psycho" dans "psycho 1")
        const prefixA = a.name.match(/^[a-zA-Z]+/)?.[0] || '';
        const prefixB = b.name.match(/^[a-zA-Z]+/)?.[0] || '';
        
        // Si les préfixes sont différents, on garde l'ordre alphabétique
        if (prefixA !== prefixB) {
          return prefixA.localeCompare(prefixB);
        }
        
        // Extraire les numéros des noms de fichiers
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        
        // Trier par numéro pour les fichiers avec le même préfixe
        return numA - numB;
      });
      
      let successCount = 0;
      
      // Traiter chaque fichier comme un chapitre
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Mettre à jour la progression
        setUploadProgress({
          current: i + 1,
          total: validFiles.length,
          message: `Chargement du fichier ${i + 1}/${validFiles.length} : ${file.name}`
        });
        
        // Générer un titre de chapitre basé sur le nom du cours et l'index
        // Format: [Nom du cours] - Chapitre [Numéro]
        // Utiliser l'ordre d'upload pour déterminer le numéro de chapitre
        const title = course?.name ? `${course.name} - Chapitre ${i + 1}` : `Chapitre ${i + 1}`;
        
        // Télécharger le fichier avec un chemin plus simple
        const timestamp = Date.now();
        const storagePath = `${courseId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        try {
          const { error: uploadError } = await supabase.storage
  .from('chapters')
  .upload(storagePath, file, {
    cacheControl: '3600',
    upsert: true
  });
          
          if (uploadError) throw uploadError;
        } catch (err: any) {
          console.error(`Erreur lors de l'upload du fichier ${file.name}:`, err);
          setUploadProgress(prev => ({
            ...prev,
            message: `Erreur lors du chargement de ${file.name}. Passage au fichier suivant...`
          }));
          // Attendre un peu pour que l'utilisateur puisse voir le message d'erreur
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Obtenir l'URL publique
        console.log(`Récupération de l'URL publique pour ${storagePath} depuis le bucket 'chapters'`);
        const { data: urlData } = supabase.storage
          .from('chapters')
          .getPublicUrl(storagePath);
        
        const source_url = urlData?.publicUrl;
        console.log(`URL publique obtenue: ${source_url}`);
        
        // Créer l'entrée de chapitre dans la base de données
        // Créer des données valides pour l'insertion
        const chapterData = {
          course_id: courseId,
          title: title,
          description: '',
          // Utiliser une valeur plus petite pour order_index (limité à 2,147,483,647 pour le type integer de PostgreSQL)
          order_index: i, // Simplement utiliser l'index comme ordre
          source_url: source_url,
          chapter_type: 'savoir',
          is_introduction: false,
          is_conclusion: false,
          content_type: 'course' as ContentType
        };
        
        console.log(`Tentative d'insertion dans la table 'chapters' avec les données:`, chapterData);
        
        const { error: insertError, data: newChapterData } = await supabase
          .from('chapters')
          .insert(chapterData)
          .select()
          .single();
        
        if (insertError) {
          console.error(`Erreur lors de la création du chapitre pour ${file.name}:`, insertError);
          console.error(`Détails de l'erreur:`, JSON.stringify(insertError, null, 2));
          setUploadProgress(prev => ({
            ...prev,
            message: `Erreur lors de l'enregistrement de ${file.name}. Passage au fichier suivant...`
          }));
          // Attendre un peu pour que l'utilisateur puisse voir le message d'erreur
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        successCount++;
        
        // Ajouter le nouveau chapitre à l'état local
        setChapters(prev => [...prev, newChapterData]);
      }
      
      // Afficher un message de succès final
      if (successCount > 0) {
        setUploadProgress({
          current: validFiles.length,
          total: validFiles.length,
          message: `Import terminé ! ${successCount} chapitre(s) importé(s) avec succès.`
        });
        
        // Rafraîchir la liste des fichiers uploadés
        await fetchUploadedFiles();
        
        // Attendre 3 secondes avant de réinitialiser la progression
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        setError('Aucun chapitre n\'a pu être importé. Veuillez réessayer.');
      }
      
    } catch (err: any) {
      console.error('Error uploading chapter files:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'importation des chapitres');
    } finally {
      setUploadingFile(false);
      setUploadProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setNewChapter({ ...chapter });
    setShowChapterForm(true);
  };

  // Fonction pour marquer un chapitre comme introduction
  const handleMarkAsIntroduction = async (chapter: Chapter) => {
    if (!courseId || !user || !chapter.id) return;
    
    try {
      setUploadingFile(true);
      
      // Mettre à jour le chapitre pour le marquer comme introduction
      const { error } = await supabase
        .from('chapters')
        .update({
          is_introduction: true,
          title: course?.name ? `${course.name} - Introduction` : 'Introduction',
          order_index: -1 // Pour s'assurer qu'il apparaît en premier
        })
        .eq('id', chapter.id);
      
      if (error) throw error;
      
      // Réindexer les autres chapitres en arrière-plan
      reindexChapters();
      
      // Mettre à jour l'état local sans recharger la page complète
      const updatedChapters = chapters.map(ch => {
        if (ch.id === chapter.id) {
          return {
            ...ch,
            is_introduction: true,
            title: course?.name ? `${course.name} - Introduction` : 'Introduction',
            order_index: -1
          };
        }
        return ch;
      });
      
      // Tri des chapitres mis à jour
      const sortedUpdatedChapters = [...updatedChapters].sort((a, b) => {
        // Cours complet toujours en premier (chapitre 0)
        if (a.title.toLowerCase().includes('complet')) return -1;
        if (b.title.toLowerCase().includes('complet')) return 1;
        
        // Introduction juste après le cours complet
        if (a.is_introduction) return -1;
        if (b.is_introduction) return 1;
        
        // Conclusion toujours en dernier
        if (a.is_conclusion) return 1;
        if (b.is_conclusion) return -1;
        
        // Sinon, conserver l'ordre d'upload
        return 0;
      });
      
      setChapters(sortedUpdatedChapters);
      
    } catch (err: any) {
      console.error('Erreur lors du marquage comme introduction:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setUploadingFile(false);
      setUploadProgress({ current: 0, total: 0, message: '' });
    }
  };
  
  // Fonction pour marquer un chapitre comme conclusion
  const handleMarkAsConclusion = async (chapter: Chapter) => {
    if (!courseId || !user || !chapter.id) return;
    
    try {
      setUploadingFile(true);
      
      // Mettre à jour le chapitre pour le marquer comme conclusion
      const { error } = await supabase
        .from('chapters')
        .update({
          is_conclusion: true,
          title: course?.name ? `${course.name} - Conclusion` : 'Conclusion',
          order_index: 1000 // Pour s'assurer qu'il apparaît en dernier
        })
        .eq('id', chapter.id);
      
      if (error) throw error;
      
      // Réindexer les autres chapitres en arrière-plan
      reindexChapters();
      
      // Mettre à jour l'état local sans recharger la page complète
      const updatedChapters = chapters.map(ch => {
        if (ch.id === chapter.id) {
          return {
            ...ch,
            is_conclusion: true,
            title: course?.name ? `${course.name} - Conclusion` : 'Conclusion',
            order_index: 1000
          };
        }
        return ch;
      });
      
      // Tri des chapitres mis à jour
      const sortedUpdatedChapters = [...updatedChapters].sort((a, b) => {
        // Cours complet toujours en premier (chapitre 0)
        if (a.title.toLowerCase().includes('complet')) return -1;
        if (b.title.toLowerCase().includes('complet')) return 1;
        
        // Introduction juste après le cours complet
        if (a.is_introduction) return -1;
        if (b.is_introduction) return 1;
        
        // Conclusion toujours en dernier
        if (a.is_conclusion) return 1;
        if (b.is_conclusion) return -1;
        
        // Sinon, conserver l'ordre d'upload
        return 0;
      });
      
      setChapters(sortedUpdatedChapters);
      
    } catch (err: any) {
      console.error('Erreur lors du marquage comme conclusion:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setUploadingFile(false);
      setUploadProgress({ current: 0, total: 0, message: '' });
    }
  };
  
  // Fonction pour réindexer tous les chapitres
  const reindexChapters = async () => {
    if (!courseId) return;
    
    try {
      // Récupérer tous les chapitres sauf introduction, conclusion et cours complet
      const { data: allChapters, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true }); // Utiliser l'ordre d'upload
      
      if (error) throw error;
      
      // Filtrer les chapitres normaux (ni intro, ni conclusion, ni complet)
      const chaptersToReindex = allChapters.filter(ch => 
        !ch.is_introduction && 
        !ch.is_conclusion && 
        !ch.title.toLowerCase().includes('complet')
      );
      
      // Réindexer chaque chapitre
      for (let i = 0; i < chaptersToReindex.length; i++) {
        const chapter = chaptersToReindex[i];
        
        // Mettre à jour l'index et le titre
        await supabase
          .from('chapters')
          .update({
            order_index: i + 1,
            title: course?.name ? `${course.name} - Chapitre ${i + 1}` : `Chapitre ${i + 1}`
          })
          .eq('id', chapter.id);
      }
    } catch (err) {
      console.error('Erreur lors de la réindexation des chapitres:', err);
    }
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

  // Fonction supprimée car nous utilisons maintenant handleUploadChapterFiles pour tous les types de contenu
  /*
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
  */
  
  // Fonction pour gérer le drop de plusieurs fichiers PDF (chapitres découpés) - Désactivée dans la nouvelle approche
  /*const handleMultipleChaptersDrop = async (e: React.DragEvent<HTMLDivElement>) => {
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
      
      // Trier les fichiers par numéro de chapitre (extraction numérique)
      pdfFiles.sort((a, b) => {
        // Extraire les numéros des noms de fichiers
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        
        // Trier par numéro
        return numA - numB;
      });
      
      let successCount = 0;
      
      // Traiter chaque fichier PDF comme un chapitre
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        // Ce code fait partie d'une section commentée et n'est plus utilisé
        
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
      setUploadProgress({ current: 0, total: 0, message: '' });
    }
  };*/

  // Fonction pour empêcher le comportement par défaut du navigateur lors du drag & drop - Désactivée dans la nouvelle approche
  /*const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };*/

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
        const timestamp = Date.now();
        const fileName = `${timestamp}_${newChapter.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chapters')
          .upload(fileName, newChapter.file);
        
        if (uploadError) throw uploadError;
        
        // Obtenir l'URL publique du fichier
        const { data: publicUrlData } = supabase.storage
          .from('chapters')
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
      setUploadProgress({ current: 0, total: 0, message: '' });
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
      
      // Rafraîchir la liste des chapitres
      fetchChapters();
      
    } catch (err) {
      console.error('Error deleting chapter:', err);
      setError('Une erreur est survenue lors de la suppression du chapitre');
    }
  };
  
  // Fonction pour supprimer un fichier téléchargé
  const handleDeleteFile = async (fileName: string, courseId: string, event?: React.MouseEvent) => {
    // Empêcher le comportement par défaut qui pourrait causer un défilement
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Tentative de suppression du fichier:', fileName, 'dans le cours:', courseId);
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;
    
    try {
      setUploadingFile(true);
      setError(null);
      setUploadProgress({ current: 0, total: 1, message: 'Suppression du fichier en cours...' });
      
      // Vérifier si le fichier est associé à un chapitre
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('id, source_url')
        .eq('course_id', courseId);
      
      // Trouver les chapitres qui utilisent ce fichier
      const linkedChapters = chaptersData?.filter(chapter => {
        if (!chapter.source_url) return false;
        const fileNameFromUrl = chapter.source_url.split('/').pop();
        return fileNameFromUrl === fileName;
      }) || [];
      
      // Si le fichier est lié à des chapitres, supprimer d'abord ces liens
      if (linkedChapters.length > 0) {
        console.log(`Le fichier est lié à ${linkedChapters.length} chapitre(s). Suppression des liens...`);
        
        for (const chapter of linkedChapters) {
          const { error: updateError } = await supabase
            .from('chapters')
            .update({ source_url: null })
            .eq('id', chapter.id);
          
          if (updateError) {
            console.error(`Erreur lors de la mise à jour du chapitre ${chapter.id}:`, updateError);
          }
        }
      }
      
      // Supprimer le fichier du bucket Supabase - 3 tentatives maximum
      let deleteSuccess = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!deleteSuccess && attempts < maxAttempts) {
        attempts++;
        console.log(`Tentative de suppression ${attempts}/${maxAttempts} pour le fichier ${fileName}`);
        
        const { error } = await supabase
          .storage
          .from('course-files')
          .remove([`${courseId}/${fileName}`]);
        
        if (error) {
          console.error(`Erreur lors de la tentative ${attempts}:`, error);
          // Attendre un peu avant la prochaine tentative
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          deleteSuccess = true;
        }
      }
      
      if (!deleteSuccess) {
        console.error(`Échec de la suppression du fichier ${fileName} après ${maxAttempts} tentatives`);
        // Continuer quand même, car nous allons utiliser localStorage pour masquer le fichier
      }
      
      // Enregistrer le fichier comme supprimé dans localStorage pour éviter qu'il ne réapparaisse
      addDeletedFile(courseId, fileName);
      
      console.log('Fichier supprimé avec succès et ajouté à la liste des fichiers supprimés:', fileName);
      
      // Mettre à jour l'état local des fichiers pour une mise à jour immédiate de l'UI
      setUploadedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
      
      // Afficher un message de succès temporaire
      setUploadProgress({ current: 1, total: 1, message: 'Fichier supprimé avec succès !' });
      
      // Rafraîchir la liste des chapitres
      await fetchChapters();
      
      // Réinitialiser l'état après un court délai
      setTimeout(() => {
        setUploadingFile(false);
        setUploadProgress({ current: 0, total: 0, message: '' });
      }, 1500);
      
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Une erreur est survenue lors de la suppression du fichier');
      setUploadingFile(false);
    }
  };

  // Fonction pour empêcher le défilement de la page
  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (preventScrollRef.current) {
        e.preventDefault();
        window.scrollTo(0, window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: false });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fonction pour monter un chapitre dans la liste
  const handleMoveChapterUp = async (chapterId: string, event: React.MouseEvent) => {
    // Empêcher le comportement par défaut et la propagation pour éviter le défilement
    event.preventDefault();
    event.stopPropagation();
    preventScrollRef.current = true;
    
    if (!chapterId || movingChapter) return;
    
    setMovingChapter(chapterId);
    
    try {
      // Trouver le chapitre actuel et son index
      const chapterIndex = chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex <= 0) {
        // Déjà en haut ou non trouvé
        setMovingChapter(null);
        return;
      }
      
      // Trouver le chapitre précédent
      const previousChapter = chapters[chapterIndex - 1];
      const currentChapter = chapters[chapterIndex];
      
      if (!previousChapter.id || !currentChapter.id) {
        setMovingChapter(null);
        return;
      }
      
      // Créer une copie locale des chapitres pour mise à jour immédiate de l'UI
      const updatedChapters = [...chapters];
      
      // Échanger les chapitres dans la liste locale
      [updatedChapters[chapterIndex - 1], updatedChapters[chapterIndex]] = 
      [updatedChapters[chapterIndex], updatedChapters[chapterIndex - 1]];
      
      // Mettre à jour l'état local immédiatement pour un feedback visuel
      setChapters(updatedChapters);
      
      // Échanger les order_index
      const tempOrderIndex = previousChapter.order_index;
      
      // Mettre à jour le chapitre précédent dans la base de données
      await supabase
        .from('chapters')
        .update({ order_index: currentChapter.order_index })
        .eq('id', previousChapter.id);
      
      // Mettre à jour le chapitre actuel dans la base de données
      await supabase
        .from('chapters')
        .update({ order_index: tempOrderIndex })
        .eq('id', currentChapter.id);
      
      // Rafraîchir la liste des chapitres depuis la base de données
      await fetchChapters();
    } catch (error) {
      console.error('Erreur lors du déplacement du chapitre vers le haut:', error);
      // En cas d'erreur, recharger les chapitres pour rétablir l'état correct
      await fetchChapters();
    } finally {
      setMovingChapter(null);
      preventScrollRef.current = false;
      
      // Réinitialiser l'animation après 2 secondes
      setTimeout(() => {
        setLastMovedChapter(null);
      }, 2000);
    }
  };

  // Fonction pour descendre un chapitre dans la liste
  const handleMoveChapterDown = async (chapterId: string, event: React.MouseEvent) => {
    // Empêcher le comportement par défaut et la propagation pour éviter le défilement
    event.preventDefault();
    event.stopPropagation();
    preventScrollRef.current = true;
    
    if (!chapterId || movingChapter) return;
    
    setMovingChapter(chapterId);
    
    try {
      // Trouver le chapitre actuel et son index
      const chapterIndex = chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1 || chapterIndex >= chapters.length - 1) {
        // Déjà en bas ou non trouvé
        setMovingChapter(null);
        return;
      }
      
      // Trouver le chapitre suivant
      const nextChapter = chapters[chapterIndex + 1];
      const currentChapter = chapters[chapterIndex];
      
      if (!nextChapter.id || !currentChapter.id) {
        setMovingChapter(null);
        return;
      }
      
      // Créer une copie locale des chapitres pour mise à jour immédiate de l'UI
      const updatedChapters = [...chapters];
      
      // Échanger les chapitres dans la liste locale
      [updatedChapters[chapterIndex + 1], updatedChapters[chapterIndex]] = 
      [updatedChapters[chapterIndex], updatedChapters[chapterIndex + 1]];
      
      // Mettre à jour l'état local immédiatement pour un feedback visuel
      setChapters(updatedChapters);
      
      // Échanger les order_index
      const tempOrderIndex = nextChapter.order_index;
      
      // Mettre à jour le chapitre suivant dans la base de données
      await supabase
        .from('chapters')
        .update({ order_index: currentChapter.order_index })
        .eq('id', nextChapter.id);
      
      // Mettre à jour le chapitre actuel dans la base de données
      await supabase
        .from('chapters')
        .update({ order_index: tempOrderIndex })
        .eq('id', currentChapter.id);
      
      // Rafraîchir la liste des chapitres depuis la base de données
      await fetchChapters();
    } catch (error) {
      console.error('Erreur lors du déplacement du chapitre vers le bas:', error);
      // En cas d'erreur, recharger les chapitres pour rétablir l'état correct
      await fetchChapters();
    } finally {
      setMovingChapter(null);
      preventScrollRef.current = false;
      
      // Réinitialiser l'animation après 2 secondes
      setTimeout(() => {
        setLastMovedChapter(null);
      }, 2000);
    }
  };

  const handleSaveChaptersOrder = async (event?: React.MouseEvent) => {
    // Empêcher le défilement si l'événement est fourni
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      preventScrollRef.current = true;
    }
    try {
      setSavingChapters(true);
      setUploadingFile(true);
      setUploadProgress({
        current: 0,
        total: chapters.length,
        message: 'Préparation de la mise à jour des chapitres...'
      });
      
      // Trier les chapitres pour le traitement
      const sortedChapters = [...chapters].sort((a, b) => {
        // Cours complet toujours en premier (chapitre 0)
        if (a.title.toLowerCase().includes('complet')) return -1;
        if (b.title.toLowerCase().includes('complet')) return 1;
        
        // Introduction juste après le cours complet
        if (a.is_introduction) return -1;
        if (b.is_introduction) return 1;
        
        // Conclusion toujours en dernier
        if (a.is_conclusion) return 1;
        if (b.is_conclusion) return -1;
        
        // Sinon, trier par ordre_index
        return a.order_index - b.order_index;
      });
      
      // Mettre à jour l'ordre et les titres des chapitres
      let normalChapterIndex = 1; // Pour numéroter les chapitres normaux
      
      for (let i = 0; i < sortedChapters.length; i++) {
        const chapter = sortedChapters[i];
        
        if (!chapter.id) continue;
        
        // Mettre à jour la progression
        setUploadProgress({
          current: i + 1,
          total: sortedChapters.length,
          message: `Mise à jour du chapitre ${i + 1}/${sortedChapters.length}`
        });
        
        // Déterminer le nouvel index et titre selon le type de chapitre
        let newOrderIndex = i;
        let newTitle = chapter.title;
        
        if (chapter.title.toLowerCase().includes('complet')) {
          // Chapitre complet - toujours en premier
          newOrderIndex = -20;
          newTitle = course?.name ? `${course.name} - Complet` : 'Cours complet';
        } else if (chapter.is_introduction) {
          // Introduction - juste après le complet
          newOrderIndex = -10;
          newTitle = course?.name ? `${course.name} - Introduction` : 'Introduction';
        } else if (chapter.is_conclusion) {
          // Conclusion - toujours en dernier
          newOrderIndex = 1000;
          newTitle = course?.name ? `${course.name} - Conclusion` : 'Conclusion';
        } else {
          // Chapitre normal - numéroté séquentiellement
          newOrderIndex = normalChapterIndex;
          newTitle = course?.name ? `${course.name} - Chapitre ${normalChapterIndex}` : `Chapitre ${normalChapterIndex}`;
          normalChapterIndex++;
        }
        
        // Mettre à jour dans la base de données
        const { error } = await supabase
          .from('chapters')
          .update({ 
            order_index: newOrderIndex,
            title: newTitle,
            course_id: courseId, // S'assurer que le chapitre est lié au bon cours
            chapter_type: 'savoir' // Type par défaut pour les chapitres
          })
          .eq('id', chapter.id);
        
        if (error) throw error;
      }
      
      // Rafraîchir la liste des chapitres après la mise à jour
      await fetchChapters();
      
      // Déclencher l'extraction du contenu JSON pour chaque chapitre
      setUploadProgress({
        current: 0,
        total: sortedChapters.length,
        message: 'Préparation de l\'extraction du contenu des chapitres...'
      });
      
      // Extraire le contenu de chaque chapitre pour préparer l'analyse par HALPI
      for (let i = 0; i < sortedChapters.length; i++) {
        const chapter = sortedChapters[i];
        
        if (!chapter.id || !chapter.source_url) continue;
        
        try {
          // Mettre à jour la progression
          setUploadProgress({
            current: i + 1,
            total: sortedChapters.length,
            message: `Extraction du contenu du chapitre ${i + 1}/${sortedChapters.length}`
          });
          
          // Appeler l'API d'extraction du contenu
          await apiService.chapters.extractContent(chapter.id);
        } catch (error) {
          console.error(`Erreur lors de l'extraction du contenu du chapitre ${chapter.id}:`, error);
          // Continuer avec le chapitre suivant même en cas d'erreur
        }
      }
      
      // Afficher un message de succès final
      setUploadProgress({
        current: sortedChapters.length,
        total: sortedChapters.length,
        message: 'Tous les chapitres ont été mis à jour et leur contenu a été extrait avec succès!'
      });
      
      // Attendre un moment pour que l'utilisateur voie le message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err: any) {
      console.error('Error saving chapters order:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement de l\'ordre des chapitres');
    } finally {
      setSavingChapters(false);
      setUploadingFile(false);
      setUploadProgress({ current: 0, total: 0, message: '' });
      preventScrollRef.current = false;
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
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Affichage de la progression d'upload */}
        {uploadingFile && uploadProgress.total > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {uploadProgress.message}
              </span>
              <span className="text-sm">
                {uploadProgress.current}/{uploadProgress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
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
                <label className="block w-full cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
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
        
        {/* ÉTAPE 0: Téléchargement de documents */}
        <div className="border-b pb-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-800 rounded-full mr-3 font-bold">0</span>
            Télécharger le document PDF du cours complet
          </h2>
          
          {/* Navigation par onglets pour les types de contenu */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-8" aria-label="Tabs">
              <button
                onClick={() => setContentType('course')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${contentType === 'course' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <BookOpen className="inline-block mr-2" size={18} />
                Cours
              </button>
              <button
                onClick={() => setContentType('exercise')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${contentType === 'exercise' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <ClipboardList className="inline-block mr-2" size={18} />
                Exercices
              </button>
              <button
                onClick={() => setContentType('exam')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${contentType === 'exam' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <FileCheck className="inline-block mr-2" size={18} />
                Examens
              </button>
            </nav>
          </div>
          
          <Card className="p-6">
            {contentType === 'course' && (
              <div>
                <div className="flex items-start mb-4">
                  <FileText className="mr-3 text-primary-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-medium text-gray-800">Document PDF complet du cours</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Commence par télécharger le document PDF complet de ton cours. Tu pourras ensuite le découper en chapitres à l'étape suivante.
                    </p>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById('course-file-input')?.click()}
                >
                  <input
                    type="file"
                    id="course-file-input"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        // Utiliser handleUploadCourseFiles pour l'étape 0
                        handleUploadCourseFiles(e.target.files);
                      }
                    }}
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">Cliquez pour sélectionner un fichier</p>
                  <p className="mt-1 text-xs text-gray-500">PDF, Word, PowerPoint, Excel, max 20MB</p>
                </div>
                
                {/* Affichage des fichiers sélectionnés pour les cours */}
                {uploadingFile && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex items-center">
                        <Loader2 className="text-primary-600 mr-2 animate-spin" size={16} />
                        <span className="text-sm font-medium">{uploadProgress.message}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {contentType === 'exercise' && (
              <div>
                <div className="flex items-start mb-4">
                  <ClipboardList className="mr-3 text-green-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-medium text-gray-800">Exercices pratiques</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ajoute des exercices pratiques pour tester tes connaissances. Tu peux télécharger plusieurs fichiers d'exercices.
                    </p>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById('exercise-file-input')?.click()}
                >
                  <input
                    type="file"
                    id="exercise-file-input"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls"
                    multiple
                    onChange={(e) => e.target.files && handleUploadCourseFiles(e.target.files)}
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">Cliquez pour sélectionner des fichiers d'exercices</p>
                  <p className="mt-1 text-xs text-gray-500">PDF, Word ou PowerPoint, max 20MB par fichier</p>
                </div>
                
                {/* Affichage des fichiers sélectionnés pour les exercices */}
                {uploadingFile && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex items-center">
                        <Loader2 className="text-primary-600 mr-2 animate-spin" size={16} />
                        <span className="text-sm font-medium">{uploadProgress.message}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {contentType === 'exam' && (
              <div>
                <div className="flex items-start mb-4">
                  <FileCheck className="mr-3 text-blue-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-medium text-gray-800">Examens des années précédentes</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Importe des examens des années précédentes pour mieux te préparer. Tu peux télécharger plusieurs fichiers d'examens.
                    </p>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById('exam-file-input')?.click()}
                >
                  <input
                    type="file"
                    id="exam-file-input"
                    className="hidden"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls"
                    multiple
                    onChange={(e) => e.target.files && handleUploadCourseFiles(e.target.files)}
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900">Cliquez pour sélectionner des fichiers d'examens</p>
                  <p className="mt-1 text-xs text-gray-500">PDF, Word ou PowerPoint, max 20MB par fichier</p>
                </div>
                
                {/* Affichage des fichiers sélectionnés pour les examens */}
                {uploadingFile && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div className="flex items-center">
                        <Loader2 className="text-primary-600 mr-2 animate-spin" size={16} />
                        <span className="text-sm font-medium">{uploadProgress.message}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Affichage des fichiers téléchargés par type */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-3">Fichiers téléchargés</h3>
            
            <div className="space-y-4">
              {/* Onglets pour filtrer par type */}
              <div className="flex space-x-4 border-b border-gray-200">
                <button 
                  onClick={() => setFileFilter('all')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${fileFilter === 'all' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Tous
                </button>
                <button 
                  onClick={() => setFileFilter('course')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${fileFilter === 'course' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <BookOpen className="inline-block mr-1" size={16} />
                  Cours
                </button>
                <button 
                  onClick={() => setFileFilter('exercise')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${fileFilter === 'exercise' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <ClipboardList className="inline-block mr-1" size={16} />
                  Exercices
                </button>
                <button 
                  onClick={() => setFileFilter('exam')}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${fileFilter === 'exam' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  <FileCheck className="inline-block mr-1" size={16} />
                  Examens
                </button>
              </div>
              
              {/* Liste des fichiers */}
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600">Aucun fichier téléchargé pour le moment</p>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  {uploadedFiles
                    .filter(file => fileFilter === 'all' || file.content_type === fileFilter)
                    .map((file, index) => {
                      // Extraire juste le nom du fichier original sans le timestamp et autres préfixes
                      const originalFileName = file.name.replace(/^(main_|chapter_)?\d+_/, '');
                      
                      return (
                        <div key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          {file.content_type === 'course' && <BookOpen className="flex-shrink-0 mr-3 text-primary-600" size={20} />}
                          {file.content_type === 'exercise' && <ClipboardList className="flex-shrink-0 mr-3 text-green-600" size={20} />}
                          {file.content_type === 'exam' && <FileCheck className="flex-shrink-0 mr-3 text-amber-600" size={20} />}
                          
                          <div className="flex-grow min-w-0">
                            <p className="font-medium text-gray-900 truncate">{originalFileName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.created_at).toLocaleDateString()} · {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          
                          <div className="flex space-x-2">
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-shrink-0 text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center px-3 py-1.5 border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                            >
                              <FileText size={16} className="mr-1.5" />
                              Voir
                            </a>
                            
                            <button
                              onClick={(e) => courseId && handleDeleteFile(file.name, courseId, e)}
                              className="flex-shrink-0 text-red-600 hover:text-red-800 text-sm font-medium flex items-center px-3 py-1.5 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} className="mr-1.5" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ÉTAPE 1: Découpage en chapitres */}
        <div className="border-b pb-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-800 rounded-full mr-3 font-bold">1</span>
            Découpage en chapitres
          </h2>
          
          <PdfSplitterMinimal
            onOpenFileSelector={handleOpenFileSelector}
            onOpenFolderSelector={handleOpenFolderSelector}
            onOpenZipSelector={handleOpenZipSelector}
            contentType={contentType}
          />
        </div>
        
        {/* Outil de découpage PDF intégré - Désactivé dans la nouvelle approche */}
        

        
        {/* ÉTAPE 2: Liste des chapitres */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-800 rounded-full mr-3 font-bold">2</span>
            Liste des chapitres
            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {chapters.filter(ch => !ch.title.toLowerCase().includes('complet')).length} chapitres
            </span>
          </h2>
          
          {/* Note d'information sur les introductions et conclusions */}
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
            <p className="text-sm text-gray-700">
              <strong>Note :</strong> Si vos chapitres proviennent d'un seul fichier PDF découpé, indiquez clairement l'introduction et la conclusion. Si vous utilisez plusieurs fichiers de cours différents, vous pouvez simplement supprimer toutes les introductions et conclusions redondantes et vérifier que les chapitres sont dans le bon ordre.
            </p>
            <p className="mt-2 text-xs text-amber-700 font-medium">
              <strong>Astuce :</strong> Utilisez les flèches ↑ et ↓ à gauche de chaque chapitre pour réorganiser l'ordre. Un chapitre déplacé sera mis en surbrillance en vert.
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium flex items-center">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                <strong>Important :</strong> Cliquez sur "Enregistrer l'ordre" après avoir organisé vos chapitres.
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Cette étape est essentielle pour que HALPI puisse analyser correctement votre cours. Elle déclenche l'extraction du contenu de chaque chapitre et permet à l'IA de comprendre la structure de votre cours.
              </p>
            </div>
          </div>

          {/* Affichage de la progression d'upload directement dans la section Liste des chapitres */}
          {uploadingFile && uploadProgress.total > 0 && (
            <Card className="p-4 bg-blue-50 border border-blue-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-700">
                  {uploadProgress.message}
                </span>
                <span className="text-sm text-blue-700">
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            </Card>
          )}
          
          <div className="flex justify-end mb-4">
            <Button variant="primary" onClick={(e) => handleSaveChaptersOrder(e)} disabled={savingChapters} className="mr-2 bg-blue-600 hover:bg-blue-700">
              <Save size={16} className="mr-2" />
              Enregistrer l'ordre
            </Button>
          </div>
          
          {chapters.filter(ch => !ch.title.toLowerCase().includes('complet')).length === 0 ? (
            <Card className="p-8 text-center bg-gray-50 border border-gray-200">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun chapitre</h3>
              <p className="text-gray-600 mb-6">Vous n'avez pas encore ajouté de chapitres à ce cours.</p>
              <p className="text-gray-600 mb-6">Utilisez l'étape 2 ci-dessus pour ajouter des chapitres.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {chapters
                .filter(ch => !ch.title.toLowerCase().includes('complet'))
                // Filtrer pour n'afficher que les chapitres de type 'course'
                .filter(chapter => chapter.chapter_type === 'savoir')
                // Détecter et filtrer les chapitres dupliques ou invalides
                .filter(chapter => {
                  // Vérifier que le chapitre a une URL valide (source_url)
                  return chapter.source_url && chapter.source_url.trim() !== '';
                })
                // Tri des chapitres par groupe (basé sur le titre) puis par ordre_index
                .sort((a, b) => {
                  // Extraire le préfixe alphabétique du titre (ex: "psycho" dans "psycho 1")
                  const prefixA = a.title.match(/^[a-zA-Z]+/)?.[0] || '';
                  const prefixB = b.title.match(/^[a-zA-Z]+/)?.[0] || '';
                  
                  // Si les préfixes sont différents, on trie d'abord par ordre d'upload (order_index)
                  // en regroupant les chapitres du même lot
                  if (prefixA !== prefixB) {
                    // Utiliser les 4 premiers chiffres de order_index comme identifiant de lot
                    const batchA = Math.floor(a.order_index / 10000);
                    const batchB = Math.floor(b.order_index / 10000);
                    if (batchA !== batchB) {
                      return batchA - batchB; // Trier par lot d'upload
                    }
                  }
                  
                  // Extraire les numéros des titres
                  const numA = parseInt(a.title.match(/\d+/)?.[0] || '0');
                  const numB = parseInt(b.title.match(/\d+/)?.[0] || '0');
                  
                  // Si les préfixes sont identiques, trier par numéro
                  if (prefixA === prefixB) {
                    return numA - numB;
                  }
                  
                  // Sinon, trier par ordre_index
                  return a.order_index - b.order_index;
                })
                // Déduplication des chapitres ayant exactement le même titre
                .filter((chapter, index, self) => {
                  // Conserver uniquement le premier chapitre avec un titre donné
                  return index === self.findIndex(ch => ch.title === chapter.title);
                })
                .map((chapter, index) => (
                <Card 
                  key={chapter.id} 
                  className={`p-4 border 
                    ${!chapter.source_url ? 'border-red-200 bg-red-50' : 'border-gray-200'} 
                    ${lastMovedChapter === chapter.id ? 'border-green-500 bg-green-50 animate-pulse' : ''} 
                    hover:border-primary-200 transition-colors`
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center mr-4 font-medium">
                        {chapter.title.toLowerCase().includes('complet') ? '0' : 
                         chapter.is_introduction ? 'Intro' : 
                         chapter.is_conclusion ? 'Concl' : 
                         index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {chapter.is_introduction ? 'Introduction' : 
                           chapter.is_conclusion ? 'Conclusion' : 
                           chapter.title}
                        </h3>
                        {chapter.description && (
                          <p className="text-sm text-gray-600">{chapter.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Boutons pour monter/descendre le chapitre */}
                      <div className="flex flex-col mr-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={index === 0 || movingChapter !== null}
                          onClick={(e) => chapter.id && handleMoveChapterUp(chapter.id, e)}
                          className="p-1 mb-1 border-gray-300 hover:border-primary-300 hover:bg-primary-50"
                        >
                          <ChevronUp size={14} className={`${index === 0 ? 'text-gray-400' : 'text-primary-600'}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={index === chapters.filter(ch => !ch.title.toLowerCase().includes('complet')).length - 1 || movingChapter !== null}
                          onClick={(e) => chapter.id && handleMoveChapterDown(chapter.id, e)}
                          className="p-1 border-gray-300 hover:border-primary-300 hover:bg-primary-50"
                        >
                          <ChevronDown size={14} className={`${index === chapters.filter(ch => !ch.title.toLowerCase().includes('complet')).length - 1 ? 'text-gray-400' : 'text-primary-600'}`} />
                        </Button>
                      </div>
                      
                      {/* Boutons pour marquer comme introduction/conclusion */}
                      {index === 0 && !chapter.is_introduction && !chapter.is_conclusion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsIntroduction(chapter)}
                          className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          Marquer comme Introduction
                        </Button>
                      )}
                      
                      {index === chapters.filter(ch => !ch.title.toLowerCase().includes('complet')).length - 1 && 
                       !chapter.is_introduction && !chapter.is_conclusion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsConclusion(chapter)}
                          className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          Marquer comme Conclusion
                        </Button>
                      )}
                      
                      {!chapter.source_url && (
                        <div className="text-red-600 text-xs font-medium flex items-center px-3 py-1.5 border border-red-200 rounded-md bg-red-50">
                          <AlertCircle size={16} className="mr-1.5" />
                          Fichier manquant
                        </div>
                      )}
                      
                      {chapter.source_url && (
                        <a 
                          href={chapter.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center px-3 py-1.5 border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                        >
                          <FileText size={16} className="mr-1.5" />
                          Voir le PDF
                        </a>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditChapter(chapter)}
                        className="p-1.5 border-gray-300 hover:border-primary-300 hover:bg-primary-50"
                      >
                        <Edit2 size={16} className="text-primary-600" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => chapter.id && handleDeleteChapter(chapter.id)}
                        className="p-1.5 border-gray-300 hover:border-red-300 hover:bg-red-50"
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
    </div>
  );
};

export default CourseDetailsPage;
