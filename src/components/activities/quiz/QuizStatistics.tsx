import { BarChart2, Trophy, ArrowRight } from 'lucide-react';
import { types } from './types';

interface QuizStatisticsProps {
  score: {
    correct: number;
    total: number;
  };
  questions: types.QuizQuestion[];
  results: types.QuizResult[];
  onComplete: () => void;
}

export function QuizStatistics({ score, questions, results, onComplete }: QuizStatisticsProps) {
  // Calculer les statistiques par concept en tenant compte de toutes les tentatives
  const conceptStats = questions.reduce((acc: Record<string, any>, question) => {
    const conceptResults = results.filter(r => {
      const resultQuestion = questions.find(q => q.id === r.questionId);
      return resultQuestion?.concept === question.concept;
    });
    
    if (!acc[question.concept]) {
      acc[question.concept] = {
        concept: question.concept,
        explanation: question.conceptExplanation,
        totalAttempts: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalQuestions: 0,
        masteryPercentage: 0
      };
    }

    const stats = acc[question.concept];
    
    // Grouper les résultats par questionId pour compter les tentatives
    const questionResults = conceptResults.filter(r => r.questionId === question.id);
    
    if (questionResults.length > 0) {
      stats.totalQuestions++;
      stats.totalAttempts += questionResults.length;
      
      // Compter chaque tentative séparément
      questionResults.forEach(result => {
        if (result.isCorrect) {
          stats.correctAnswers++;
        } else {
          stats.incorrectAnswers++;
        }
      });
    }

    // Calculer le pourcentage de maîtrise en tenant compte de toutes les tentatives
    stats.masteryPercentage = stats.totalAttempts > 0 
      ? Math.round((stats.correctAnswers / stats.totalAttempts) * 100)
      : 0;

    return acc;
  }, {});

  const sortedStats = Object.values(conceptStats).sort(
    (a: any, b: any) => b.masteryPercentage - a.masteryPercentage
  );

  const needsRevision = sortedStats.filter((stat: any) => stat.masteryPercentage < 70);

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-gold" />
          </div>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz terminé !</h3>
            <p className="text-gray-600 mb-4">
              Vous avez obtenu {score.correct} bonnes réponses sur {score.total} questions.
            </p>
            <div className="text-4xl font-bold text-gold">
              {Math.round((score.correct / score.total) * 100)}%
            </div>
          </div>
        </div>
      </section>

      {/* Concept-by-Concept Analysis */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-start gap-4 mb-6">
          <BarChart2 className="w-6 h-6 text-gold flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold">Analyse par concept</h3>
            <p className="text-gray-600">Détail de vos performances pour chaque concept clé</p>
          </div>
        </div>

        <div className="space-y-6">
          {sortedStats.map((stat: any) => (
            <div key={stat.concept} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium text-lg">{stat.concept}</h4>
                  <p className="text-gray-600 text-sm">{stat.explanation}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gold">
                    {stat.masteryPercentage}%
                  </div>
                  <p className="text-sm text-gray-500">de maîtrise</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold">{stat.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {stat.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Réponses correctes</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-amber-600">
                    {stat.totalAttempts - stat.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Réponses incorrectes</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Tentatives totales : {stat.totalAttempts}</span>
                  <span>Taux de réussite : {stat.masteryPercentage}%</span>
                </div>
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="h-2 bg-gold transition-all duration-300"
                    style={{ width: `${stat.masteryPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Concepts to Review */}
      {needsRevision.length > 0 && (
        <section className="bg-amber-50 rounded-lg shadow-sm p-8">
          <h3 className="font-semibold text-amber-900 mb-4">Concepts à revoir</h3>
          <div className="space-y-3">
            {needsRevision.map((stat: any) => (
              <div key={stat.concept} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-amber-900">{stat.concept}</p>
                  <p className="text-sm text-amber-800">
                    {stat.correctAnswers} réponses correctes sur {stat.totalAttempts} tentatives
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Complete Button */}
      <div className="flex justify-center">
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
        >
          Terminer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}