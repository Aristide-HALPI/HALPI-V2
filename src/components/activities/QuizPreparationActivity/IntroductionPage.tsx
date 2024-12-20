import { useState } from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { types } from './types';
import { exportConceptsToCSV } from '../../../utils/exportUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const QUIZ_MASTER_URL = import.meta.env.VITE_QUIZ_MASTER_URL;
const QUIZ_EVALUATOR_URL = import.meta.env.VITE_QUIZ_EVALUATOR_URL;

interface IntroductionPageProps {
  data: types.QuizPreparationActivityProps['data'];
  onVersionSelect: (version: 'halpi' | 'gpt') => void;
}

export function IntroductionPage({ data, onVersionSelect }: IntroductionPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ pathId: string }>();
  const showGPTOptions = location.search === '?gpt=true';
  const { user } = useAuth();

  const handleExportConcepts = async () => {
    try {
      if (!data || !data.courseId) {
        console.error('No courseId provided');
        return;
      }

      const courseId = data.courseId;
      console.log('Exporting concepts for course:', courseId);

      // Récupérer d'abord les chapitres du cours
      const chaptersRef = collection(db, 'chapters');
      const chaptersQuery = query(
        chaptersRef,
        where('courseId', '==', courseId)
      );
      const chaptersSnapshot = await getDocs(chaptersQuery);
      const chapterIds = chaptersSnapshot.docs.map(doc => doc.id);

      // Ensuite récupérer les concepts pour tous les chapitres
      const conceptsRef = collection(db, 'concepts');
      const conceptsQuery = query(
        conceptsRef,
        where('userId', '==', user?.uid),
        where('chapterId', 'in', chapterIds)
      );
      const conceptsSnapshot = await getDocs(conceptsQuery);
      
      if (conceptsSnapshot.empty) {
        console.log('No concepts found');
        return;
      }

      const concepts = conceptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        userId: doc.data().userId || '',
        chapterId: doc.data().chapterId || '',
        createdAt: doc.data().createdAt || new Date().toISOString(),
        name: doc.data().name || '',
        what: doc.data().what || '',
        how: doc.data().how || '',
        why: doc.data().why || '',
        customFields: doc.data().customFields || []
      }));
      
      console.log(`Found ${concepts.length} concepts`);
      await exportConceptsToCSV(concepts);
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Failed to export concepts:', error);
    }
  };

  if (showGPTOptions) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
            Retour
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">
          Préparation de Quiz avec GPTs
        </h1>

        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div>
              <h2 className="text-xl font-semibold mb-2">QuizMaster GPT</h2>
              <p className="text-gray-600 mb-4">
                Assistant IA pour créer des questions de quiz personnalisées basées sur vos concepts clés
              </p>
            </div>
            <a 
              href="https://chatgpt.com/g/g-6760a710c9248191aa9086daaffcef0e-halpi-quiz-master"
              className="flex items-center text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="mr-1">Ouvrir</span>
              <ExternalLink size={20} />
            </a>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div>
              <h2 className="text-xl font-semibold mb-2">QuizEvaluator GPT</h2>
              <p className="text-gray-600 mb-4">
                Assistant IA pour passer des quiz et évaluer votre compréhension des concepts
              </p>
            </div>
            <a 
              href="https://chatgpt.com/g/g-6760bc1812a48191b2032ddf789c9208-halpi-quiz-evaluator"
              className="flex items-center text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="mr-1">Ouvrir</span>
              <ExternalLink size={20} />
            </a>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div>
              <h2 className="text-xl font-semibold mb-2">QuizProgressor GPT</h2>
              <p className="text-gray-600 mb-4">
                Assistant IA pour générer des quiz adaptatifs qui évoluent selon votre niveau de compréhension
              </p>
            </div>
            <a 
              href="https://chatgpt.com/g/g-6761e0977a70819193f95f002c142e01-halpi-quiz-progressor"
              className="flex items-center text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="mr-1">Ouvrir</span>
              <ExternalLink size={20} />
            </a>
          </div>

          <button
            onClick={handleExportConcepts}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Télécharger tous les concepts clés pour QuizMaster
          </button>

          <button
            onClick={() => navigate('.')}
            className="w-full p-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
          Retour
        </button>
      </div>

      <div className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Choisissez votre méthode de préparation de quiz
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <button
            onClick={() => onVersionSelect('halpi')}
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h2 className="text-xl font-semibold mb-4">HALPI - Préparation de Quiz</h2>
            <p className="text-gray-600">
              Interface classique pour créer et passer des quiz interactifs
            </p>
          </button>

          <button
            onClick={() => navigate('?gpt=true')}
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
          >
            <h2 className="text-xl font-semibold mb-4">GPTs - Préparation de Quiz</h2>
            <p className="text-gray-600">
              Assistants IA pour générer et évaluer vos quiz
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
