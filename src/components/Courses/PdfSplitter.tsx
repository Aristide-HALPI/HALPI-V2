import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import { Scissors, X, ChevronLeft, ChevronRight, FileText, Upload, AlertCircle, File, FileType } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { supabase } from '../../lib/supabaseClient';

// Configuration de PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfSplitterProps {
  courseId: string;
  onSplitComplete: (chapterCount: number) => void;
  onCancel: () => void;
  existingPdfs?: File[];
}

const PdfSplitter: React.FC<PdfSplitterProps> = ({ courseId, onSplitComplete, onCancel, existingPdfs = [] }) => {
  const [pdfFiles, setPdfFiles] = useState<File[]>(existingPdfs);
  const [selectedPdfIndex, setSelectedPdfIndex] = useState<number>(-1);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [cutPoints, setCutPoints] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewScale, setPreviewScale] = useState<number>(0.5);

  // Sélectionner un PDF dans la liste
  useEffect(() => {
    if (selectedPdfIndex >= 0 && selectedPdfIndex < pdfFiles.length) {
      setPdfFile(pdfFiles[selectedPdfIndex]);
      setCutPoints([]);
      setCurrentPage(1);
    } else if (pdfFiles.length > 0 && selectedPdfIndex === -1) {
      setSelectedPdfIndex(0);
    } else {
      setPdfFile(null);
      setPdfData(null);
    }
  }, [selectedPdfIndex, pdfFiles]);

  // Charger le PDF en mémoire quand le fichier est sélectionné
  useEffect(() => {
    if (!pdfFile) return;

    const loadPdfData = async () => {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        setPdfData(arrayBuffer);
      } catch (err) {
        console.error('Erreur lors du chargement du PDF:', err);
        setError('Impossible de charger le PDF. Veuillez réessayer avec un autre fichier.');
      }
    };

    loadPdfData();
  }, [pdfFile]);

  // Déterminer le type d'icône à afficher selon le type de fichier
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText size={14} className="mr-1.5" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <FileType size={14} className="mr-1.5" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <File size={14} className="mr-1.5" />;
    }
    return <FileText size={14} className="mr-1.5" />;
  };
  
  // Vérifier si le fichier est un PDF
  const isPdfFile = (file: File) => {
    return file.type === 'application/pdf';
  };
  
  // Vérifier si le fichier est un format accepté
  const isAcceptedFileType = (file: File) => {
    const acceptedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return acceptedTypes.includes(file.type);
  };
  
  // Gérer le téléchargement des fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = [];
      let hasError = false;
      
      // Vérifier chaque fichier
      Array.from(e.target.files).forEach(file => {
        // Vérifier que c'est un type de fichier accepté
        if (!isAcceptedFileType(file)) {
          setError('Veuillez sélectionner uniquement des fichiers PDF, PowerPoint ou Word valides.');
          hasError = true;
          return;
        }
        
        // Vérifier la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`Le fichier ${file.name} est trop volumineux. La taille maximale est de 10MB.`);
          hasError = true;
          return;
        }
        
        newFiles.push(file);
      });
      
      if (!hasError && newFiles.length > 0) {
        setPdfFiles([...pdfFiles, ...newFiles]);
        setSelectedPdfIndex(pdfFiles.length); // Sélectionner le premier nouveau fichier
        setError(null);
      }
    }
  };
  
  // Supprimer un PDF de la liste
  const handleRemovePdf = (index: number) => {
    const newFiles = [...pdfFiles];
    newFiles.splice(index, 1);
    setPdfFiles(newFiles);
    
    if (selectedPdfIndex === index) {
      // Si on supprime le PDF actuellement sélectionné, sélectionner le premier de la liste
      setSelectedPdfIndex(newFiles.length > 0 ? 0 : -1);
    } else if (selectedPdfIndex > index) {
      // Ajuster l'index si on supprime un PDF avant celui sélectionné
      setSelectedPdfIndex(selectedPdfIndex - 1);
    }
  };

  // Ajouter/supprimer un point de découpage
  const toggleCutPoint = (pageNum: number) => {
    if (cutPoints.includes(pageNum)) {
      setCutPoints(cutPoints.filter(p => p !== pageNum));
    } else {
      setCutPoints([...cutPoints, pageNum].sort((a, b) => a - b));
    }
  };

  // Navigation entre les pages
  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Gérer le téléchargement direct (sans découpage) pour les fichiers non-PDF
  const uploadNonPdfFile = async (file: File) => {
    if (!file) return 0;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Nettoyer le nom du fichier pour éviter les problèmes d'URL
      const timestamp = Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${timestamp}_${cleanFileName}`;
      
      // Uploader le fichier
      const { error: uploadError } = await supabase.storage
        .from('chapters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Récupérer l'URL du fichier
      const { data: urlData } = supabase.storage
        .from('chapters')
        .getPublicUrl(filePath);
      
      const sourceUrl = urlData.publicUrl;
      
      // Insérer le chapitre dans la base de données
      const { error: insertError } = await supabase
        .from('chapters')
        .insert({
          title: file.name.replace(/\.[^/.]+$/, ''),  // Nom du fichier sans extension
          description: `Document ${file.type.includes('presentation') ? 'PowerPoint' : 'Word'}`,
          order_index: 0,
          course_id: courseId,
          source_url: sourceUrl
        });
      
      if (insertError) {
        console.error('Error inserting chapter:', insertError);
        throw insertError;
      }
      
      return 1; // Un chapitre créé
    } catch (err: any) {
      console.error('Error uploading non-PDF file:', err);
      setError(err.message || 'Une erreur est survenue lors du téléchargement du fichier');
      return 0;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Découper le PDF aux points sélectionnés
  const splitPdf = async () => {
    if (!pdfFile) return;
    
    // Si ce n'est pas un PDF, uploader directement
    if (!isPdfFile(pdfFile)) {
      const chapterCount = await uploadNonPdfFile(pdfFile);
      if (chapterCount > 0) {
        onSplitComplete(chapterCount);
      }
      return;
    }
    
    // Pour les PDF, continuer avec le découpage
    if (!pdfData) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Charger le document PDF
      const pdfDoc = await PDFDocument.load(pdfData);
      const totalPages = pdfDoc.getPageCount();
      
      // Déterminer les plages de pages pour chaque chapitre
      const ranges = [];
      let startPage = 0;
      
      // Ajouter les plages basées sur les points de découpage
      for (const cutPoint of cutPoints) {
        ranges.push({ start: startPage, end: cutPoint - 1 });
        startPage = cutPoint;
      }
      
      // Ajouter la dernière plage
      ranges.push({ start: startPage, end: totalPages - 1 });
      
      // Créer un nouveau document PDF pour chaque plage
      const chapterPdfs = [];
      
      try {
        for (let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          const newPdf = await PDFDocument.create();
          
          // Copier les pages du document original
          const pages = await newPdf.copyPages(pdfDoc, Array.from(
            { length: range.end - range.start + 1 },
            (_, i) => range.start + i
          ));
          
          // Ajouter les pages au nouveau document
          pages.forEach(page => newPdf.addPage(page));
          
          // Sauvegarder le PDF
          const pdfBytes = await newPdf.save();
          
          // Convertir les bytes en ArrayBuffer
          const arrayBuffer = pdfBytes.buffer;
          
          // Créer un blob à partir de l'ArrayBuffer
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          
          // Créer un fichier à partir du blob
          const fileName = `Chapitre_${i + 1}_${pdfFile.name.replace(/\.pdf$/i, '')}.pdf`;
          // Utiliser le constructeur de File avec une syntaxe plus simple
          const chapterFile = new File([arrayBuffer], fileName, { type: 'application/pdf' });
          
          chapterPdfs.push(chapterFile);
        }
      } catch (err) {
        console.error('Erreur lors de la création des chapitres PDF:', err);
        setError('Une erreur est survenue lors de la création des chapitres PDF. Veuillez réessayer.');
        setIsProcessing(false);
        return;
      }
      
      // Uploader chaque chapitre et créer les entrées dans la base de données
      let successCount = 0;
      
      for (let i = 0; i < chapterPdfs.length; i++) {
        const file = chapterPdfs[i];
        setUploadProgress(Math.round((i / chapterPdfs.length) * 100));
        
        // Générer un titre de chapitre
        const chapterTitle = `Chapitre ${i + 1}`;
        
        // Uploader le fichier
        const timestamp = Date.now();
        // Nettoyer le nom du fichier pour éviter les problèmes d'URL
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        // Utiliser un chemin plus simple pour éviter les erreurs 400
        const filePath = `${timestamp}_${cleanFileName}`;
        
        // Utiliser le bucket 'avatars' qui existe par défaut dans Supabase
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }
        
        // Récupérer l'URL du fichier
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        const sourceUrl = urlData.publicUrl;
        
        // Insérer le chapitre dans la base de données
        const { error: insertError } = await supabase
          .from('chapters')
          .insert({
            title: chapterTitle,
            description: `Pages ${ranges[i].start + 1} à ${ranges[i].end + 1}`,
            order_index: i,
            course_id: courseId,
            source_url: sourceUrl
          });
        
        if (insertError) {
          console.error('Error inserting chapter:', insertError);
          continue;
        }
        
        successCount++;
      }
      
      setUploadProgress(100);
      
      // Notifier le composant parent que le découpage est terminé
      onSplitComplete(successCount);
      
    } catch (err: any) {
      console.error('Erreur lors du découpage du PDF:', err);
      setError(err.message || 'Une erreur est survenue lors du découpage du PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  // Zoom sur les miniatures
  const handleZoomIn = () => {
    setPreviewScale(Math.min(previewScale + 0.1, 1));
  };

  const handleZoomOut = () => {
    setPreviewScale(Math.max(previewScale - 0.1, 0.3));
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Découper mon syllabus en chapitres</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}
      
      {pdfFiles.length === 0 ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-300 hover:bg-gray-50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const newFiles: File[] = [];
              let hasError = false;
              
              Array.from(e.dataTransfer.files).forEach(file => {
                if (file.type === 'application/pdf') {
                  newFiles.push(file);
                } else {
                  hasError = true;
                }
              });
              
              if (hasError) {
                setError('Certains fichiers ne sont pas au format PDF et ont été ignorés.');
              }
              
              if (newFiles.length > 0) {
                setPdfFiles(newFiles);
                setSelectedPdfIndex(0);
              }
            }
          }}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Déposez vos syllabus ici</h3>
          <p className="text-gray-600 mb-2">Glissez-déposez un ou plusieurs fichiers ou cliquez pour sélectionner</p>
          <p className="text-sm text-gray-500 mb-4">PDF, PowerPoint ou Word, max 10MB par fichier</p>
          
          <input 
            type="file" 
            accept=".pdf,.pptx,.ppt,.docx,.doc" 
            multiple
            className="hidden" 
            id="pdf-upload" 
            onChange={handleFileChange}
          />
          <label htmlFor="pdf-upload">
            <Button type="button" variant="outline">
              Sélectionner des fichiers PDF
            </Button>
          </label>
        </div>
      ) : !pdfFile ? (
        <div className="text-center py-8">
          <p className="text-gray-700 mb-4">Veuillez sélectionner un PDF à découper</p>
          <Button 
            type="button" 
            onClick={() => setSelectedPdfIndex(0)}
          >
            Sélectionner un PDF
          </Button>
        </div>
      ) : isProcessing ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Découpage et importation des chapitres... {uploadProgress}%
            </p>
          </div>
          <p className="text-gray-700">
            Veuillez patienter pendant que nous découpons votre syllabus en {cutPoints.length + 1} chapitres.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-medium">
                  {pdfFile.name} ({numPages} pages)
                </h3>
                <p className="text-sm text-gray-600">
                {isPdfFile(pdfFile) ? 
                  "Cliquez entre les pages pour ajouter un point de découpage" : 
                  "Ce type de fichier sera importé directement sans découpage"}
              </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const input = document.getElementById('pdf-upload-more') as HTMLInputElement;
                    if (input) input.click();
                  }}
                >
                  Ajouter plus de PDFs
                </Button>
                <input 
                  type="file" 
                  accept=".pdf" 
                  multiple
                  className="hidden" 
                  id="pdf-upload-more" 
                  onChange={handleFileChange}
                />
              </div>
            </div>
            
            {/* Liste des PDFs disponibles */}
            <div className="flex overflow-x-auto pb-2 mb-2 space-x-2">
              {pdfFiles.map((file, index) => (
                <div 
                  key={`pdf_${index}`}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm ${selectedPdfIndex === index ? 'bg-primary-100 text-primary-800 font-medium' : 'bg-gray-100 hover:bg-gray-200 cursor-pointer'}`}
                  onClick={() => setSelectedPdfIndex(index)}
                >
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  {selectedPdfIndex !== index && (
                    <button 
                      className="ml-1.5 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePdf(index);
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomOut}
                disabled={previewScale <= 0.3}
              >
                -
              </Button>
              <span className="text-sm">{Math.round(previewScale * 100)}%</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomIn}
                disabled={previewScale >= 1}
              >
                +
              </Button>
            </div>
          </div>
          
          {isPdfFile(pdfFile) ? (
            <>
              {/* Aperçu du PDF avec navigation */}
              <div className="border rounded-md p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft size={16} />
                    Précédent
                  </Button>
                  <span>
                    Page {currentPage} sur {numPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToNextPage}
                    disabled={currentPage >= numPages}
                  >
                    Suivant
                    <ChevronRight size={16} />
                  </Button>
                </div>
                
                <div className="flex justify-center">
                  <Document
                    file={pdfFile}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={<div className="text-center py-8">Chargement du PDF...</div>}
                    error={<div className="text-center py-8 text-red-600">Erreur de chargement du PDF</div>}
                  >
                    <Page 
                      pageNumber={currentPage} 
                      scale={previewScale * 2}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </div>
              
              {/* Miniatures avec points de découpage */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Points de découpage ({cutPoints.length})</h3>
                <div className="flex overflow-x-auto pb-4 space-x-2">
                  {Array.from(new Array(numPages), (_, index) => (
                    <div key={`thumb_${index + 1}`} className="flex flex-col items-center">
                      <div className="relative">
                        <Document file={pdfFile}>
                          <Page 
                            pageNumber={index + 1} 
                            width={80 * previewScale} 
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </Document>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 text-center">
                          {index + 1}
                        </div>
                      </div>
                      
                      {/* Bouton pour ajouter un point de découpage après cette page */}
                      {index < numPages - 1 && (
                        <button 
                          className={`mt-1 p-1 rounded-full ${
                            cutPoints.includes(index + 1) 
                              ? 'bg-red-500 text-white' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          onClick={() => toggleCutPoint(index + 1)}
                          title={cutPoints.includes(index + 1) 
                            ? `Supprimer le point de découpage après la page ${index + 1}` 
                            : `Ajouter un point de découpage après la page ${index + 1}`
                          }
                        >
                          {cutPoints.includes(index + 1) ? (
                            <X size={16} />
                          ) : (
                            <Scissors size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Aperçu des chapitres qui seront créés */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Chapitres qui seront créés ({cutPoints.length + 1})</h3>
                <div className="space-y-2">
                  {(() => {
                    const chapters = [];
                    let startPage = 1;
                    
                    // Ajouter les chapitres basés sur les points de découpage
                    for (const cutPoint of cutPoints) {
                      chapters.push({
                        start: startPage,
                        end: cutPoint,
                        title: `Chapitre ${chapters.length + 1}`
                      });
                      startPage = cutPoint + 1;
                    }
                    
                    // Ajouter le dernier chapitre
                    chapters.push({
                      start: startPage,
                      end: numPages,
                      title: `Chapitre ${chapters.length + 1}`
                    });
                    
                    return chapters.map((chapter, index) => (
                      <div 
                        key={`chapter_${index}`} 
                        className="flex items-center p-2 bg-gray-50 rounded-md border"
                      >
                        <FileText size={18} className="text-primary-600 mr-2" />
                        <div>
                          <span className="font-medium">{chapter.title}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            (Pages {chapter.start} à {chapter.end})
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="border rounded-md p-6 mb-6 bg-gray-50 text-center">
              <div className="flex justify-center mb-4">
                {pdfFile?.type.includes('presentation') || pdfFile?.type.includes('powerpoint') ? (
                  <FileType size={48} className="text-amber-500" />
                ) : (
                  <File size={48} className="text-blue-500" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-2">
                {pdfFile?.type.includes('presentation') || pdfFile?.type.includes('powerpoint') ? 
                  'Fichier PowerPoint détecté' : 
                  'Fichier Word détecté'}
              </h3>
              <p className="text-gray-600 mb-4">
                Ce type de fichier sera importé en tant que chapitre unique.<br />
                Le découpage n'est disponible que pour les fichiers PDF.
              </p>
              <div className="p-3 bg-gray-100 rounded-md inline-block">
                <div className="flex items-center">
                  {getFileIcon(pdfFile?.type || '')}
                  <span className="font-medium">{pdfFile?.name}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={splitPdf}
              disabled={isPdfFile(pdfFile) && cutPoints.length === 0}
            >
              <Scissors size={16} className="mr-2" />
              {isPdfFile(pdfFile) ? 
                `Découper en ${cutPoints.length + 1} chapitres` : 
                'Importer comme chapitre'}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default PdfSplitter;
