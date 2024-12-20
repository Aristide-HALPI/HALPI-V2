import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MigrationService } from '../../services/migrationService';
import { toast } from 'react-hot-toast';
import { ArrowRight, Check, AlertTriangle } from 'lucide-react';

export default function DataMigration() {
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState<{
    migrated: number;
    errors: number;
  } | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    oldCollectionCount: number;
    newCollectionCount: number;
    success: boolean;
  } | null>(null);

  const handleMigration = async () => {
    if (!user) return;

    try {
      setMigrating(true);

      // Vérifier s'il reste des questions à migrer
      const remaining = await MigrationService.checkRemainingQuestions(user.uid);
      
      if (remaining === 0) {
        toast.success('Aucune question à migrer !');
        return;
      }

      // Effectuer la migration
      const stats = await MigrationService.migrateQuestionsToQuizQuestions(user.uid);
      setMigrationStats(stats);

      // Vérifier la migration
      const verification = await MigrationService.verifyMigration(user.uid);
      setVerificationResult(verification);

      if (verification.success) {
        toast.success('Migration terminée avec succès !');
      } else {
        toast.error('La migration a rencontré des problèmes.');
      }
    } catch (error) {
      console.error('Error during migration:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Migration des données</h2>
        <p className="text-gray-600">
          Cette opération va migrer les questions de l'ancienne collection vers la nouvelle.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleMigration}
          disabled={migrating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {migrating ? (
            'Migration en cours...'
          ) : (
            <>
              Démarrer la migration
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {migrationStats && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Résultats de la migration</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>{migrationStats.migrated} questions migrées</span>
              </li>
              {migrationStats.errors > 0 && (
                <li className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{migrationStats.errors} erreurs rencontrées</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {verificationResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Vérification</h3>
            <ul className="space-y-2">
              <li>
                Ancienne collection : {verificationResult.oldCollectionCount} questions
              </li>
              <li>
                Nouvelle collection : {verificationResult.newCollectionCount} questions
              </li>
              <li className={verificationResult.success ? 'text-green-600' : 'text-red-600'}>
                Statut : {verificationResult.success ? 'Migration réussie' : 'Migration incomplète'}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
