import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ChevronLeft } from 'lucide-react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CustomField } from '../../../types/concepts';

interface GPTQuizPreparationProps {
  data: {
    step: {
      id: string;
      title: string;
      completed: boolean;
    };
    phase: any;
    pathId: string;
    pathData: any;
  };
}

interface ConceptExport {
  id: string;
  name: string;
  what: string;
  how: string;
  why: string;
  keyPoints: string;
  customFields: CustomField[];
}

export function GPTQuizPreparation({ data }: GPTQuizPreparationProps) {
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  const handleExportClick = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      console.log('Starting export...');

      const courseId = data.pathData.courseId;
      const pathId = data.pathId;
      
      if (!courseId || !pathId) {
        throw new Error('Course ID or Path ID not found');
      }

      console.log('Exporting concepts for path:', pathId);

      // Récupérer les concepts directement depuis le path
      const conceptsRef = collection(db, 'paths', pathId, 'concepts');
      const conceptsSnapshot = await getDocs(conceptsRef);
      
      if (conceptsSnapshot.empty) {
        console.log('No concepts found');
        return;
      }

      // Récupérer les informations du cours
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      const courseName = courseDoc.exists() ? courseDoc.data().title : 'Unknown Course';

      // Préparer les concepts pour l'export
      const concepts: ConceptExport[] = conceptsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          what: data.what || '',
          how: data.how || '',
          why: data.why || '',
          keyPoints: data.keyPoints || '',
          customFields: (data.customFields || []) as CustomField[]
        };
      });

      console.log(`Found ${concepts.length} concepts`);

      // Créer le contenu CSV
      const headers = ['ID', 'Nom', 'Quoi', 'Comment', 'Pourquoi', 'Points clés', 'Champs personnalisés'];
      
      const rows = concepts.map(concept => [
        concept.id,
        concept.name,
        concept.what,
        concept.how,
        concept.why,
        concept.keyPoints,
        concept.customFields.map((field: CustomField) => `${field.label}: ${field.value}`).join('; ')
      ]);

      // Générer le contenu CSV
      const csvContent = [
        `"${courseName} - Export des concepts"`,
        '',
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `concepts-${courseName.toLowerCase().replace(/\s+/g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Export completed successfully');
    } catch (error) {
      console.error('Error during export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(`/paths/${data.pathId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au parcours
        </button>
        <h1 className="text-2xl font-bold">Préparation de Quiz</h1>
      </div>
      <div className="space-y-4">
        <div 
          className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => window.open(`/paths/${data.pathId}/gpt/quiz-master?gpt=true`, '_blank')}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">QuizMaster GPT</h2>
              <p className="text-gray-600 mb-4">
                Assistant IA pour créer des questions de quiz personnalisées basées sur vos concepts clés
              </p>
            </div>
            <ExternalLink size={24} className="text-blue-600" />
          </div>
        </div>

        <div 
          className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => window.open(`/paths/${data.pathId}/gpt/quiz-evaluator?gpt=true`, '_blank')}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">QuizEvaluator GPT</h2>
              <p className="text-gray-600 mb-4">
                Assistant IA pour passer des quiz et évaluer votre compréhension des concepts
              </p>
            </div>
            <ExternalLink size={24} className="text-blue-600" />
          </div>
        </div>

        <button
          onClick={handleExportClick}
          disabled={isExporting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isExporting ? 'Export en cours...' : 'Télécharger tous les concepts clés pour QuizMaster'}
        </button>
      </div>
    </div>
  );
}
