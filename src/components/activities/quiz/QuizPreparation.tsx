import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Loader2, Eye, Trash2, ChevronUp, ChevronDown, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { generateQuestionsForConcept, saveQuestionsToDatabase, getQuizQuestions, deleteQuestions, deleteAllQuizQuestions } from '../../../services/quizService';
import { toast } from 'react-hot-toast';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { QuizQuestion, QuizQuestionConcept } from '../../../types/questions';
import Modal from "../../../components/shared/Modal";

interface QuizPreparationProps {
  pathId?: string;
  courseId?: string;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  hasConcepts: boolean;
  conceptsWithoutQuestions: string[];
}

interface Concept {
  id: string;
  name: string;
  description: string;
  explanation: string;
  what: string;
  userId: string;
  chapterId: string;
  createdAt: string;
  customFields?: Record<string, any>;
}

interface GeneratedQuestion extends QuizQuestion {
  chapterId: string;
  concept: QuizQuestionConcept;
}

export function QuizPreparation({ pathId, courseId }: QuizPreparationProps) {
  console.log('QuizPreparation props:', { pathId, courseId });

  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<GeneratedQuestion | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<{ [key: string]: boolean }>({});
  const [shouldReloadQuestions, setShouldReloadQuestions] = useState(true);

  useEffect(() => {
    if (courseId) {
      setCurrentCourseId(courseId);
      loadChapters();
    }
  }, [courseId, user]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || (!pathId && !courseId) || !shouldReloadQuestions) return;
      
      try {
        setLoading(true);
        
        let finalCourseId: string;
        
        if (pathId) {
          const pathDoc = await getDoc(doc(db, 'learningPaths', pathId));
          if (!pathDoc.exists()) {
            toast.error('Erreur: Parcours non trouvé');
            return;
          }
          
          const pathData = pathDoc.data();
          if (!pathData.courseId) {
            toast.error('Erreur: Cours non trouvé dans le parcours');
            return;
          }
          
          finalCourseId = pathData.courseId;
        } else if (courseId) {
          const courseDoc = await getDoc(doc(db, 'courses', courseId));
          if (!courseDoc.exists()) {
            toast.error('Erreur: Cours non trouvé');
            return;
          }
          
          finalCourseId = courseId;
        } else {
          toast.error('Erreur: Identifiant non fourni');
          return;
        }

        setCurrentCourseId(finalCourseId);
        
        if (user.uid) {
          const questions = await getQuizQuestions(finalCourseId, user.uid);
          if (questions.length > 0) {
            setGeneratedQuestions(questions as GeneratedQuestion[]);
          }
        }

        setShouldReloadQuestions(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, pathId, courseId, shouldReloadQuestions]);

  const getConceptsWithoutQuestions = async (chapterId: string): Promise<string[]> => {
    if (!user) return [];

    try {
      const conceptsWithoutQuestions: string[] = [];

      // Récupérer tous les concepts
      const conceptsRef = collection(db, 'concepts');
      const conceptsQuery = query(
        conceptsRef,
        where('chapterId', '==', chapterId),
        where('userId', '==', user.uid)
      );
      const conceptsSnapshot = await getDocs(conceptsQuery);

      // Pour chaque concept, vérifier s'il a des questions clés
      for (const conceptDoc of conceptsSnapshot.docs) {
        const keyQuestionsQuery = query(
          collection(db, 'keyQuestions'),
          where('conceptId', '==', conceptDoc.id),
          where('userId', '==', user.uid)
        );
        const keyQuestionsSnapshot = await getDocs(keyQuestionsQuery);

        if (keyQuestionsSnapshot.empty) {
          const conceptData = conceptDoc.data();
          conceptsWithoutQuestions.push(conceptData.name || 'Concept sans nom');
        }
      }

      return conceptsWithoutQuestions;
    } catch (error) {
      console.error('Error checking concepts without key questions:', error);
      return [];
    }
  };

  const loadChapters = async () => {
    if (!user || !courseId) return;

    try {
      setLoading(true);

      // Charger les chapitres
      const chaptersRef = collection(db, 'chapters');
      const q = query(chaptersRef, where('courseId', '==', courseId));
      const querySnapshot = await getDocs(q);
      
      const chaptersData: Chapter[] = [];
      
      for (const chapterDoc of querySnapshot.docs) {
        const chapterData = chapterDoc.data();
        
        // Vérifier s'il y a des concepts sans questions
        const conceptsRef = collection(db, 'concepts');
        const conceptsQuery = query(
          conceptsRef,
          where('chapterId', '==', chapterDoc.id),
          where('userId', '==', user.uid)
        );
        const conceptsSnapshot = await getDocs(conceptsQuery);
        
        const conceptsWithoutQuestions = await getConceptsWithoutQuestions(chapterDoc.id);
        
        chaptersData.push({
          id: chapterDoc.id,
          title: chapterData.title,
          order: chapterData.order || 0,
          hasConcepts: !conceptsSnapshot.empty,
          conceptsWithoutQuestions
        });
      }
      
      // Trier les chapitres par ordre
      chaptersData.sort((a, b) => a.order - b.order);
      
      setChapters(chaptersData);
    } catch (error) {
      console.error('Error loading chapters:', error);
      toast.error('Erreur lors du chargement des chapitres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadChaptersAndVerifyContent = async () => {
      if (!user || !currentCourseId) return;

      setLoading(true);
      try {
        // Charger les chapitres
        const chaptersQuery = query(
          collection(db, 'chapters'),
          where('courseId', '==', currentCourseId)
        );
        const chaptersSnapshot = await getDocs(chaptersQuery);
        console.log('Found chapters:', chaptersSnapshot.docs.length);

        const chaptersData: Chapter[] = chaptersSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Chapter data:', data);
          return {
            id: doc.id,
            title: data.title,
            order: data.order || 0,
            hasConcepts: false,
            conceptsWithoutQuestions: []
          };
        });

        // Vérifier les concepts pour chaque chapitre
        for (const chapter of chaptersData) {
          console.log('Checking concepts for chapter:', chapter.id);
          const conceptsQuery = query(
            collection(db, 'concepts'),
            where('chapterId', '==', chapter.id),
            where('userId', '==', user.uid)
          );
          const conceptsSnapshot = await getDocs(conceptsQuery);
          console.log('Found concepts:', conceptsSnapshot.docs.length);
          chapter.hasConcepts = conceptsSnapshot.docs.length > 0;

          // Pour chaque concept, vérifier s'il a des questions clés
          for (const conceptDoc of conceptsSnapshot.docs) {
            const conceptData = conceptDoc.data();
            console.log('Checking key questions for concept:', conceptData.name);
            
            // Vérifier dans la collection keyQuestions
            const keyQuestionsQuery = query(
              collection(db, 'keyQuestions'),
              where('conceptId', '==', conceptDoc.id),
              where('userId', '==', user.uid)
            );
            const keyQuestionsSnapshot = await getDocs(keyQuestionsQuery);
            
            // Si le concept n'a pas de questions clés, on l'ajoute à la liste
            if (keyQuestionsSnapshot.empty) {
              chapter.conceptsWithoutQuestions.push(conceptData.name);
            }
          }
        }

        // Trier les chapitres par ordre
        chaptersData.sort((a, b) => a.order - b.order);
        console.log('Final chapters data:', chaptersData);
        setChapters(chaptersData);
      } catch (error) {
        console.error('Error loading chapters:', error);
        toast.error('Erreur lors du chargement des chapitres');
      } finally {
        setLoading(false);
      }
    };

    loadChaptersAndVerifyContent();
  }, [user, currentCourseId]);

  const handleDeleteQuestion = async (questionToDelete: GeneratedQuestion) => {
    if (!currentCourseId || !user?.uid) return;
    
    try {
      await deleteQuestions([questionToDelete.id]);
      setGeneratedQuestions(prev => prev.filter(q => q !== questionToDelete));
      toast.success('Question supprimée avec succès');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Erreur lors de la suppression de la question');
    }
  };

  const handleGenerateQuestions = async (chapterId: string) => {
    try {
      setIsGenerating(true);
      const chapter = chapters.find(c => c.id === chapterId);
      if (!chapter || !currentCourseId || !user?.uid) {
        console.error('Missing required data:', { chapter, currentCourseId, userId: user?.uid });
        return;
      }

      console.log('Starting question generation for chapter:', { chapterId, currentCourseId, userId: user?.uid });

      // Récupérer les concepts du chapitre
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('chapterId', '==', chapterId)
      );
      
      const conceptsSnapshot = await getDocs(conceptsQuery);
      const concepts = conceptsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Concept data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data
        };
      }) as Concept[];

      console.log(`Found ${concepts.length} concepts for chapter ${chapterId}`);
      
      const newGeneratedQuestions: GeneratedQuestion[] = [];
      
      for (const concept of concepts) {
        console.log(`Starting generation for concept:`, concept);
        if (!pathId) {
          console.error('PathId is missing');
          continue;
        }

        try {
          console.log('Calling generateQuestionsForConcept with:', {
            courseId: currentCourseId,
            userId: user.uid,
            conceptId: concept.id,
            pathId
          });

          const questions = await generateQuestionsForConcept(
            currentCourseId,
            user.uid,
            concept.id,
            pathId
          );

          console.log(`Generated ${questions.length} questions for concept ${concept.name}:`, questions);
          
          if (questions.length === 0) {
            console.warn('No questions were generated for concept:', concept.name);
            continue;
          }

          // S'assurer que chaque question a les propriétés requises de GeneratedQuestion
          const formattedQuestions = questions.map(question => ({
            ...question,
            chapterId,
            concept: {
              id: concept.id,
              name: concept.name,
              description: concept.description,
              explanation: concept.explanation,
              what: concept.what
            }
          }));

          console.log('Formatted questions:', formattedQuestions);

          // Sauvegarder les questions
          try {
            console.log('Saving questions to database...');
            const savedQuestions = await saveQuestionsToDatabase(
              formattedQuestions,
              user.uid,
              currentCourseId,
              pathId
            );
            console.log('Questions saved successfully:', savedQuestions);

            // Convertir les questions sauvegardées en GeneratedQuestion
            const savedGeneratedQuestions = savedQuestions.map(q => ({
              ...q,
              chapterId,
              concept: {
                id: concept.id,
                name: concept.name,
                description: concept.description,
                explanation: concept.explanation,
                what: concept.what
              }
            })) as GeneratedQuestion[];

            newGeneratedQuestions.push(...savedGeneratedQuestions);
          } catch (error) {
            console.error('Error saving questions:', error);
            toast.error(`Erreur lors de la sauvegarde des questions pour le concept ${concept.name}`);
          }
        } catch (error) {
          console.error('Error generating questions for concept:', concept.name, error);
          toast.error(`Erreur lors de la génération des questions pour le concept ${concept.name}`);
        }
      }

      if (newGeneratedQuestions.length > 0) {
        setGeneratedQuestions(prev => [...prev, ...newGeneratedQuestions]);
        toast.success('Questions générées avec succès');
      } else {
        toast.error('Aucune question n\'a été générée');
      }
    } catch (error) {
      console.error('Error in handleGenerateQuestions:', error);
      toast.error('Erreur lors de la génération des questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteChapterQuestions = async (chapterId: string) => {
    if (!user?.uid || !currentCourseId) return;

    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer toutes les questions de ce chapitre ?"
    );

    if (!confirmed) return;

    try {
      // 1. Récupérer les IDs des questions à supprimer
      const questionsQuery = query(
        collection(db, 'quizQuestions'),
        where('userId', '==', user.uid),
        where('courseId', '==', currentCourseId),
        where('chapterId', '==', chapterId)
      );
      
      const questionIdsToDelete = (await getDocs(questionsQuery)).docs.map(doc => doc.id);

      // 2. Supprimer les questions de la base de données
      if (questionIdsToDelete.length > 0) {
        await deleteQuestions(questionIdsToDelete);
        
        // 3. Mettre à jour l'état local
        setGeneratedQuestions(prev => 
          prev.filter(q => q.chapterId !== chapterId)
        );

        toast.success('Questions supprimées avec succès');
      } else {
        toast('Aucune question à supprimer', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error deleting chapter questions:', error);
      toast.error('Erreur lors de la suppression des questions');
    }
  };

  const handleResetQuestions = async () => {
    if (!user?.uid || !currentCourseId) return;

    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir réinitialiser toutes les questions de quiz ? Cette action est irréversible."
    );
    if (!confirmed) return;

    try {
      await deleteAllQuizQuestions(currentCourseId, user.uid);
      setGeneratedQuestions([]);
      // Forcer le rechargement des questions depuis la base de données
      setShouldReloadQuestions(true);
      toast.success('Questions réinitialisées avec succès');
    } catch (error) {
      console.error('Error resetting questions:', error);
      toast.error('Erreur lors de la réinitialisation des questions');
    }
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-2xl font-bold">Préparation du Quiz</h1>
        </div>
        {generatedQuestions.length > 0 && (
          <button
            onClick={handleResetQuestions}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Réinitialiser toutes les questions
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : (
        <div className="space-y-6">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">{chapter.title}</h3>
                {chapter.hasConcepts && chapter.conceptsWithoutQuestions.length === 0 && (
                  <button
                    onClick={() => handleGenerateQuestions(chapter.id)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isGenerating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gold text-white hover:bg-gold/90'
                    }`}
                  >
                    {isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Génération en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Wand2 className="w-4 h-4" />
                        <span>Générer des questions de quiz</span>
                      </div>
                    )}
                  </button>
                )}
              </div>

              {!chapter.hasConcepts ? (
                <div className="bg-orange-50 text-orange-800 p-4 rounded-lg">
                  <p>Ce chapitre n'a pas de concepts clés. Ajoutez des concepts avant de générer des questions.</p>
                </div>
              ) : chapter.conceptsWithoutQuestions.length > 0 ? (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
                  <p>Certains concepts n'ont pas de questions clés :</p>
                  <ul className="list-disc list-inside mt-2">
                    {chapter.conceptsWithoutQuestions.map((conceptName, index) => (
                      <li key={index}>{conceptName}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-green-50 text-green-800 p-4 rounded-lg">
                  <p>Ce chapitre est prêt pour la génération de questions de quiz.</p>
                </div>
              )}

              {generatedQuestions.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">Questions générées :</h4>
                      <div className="text-sm text-gray-600">
                        ({generatedQuestions.filter(q => q.chapterId === chapter.id).length} question{generatedQuestions.filter(q => q.chapterId === chapter.id).length > 1 ? 's' : ''})
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleChapterExpansion(chapter.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={expandedChapters[chapter.id] ? "Réduire" : "Développer"}
                      >
                        {expandedChapters[chapter.id] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {expandedChapters[chapter.id] && (
                    <>
                      <div className="space-y-4">
                        {generatedQuestions
                          .filter(question => question.chapterId === chapter.id)
                          .map((question, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{question.question}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setSelectedQuestion(question)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(question)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => handleDeleteChapterQuestions(chapter.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer toutes les questions du chapitre
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedQuestion && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQuestion(null)}
          title="Détails de la question"
        >
          <div className="space-y-4 p-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Question :</h3>
              <p className="text-gray-700">{selectedQuestion.question}</p>
            </div>

            {selectedQuestion.options && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Options :</h3>
                <ul className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <li key={index} className="text-gray-700 pl-4">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Feedback :</h3>
              <p className="text-gray-700">{selectedQuestion.feedback}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Type de question :</h3>
              <p className="text-gray-700">{selectedQuestion.type}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Niveau de difficulté :</h3>
              <p className={`text-gray-700 capitalize ${
                selectedQuestion.difficultyLevel === 'level_1' ? 'text-green-600' :
                selectedQuestion.difficultyLevel === 'level_2' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {selectedQuestion.difficultyLevel === 'level_1' && 'Facile'}
                {selectedQuestion.difficultyLevel === 'level_2' && 'Moyen'}
                {selectedQuestion.difficultyLevel === 'level_3' && 'Difficile'}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Points :</h3>
              <p className="text-gray-700">{selectedQuestion.points} point{selectedQuestion.points > 1 ? 's' : ''}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Aspect ciblé :</h3>
              <p className="text-gray-700 capitalize">
                {selectedQuestion.aspect === 'what' && 'Quoi'}
                {selectedQuestion.aspect === 'how' && 'Comment'}
                {selectedQuestion.aspect === 'why' && 'Pourquoi'}
                {selectedQuestion.aspect === 'who' && 'Qui'}
                {selectedQuestion.aspect === 'when' && 'Quand'}
                {selectedQuestion.aspect === 'where' && 'Où'}
                {selectedQuestion.aspect === 'keyPoints' && 'Points clés'}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Concept associé :</h3>
              <p className="text-gray-700">{selectedQuestion.concept.name}</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedQuestion(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}