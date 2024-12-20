import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Upload, Loader2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '../lib/firebase';
import JSZip from 'jszip';
import { createLearningPath } from '../utils/createLearningPath';

interface ChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseId: string;
}

interface Chapter {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  order: number;
  courseId: string;
  userId: string;
  uploadedAt: string;
}

export function ChaptersModal({ isOpen, onClose, courseTitle, courseId }: ChaptersModalProps) {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user && courseId) {
      loadChapters();
    }
  }, [isOpen, user, courseId]);

  const loadChapters = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'chapters'),
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const querySnapshot = await getDocs(q);
      const chaptersData: Chapter[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        fileName: doc.data().fileName,
        fileUrl: doc.data().fileUrl,
        order: doc.data().order,
        courseId: doc.data().courseId,
        userId: doc.data().userId,
        uploadedAt: doc.data().uploadedAt
      }));
      
      chaptersData.sort((a, b) => a.order - b.order);
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress('Upload en cours...');

    try {
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(file);
        const pdfFiles: File[] = [];

        // Parcourir tous les fichiers du ZIP
        await Promise.all(
          Object.keys(zipContents.files).map(async (filename) => {
            const zipEntry = zipContents.files[filename];
            if (filename.toLowerCase().endsWith('.pdf') && !zipEntry.dir) {
              const blob = await zipEntry.async('blob');
              const pdfFile = new File([blob], filename, { type: 'application/pdf' });
              pdfFiles.push(pdfFile);
            }
          })
        );

        if (pdfFiles.length === 0) {
          setUploadProgress('Aucun fichier PDF trouvé dans le ZIP');
          return;
        }

        // Trier les fichiers par nom
        pdfFiles.sort((a, b) => a.name.localeCompare(b.name));

        // Supprimer les anciens chapitres
        const deletePromises = chapters.map(async (chapter) => {
          const fileRef = ref(storage, `courses/${user.uid}/chapters/${courseId}/${chapter.fileName}`);
          await deleteObject(fileRef);
          await deleteDoc(doc(db, 'chapters', chapter.id));
        });
        await Promise.all(deletePromises);

        const newChapters: Chapter[] = [];
        for (let i = 0; i < pdfFiles.length; i++) {
          const pdfFile = pdfFiles[i];
          setUploadProgress(`${i + 1}/${pdfFiles.length}`);

          const fileRef = ref(storage, `courses/${user.uid}/chapters/${courseId}/${pdfFile.name}`);
          await uploadBytes(fileRef, pdfFile);
          const downloadURL = await getDownloadURL(fileRef);

          const chapterDoc = await addDoc(collection(db, 'chapters'), {
            courseId,
            userId: user.uid,
            fileName: pdfFile.name,
            fileUrl: downloadURL,
            title: `Chapitre ${i + 1}`,
            order: i,
            uploadedAt: new Date().toISOString()
          });

          newChapters.push({
            id: chapterDoc.id,
            fileName: pdfFile.name,
            fileUrl: downloadURL,
            title: `Chapitre ${i + 1}`,
            order: i,
            courseId,
            userId: user.uid,
            uploadedAt: new Date().toISOString()
          });
        }

        // Mettre à jour le parcours d'apprentissage
        await createLearningPath(courseId, user.uid, newChapters);
        setChapters(newChapters);
        setUploadProgress('Upload terminé avec succès !');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadProgress('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSingleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !file.name.toLowerCase().endsWith('.pdf')) return;

    setIsUploading(true);
    setUploadProgress('Upload en cours...');

    try {
      const fileRef = ref(storage, `courses/${user.uid}/chapters/${courseId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      const newOrder = chapters.length;
      const chapterDoc = await addDoc(collection(db, 'chapters'), {
        courseId,
        userId: user.uid,
        fileName: file.name,
        fileUrl: downloadURL,
        title: `Chapitre ${newOrder + 1}`,
        order: newOrder,
        uploadedAt: new Date().toISOString()
      });

      const newChapter: Chapter = {
        id: chapterDoc.id,
        fileName: file.name,
        fileUrl: downloadURL,
        title: `Chapitre ${newOrder + 1}`,
        order: newOrder,
        courseId,
        userId: user.uid,
        uploadedAt: new Date().toISOString()
      };

      const updatedChapters = [...chapters, newChapter];
      setChapters(updatedChapters);
      await createLearningPath(courseId, user.uid, updatedChapters);

      setUploadProgress('Upload terminé avec succès !');
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadProgress('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !user) return;

    setIsUploading(true);
    setUploadProgress('Upload en cours...');

    try {
      // Filtrer uniquement les fichiers PDF
      const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));
      
      // Trier les fichiers par nom
      pdfFiles.sort((a, b) => a.name.localeCompare(b.name));

      const newChapters: Chapter[] = [];
      const startOrder = chapters.length;

      for (let i = 0; i < pdfFiles.length; i++) {
        const pdfFile = pdfFiles[i];
        setUploadProgress(`${i + 1}/${pdfFiles.length}`);

        const fileRef = ref(storage, `courses/${user.uid}/chapters/${courseId}/${pdfFile.name}`);
        await uploadBytes(fileRef, pdfFile);
        const downloadURL = await getDownloadURL(fileRef);

        const chapterDoc = await addDoc(collection(db, 'chapters'), {
          courseId,
          userId: user.uid,
          fileName: pdfFile.name,
          fileUrl: downloadURL,
          title: `Chapitre ${startOrder + i + 1}`,
          order: startOrder + i,
          uploadedAt: new Date().toISOString()
        });

        newChapters.push({
          id: chapterDoc.id,
          fileName: pdfFile.name,
          fileUrl: downloadURL,
          title: `Chapitre ${startOrder + i + 1}`,
          order: startOrder + i,
          courseId,
          userId: user.uid,
          uploadedAt: new Date().toISOString()
        });
      }

      const updatedChapters = [...chapters, ...newChapters];
      setChapters(updatedChapters);
      await createLearningPath(courseId, user.uid, updatedChapters);

      setUploadProgress('Upload terminé avec succès !');
    } catch (error) {
      console.error('Error uploading folder:', error);
      setUploadProgress('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleUpdateChapterFile = async (event: React.ChangeEvent<HTMLInputElement>, chapter: Chapter) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      setUploadProgress(`Mise à jour du chapitre ${chapter.title}...`);

      // Supprimer l'ancien fichier
      const oldFileRef = ref(storage, `courses/${user.uid}/chapters/${courseId}/${chapter.fileName}`);
      await deleteObject(oldFileRef);

      // Uploader le nouveau fichier
      const newFileRef = ref(storage, `courses/${user.uid}/chapters/${courseId}/${file.name}`);
      await uploadBytes(newFileRef, file);
      const downloadURL = await getDownloadURL(newFileRef);

      // Mettre à jour le document dans Firestore
      await updateDoc(doc(db, 'chapters', chapter.id), {
        fileName: file.name,
        fileUrl: downloadURL,
        updatedAt: new Date().toISOString()
      });

      // Mettre à jour l'état local
      setChapters(prev => prev.map(c => 
        c.id === chapter.id 
          ? { ...c, fileName: file.name, fileUrl: downloadURL }
          : c
      ));

      setUploadProgress('Chapitre mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating chapter:', error);
      setUploadProgress('Erreur lors de la mise à jour');
    } finally {
      setIsUploading(false);
      setEditingChapter(null);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSaveChapters = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const updatePromises = chapters.map((chapter, index) => 
        updateDoc(doc(db, 'chapters', chapter.id), {
          title: chapter.title,
          order: index
        })
      );

      await Promise.all(updatePromises);
      await createLearningPath(courseId, user.uid, chapters);
      
      setUploadProgress('Chapitres enregistrés avec succès !');
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error) {
      console.error('Error saving chapters:', error);
      setUploadProgress('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const updateChapterNumbers = (updatedChapters: Chapter[]) => {
    return updatedChapters.map((chapter, index) => ({
      ...chapter,
      title: `Chapitre ${index + 1}`,
      order: index
    }));
  };

  const handleDeleteChapter = async (chapterId: string) => {
    // Demander confirmation avant de supprimer
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    const isConfirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${chapter.title}" ?`);
    if (!isConfirmed) return;

    try {
      if (!user) return;

      setIsUploading(true);
      setUploadProgress('Suppression en cours...');

      // Supprimer le fichier de Storage
      const fileRef = ref(storage, `courses/${user.uid}/chapters/${courseId}/${chapter.fileName}`);
      await deleteObject(fileRef);

      // Supprimer le document de Firestore
      await deleteDoc(doc(db, 'chapters', chapterId));

      // Filtrer et mettre à jour les numéros des chapitres
      const remainingChapters = chapters.filter(c => c.id !== chapterId);
      const updatedChapters = updateChapterNumbers(remainingChapters);

      // Mettre à jour les chapitres dans Firestore
      const updatePromises = updatedChapters.map(chapter => 
        updateDoc(doc(db, 'chapters', chapter.id), {
          title: chapter.title,
          order: chapter.order
        })
      );
      await Promise.all(updatePromises);

      // Mettre à jour le parcours d'apprentissage
      await createLearningPath(courseId, user.uid, updatedChapters);

      // Mettre à jour l'état local
      setChapters(updatedChapters);
      setUploadProgress('Chapitre supprimé avec succès');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      setUploadProgress('Erreur lors de la suppression');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-h-[90vh] w-full max-w-2xl flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{courseTitle}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-blue-900 mb-4">
                  Pour suivre efficacement les activités d'apprentissage proposées par HALPI, il est essentiel de découper votre syllabus en chapitres individuels.
                </p>
                <p className="text-blue-900 mb-4">
                  Pour vous aider dans cette tâche, nous mettons à votre disposition notre assistant IA, qui analysera votre syllabus au format PDF. Cet outil vous indiquera précisément les pages de début et de fin de chaque chapitre.
                </p>
                <p className="text-blue-900 mb-4">
                  Une fois ces informations en main, il ne vous reste plus qu'à utiliser l'outil PDF24 pour découper facilement votre syllabus en chapitres distincts. Vous pourrez ensuite télécharger un fichier ZIP contenant tous vos chapitres prêts à l'emploi.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <a
                    href="https://chat.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Assistant IA
                  </a>
                  <a
                    href="https://tools.pdf24.org/fr/diviser-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Outil de découpage PDF
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".zip"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50 min-w-[140px] justify-center text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Importer un ZIP
                </button>
              </div>

              <div>
                <input
                  type="file"
                  onChange={handleSingleFileUpload}
                  accept=".pdf"
                  className="hidden"
                  id="single-file-input"
                />
                <button
                  onClick={() => document.getElementById('single-file-input')?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50 min-w-[140px] justify-center text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Ajouter un fichier
                </button>
              </div>

              <div>
                <input
                  type="file"
                  onChange={handleFolderUpload}
                  accept=".pdf"
                  multiple
                  // @ts-ignore
                  webkitdirectory=""
                  // @ts-ignore
                  directory=""
                  className="hidden"
                  id="folder-input"
                />
                <button
                  onClick={() => document.getElementById('folder-input')?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50 min-w-[140px] justify-center text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Importer un dossier
                </button>
              </div>
            </div>

            {isUploading && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Loader2 className="w-4 h-4 text-gold animate-spin" />
                <p className="text-sm text-gray-600">{uploadProgress}</p>
              </div>
            )}

            {chapters.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Chapitres</h3>
                  <button
                    onClick={handleSaveChapters}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Enregistrer les chapitres
                  </button>
                </div>

                <div className="space-y-3">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(e) => {
                              const newChapters = [...chapters];
                              newChapters[index] = {
                                ...chapter,
                                title: e.target.value
                              };
                              setChapters(newChapters);
                            }}
                            className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                          />
                        </div>
                        <p className="text-sm text-gray-500">{chapter.fileName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingChapter(chapter.id);
                            singleFileRef.current?.click();
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              type="file"
              ref={singleFileRef}
              accept=".pdf"
              onChange={(e) => editingChapter && handleUpdateChapterFile(e, chapters.find(c => c.id === editingChapter)!)}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}