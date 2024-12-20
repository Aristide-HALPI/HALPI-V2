import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { IdentificationPhase } from './IdentificationPhase';
import { ExplanationPhase } from './ExplanationPhase';
import { types } from './types';
import { IntroductionPage } from './IntroductionPage';

type Version = 'intro' | 'halpi' | 'gpt';

export function KeyConcepts2Activity({ data }: types.KeyConcepts2ActivityProps) {
  const [currentVersion, setCurrentVersion] = useState<Version>('intro');

  const handleVersionSelect = (version: 'halpi' | 'gpt') => {
    setCurrentVersion(version);
  };

  // Afficher la version appropriée
  switch (currentVersion) {
    case 'intro':
      return <IntroductionPage onVersionSelect={handleVersionSelect} />;
    case 'halpi':
      return (
        <OriginalKeyConcepts2Activity data={data} />
      );
    default:
      return <IntroductionPage onVersionSelect={handleVersionSelect} />;
  }
}

// Renommer le composant original
function OriginalKeyConcepts2Activity({ data }: types.KeyConcepts2ActivityProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<types.Concept[]>([]);
  const [foundConcepts, setFoundConcepts] = useState<types.FoundConcept[]>([]);
  const [validatedConcepts, setValidatedConcepts] = useState<types.ValidatedConcept[]>([]);
  const [phase, setPhase] = useState<'identification' | 'explanation'>('identification');
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les concepts depuis Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Chargement des concepts...');
    console.log('UserId:', user.uid);
    console.log('ChapterId:', data?.step?.chapterId);

    let queryConstraints = [where('userId', '==', user.uid)];
    if (data?.step?.chapterId) {
      queryConstraints.push(where('chapterId', '==', data.step.chapterId));
    }

    const conceptsQuery = query(collection(db, 'concepts'), ...queryConstraints);

    const unsubscribe = onSnapshot(
      conceptsQuery,
      (snapshot) => {
        const conceptsData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Données du concept brutes:', data);
          return {
            id: doc.id,
            concept: data.name || '',
            vulgarisation: data.vulgarisation || '',
            who: data.who || '',
            what: data.what || '',
            why: data.why || '',
            how: data.how || '',
            when: data.when || '',
            where: data.where || '',
            keyPoints: data.keyPoints || [],
            image: data.image || ''
          };
        });

        console.log('Concepts transformés:', conceptsData);
        console.log(`${conceptsData.length} concepts chargés`);
        setConcepts(conceptsData);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur lors du chargement des concepts:', error);
        setError('Une erreur est survenue lors du chargement des concepts. Veuillez réessayer.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, data?.step?.chapterId]);

  // Charger la progression depuis Firestore
  useEffect(() => {
    if (!user || !data?.step?.id) return;

    console.log('Chargement de la progression...');
    console.log('UserId:', user.uid);
    console.log('StepId:', data.step.id);

    const progressQuery = query(
      collection(db, 'conceptsProgress'),
      where('userId', '==', user.uid),
      where('stepId', '==', data.step.id)
    );

    const unsubscribe = onSnapshot(progressQuery, (snapshot) => {
      console.log('Progression trouvée:', snapshot.empty ? 'Non' : 'Oui');
      
      if (!snapshot.empty) {
        const progressData = snapshot.docs[0].data();
        console.log('Données brutes de progression:', JSON.stringify(progressData, null, 2));

        // Restaurer les concepts validés
        if (Array.isArray(progressData.validatedConcepts)) {
          console.log('ValidatedConcepts brut:', JSON.stringify(progressData.validatedConcepts, null, 2));
          const validValidatedConcepts = progressData.validatedConcepts
            .filter((vc: types.ValidatedConcept) => {
              const isValid = vc && typeof vc === 'object' && 
                            vc.concept && typeof vc.concept === 'string' &&
                            vc.score && typeof vc.score === 'number' &&
                            vc.fields && Array.isArray(vc.fields);
              
              if (!isValid) {
                console.log('Concept invalide trouvé:', vc);
              }
              return isValid;
            })
            .map((vc: types.ValidatedConcept) => ({
              concept: vc.concept,
              explanation: vc.explanation || '',
              score: vc.score,
              feedback: vc.feedback || '',
              timestamp: vc.timestamp || new Date().toISOString(),
              fields: Array.isArray(vc.fields) ? vc.fields.map(field => ({
                key: field.key || '',
                label: field.label || '',
                userAnswer: field.userAnswer || '',
                referenceAnswer: field.referenceAnswer || '',
                score: field.score || 0,
                feedback: Array.isArray(field.feedback) ? field.feedback : []
              })) : []
            }));

          console.log('Concepts validés après transformation:', validValidatedConcepts);
          setValidatedConcepts(validValidatedConcepts);
        } else {
          console.log('validatedConcepts n\'est pas un tableau:', progressData.validatedConcepts);
        }

        // Restaurer les concepts trouvés
        if (Array.isArray(progressData.foundConcepts)) {
          const validFoundConcepts = progressData.foundConcepts.filter(
            (fc: types.FoundConcept) => fc && fc.concept && typeof fc.concept === 'string'
          );
          setFoundConcepts(validFoundConcepts);
        }

        // Restaurer la phase uniquement si elle est valide
        if (progressData.phase === 'identification' || progressData.phase === 'explanation') {
          setPhase(progressData.phase);
        }
      }
    }, (error) => {
      console.error('Erreur lors du chargement de la progression:', error);
      setError('Une erreur est survenue lors du chargement de la progression.');
    });

    return () => unsubscribe();
  }, [user, data?.step?.id]);

  const saveProgress = async () => {
    if (!user || !data?.step?.id) {
      console.log('Impossible de sauvegarder : utilisateur ou étape manquante');
      return;
    }

    // Log des données avant la sauvegarde
    console.log('État actuel des concepts validés:', validatedConcepts);

    const progressQuery = query(
      collection(db, 'conceptsProgress'),
      where('userId', '==', user.uid),
      where('stepId', '==', data.step.id)
    );

    try {
      const snapshot = await getDocs(progressQuery);
      
      // Préparer les données validées
      const validatedConceptsData = validatedConcepts.map(vc => {
        console.log('Préparation du concept validé:', vc);
        const preparedConcept = {
          concept: vc.concept,
          explanation: vc.explanation || '',
          score: vc.score,
          feedback: vc.feedback || '',
          timestamp: vc.timestamp || new Date().toISOString(),
          fields: Array.isArray(vc.fields) ? vc.fields.map(field => ({
            key: field.key || '',
            label: field.label || '',
            userAnswer: field.userAnswer || '',
            referenceAnswer: field.referenceAnswer || '',
            score: field.score || 0,
            feedback: Array.isArray(field.feedback) ? field.feedback : []
          })) : []
        };
        console.log('Concept préparé:', preparedConcept);
        return preparedConcept;
      });

      console.log('Nombre de concepts validés préparés:', validatedConceptsData.length);
      console.log('Concepts validés préparés:', JSON.stringify(validatedConceptsData, null, 2));

      const progressData = {
        userId: user.uid,
        stepId: data.step.id,
        foundConcepts,
        validatedConcepts: validatedConceptsData,
        phase,
        updatedAt: serverTimestamp()
      };

      // Log des données complètes à sauvegarder
      console.log('Données complètes à sauvegarder:', JSON.stringify(progressData, null, 2));

      if (snapshot.empty) {
        console.log('Création d\'un nouveau document de progression');
        const docRef = await addDoc(collection(db, 'conceptsProgress'), progressData);
        console.log('Document créé avec l\'ID:', docRef.id);
      } else {
        console.log('Mise à jour du document de progression existant');
        const docRef = doc(db, 'conceptsProgress', snapshot.docs[0].id);
        await updateDoc(docRef, progressData);
        console.log('Document mis à jour avec l\'ID:', snapshot.docs[0].id);
      }

      console.log('Sauvegarde réussie', JSON.stringify(progressData, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Une erreur est survenue lors de la sauvegarde de votre progression.');
    }
  };

  const handleConceptValidated = async (validatedConcept: types.ValidatedConcept) => {
    console.log('Concept validé:', validatedConcept);
    
    if (!user) {
      console.error('Aucun utilisateur connecté');
      setError('Vous devez être connecté pour sauvegarder votre progression.');
      return;
    }
    
    // Créer le nouveau tableau de concepts validés
    const updatedValidatedConcepts = [...validatedConcepts, validatedConcept];
    console.log('Nouveaux concepts validés:', updatedValidatedConcepts);

    try {
      // Préparer les données de progression
      const progressQuery = query(
        collection(db, 'conceptsProgress'),
        where('userId', '==', user.uid),
        where('stepId', '==', data.step.id)
      );

      const snapshot = await getDocs(progressQuery);
      
      // Préparer les données validées
      const validatedConceptsData = updatedValidatedConcepts.map(vc => ({
        concept: vc.concept,
        explanation: vc.explanation || '',
        score: vc.score,
        feedback: vc.feedback || '',
        timestamp: vc.timestamp || new Date().toISOString(),
        fields: Array.isArray(vc.fields) ? vc.fields.map(field => ({
          key: field.key || '',
          label: field.label || '',
          userAnswer: field.userAnswer || '',
          referenceAnswer: field.referenceAnswer || '',
          score: field.score || 0,
          feedback: Array.isArray(field.feedback) ? field.feedback : []
        })) : []
      }));

      console.log('Concepts validés préparés:', JSON.stringify(validatedConceptsData, null, 2));

      const progressData = {
        userId: user.uid,
        stepId: data.step.id,
        foundConcepts,
        validatedConcepts: validatedConceptsData,
        phase,
        updatedAt: serverTimestamp()
      };

      // Sauvegarder dans Firestore
      if (snapshot.empty) {
        await addDoc(collection(db, 'conceptsProgress'), progressData);
      } else {
        await updateDoc(doc(db, 'conceptsProgress', snapshot.docs[0].id), progressData);
      }

      // Mettre à jour l'état local seulement après la sauvegarde réussie
      setValidatedConcepts(updatedValidatedConcepts);
      
    } catch (error) {
      console.error('Erreur lors de la validation du concept:', error);
      setError('Une erreur est survenue lors de la validation du concept.');
    }
  };

  const resetExplanationProgress = async () => {
    if (!user) {
      console.error('Aucun utilisateur connecté');
      setError('Vous devez être connecté pour réinitialiser votre progression.');
      return;
    }

    try {
      const progressQuery = query(
        collection(db, 'conceptsProgress'),
        where('userId', '==', user.uid),
        where('stepId', '==', data.step.id)
      );
      const snapshot = await getDocs(progressQuery);
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'conceptsProgress', snapshot.docs[0].id);
        // Garder les concepts trouvés mais réinitialiser les validations
        await updateDoc(docRef, {
          validatedConcepts: [],
          phase: 'explanation'
        });
      }

      // Réinitialiser l'état local des validations
      setValidatedConcepts([]);

    } catch (error) {
      console.error('Error resetting explanation progress:', error);
    }
  };

  const resetAllProgress = async () => {
    if (!user || !data?.step?.id) return;

    try {
      // Supprimer le document de progression existant
      const progressQuery = query(
        collection(db, 'conceptsProgress'),
        where('userId', '==', user.uid),
        where('stepId', '==', data.step.id)
      );
      const progressDocs = await getDocs(progressQuery);
      
      for (const doc of progressDocs.docs) {
        await deleteDoc(doc.ref);
      }

      // Réinitialiser tout l'état local
      setFoundConcepts([]);
      setValidatedConcepts([]);
      setPhase('identification');

    } catch (error) {
      console.error('Error resetting all progress:', error);
    }
  };

  const handleComplete = async () => {
    if (!user || !data?.step?.id || isCompleting) return;

    setIsCompleting(true);
    try {
      // Marquer l'étape comme terminée
      const stepRef = doc(db, 'progress', data.step.id);
      await updateDoc(stepRef, {
        completed: true,
        completedAt: new Date()
      });

      // Sauvegarder la progression finale
      await saveProgress();

      // Rediriger vers la prochaine étape ou le résumé du chapitre
      navigate(`/paths/${data.pathId}`);
    } catch (error) {
      console.error('Erreur lors de la completion:', error);
      setError('Une erreur est survenue lors de la sauvegarde de votre progression.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement des concepts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour
          </button>
          <h1 className="text-2xl font-bold mt-4">
            {data.step.title || 'Concepts clés - Activité 2'}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {phase === 'identification' ? (
            <IdentificationPhase
              concepts={concepts}
              foundConcepts={foundConcepts}
              setFoundConcepts={setFoundConcepts}
              setPhase={setPhase}
              saveProgress={saveProgress}
              resetProgress={resetAllProgress}
            />
          ) : (
            <ExplanationPhase
              concepts={concepts}
              foundConcepts={foundConcepts}
              validatedConcepts={validatedConcepts}
              onConceptValidated={handleConceptValidated}
              saveProgress={saveProgress}
              handleComplete={handleComplete}
              setPhase={setPhase}
              resetProgress={resetExplanationProgress}
              setFoundConcepts={setFoundConcepts}
            />
          )}
        </div>
      </div>
    </div>
  );
}