import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ChevronLeft } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Concept } from '../../../types/concepts';

const GPTQuizPreparationActivity: React.FC = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportConcepts = async () => {
    if (!pathId || isExporting) return;

    try {
      setIsExporting(true);
      console.log("Starting export for path:", pathId);

      // Récupérer directement les concepts du path
      const conceptsRef = collection(db, 'paths', pathId, 'concepts');
      const snapshot = await getDocs(conceptsRef);
      
      if (snapshot.empty) {
        console.log("No concepts found for this path");
        return;
      }

      const concepts: Concept[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Concept));

      // Créer le CSV
      const headers = ['ID', 'Name', 'What', 'How', 'Why', 'Key Points', 'Custom Fields'];
      const rows = concepts.map(concept => [
        concept.id,
        concept.name || '',
        concept.what || '',
        concept.how || '',
        concept.why || '',
        concept.keyPoints || '',
        concept.customFields?.map(field => `${field.label}: ${field.value}`).join('; ') || ''
      ]);

      // Convertir en CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `concepts-${pathId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Export completed successfully");
    } catch (error) {
      console.error("Error during export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/paths/${pathId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour au parcours
            </button>
            <h1 className="text-2xl font-bold">Préparation des quiz</h1>
          </div>
          <button
            onClick={handleExportConcepts}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Export en cours...' : 'Exporter les concepts'}
          </button>
        </div>
        <div className="space-y-4">
          <div 
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.open(`/paths/${pathId}/gpt/quiz-master?gpt=true`, '_blank')}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">QuizMaster GPT</h2>
                <p className="text-gray-600 mb-4">
                  Assistant IA pour créer des questions de quiz personnalisées basées sur vos concepts clés
                </p>
              </div>
              <Download size={24} className="text-blue-600" />
            </div>
          </div>

          <div 
            className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.open(`/paths/${pathId}/gpt/quiz-evaluator?gpt=true`, '_blank')}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">QuizEvaluator GPT</h2>
                <p className="text-gray-600 mb-4">
                  Assistant IA pour passer des quiz et évaluer votre compréhension des concepts
                </p>
              </div>
              <Download size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPTQuizPreparationActivity;
