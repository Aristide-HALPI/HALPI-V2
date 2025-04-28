import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  type: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video';
  content: string;
  introduction: string;
  conclusion: string;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterTitle: string;
  nextActivityId?: string;
  previousActivityId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  pdfUrl?: string;
  chapterPdfUrl?: string; // URL du PDF du chapitre depuis Supabase
}

const ActivityPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const navigate = useNavigate();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'introduction' | 'lecture' | 'prise_de_note' | 'conclusion'>('introduction');
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  
  // États pour les exemples dépliants dans la prise de notes
  const [showOutlineExample, setShowOutlineExample] = useState(false);
  const [showBoxExample, setShowBoxExample] = useState(false);
  const [showQuestionsExample, setShowQuestionsExample] = useState(false);
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Récupérer les informations du chapitre depuis Supabase pour obtenir l'URL du PDF
        // Nous allons récupérer l'URL du PDF directement depuis Supabase
        // L'URL sera récupérée en fonction du chapitre de l'activité
        let chapterPdfUrl = '';
        
        if (activityId) {
          try {
            // Utiliser directement l'URL que vous avez fournie qui fonctionne
            chapterPdfUrl = 'https://fpxwfjicjnrihmmbkwew.supabase.co/storage/v1/object/public/chapters/a682d2f5-a453-450c-befd-dbef55086ffd/1745629048170_psycho-pages-2.pdf';
            console.log('Utilisation de l\'URL directe du PDF:', chapterPdfUrl);
            
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'URL du PDF:', error);
            console.log('Utilisation de l\'URL de test pour la démonstration');
          }
        }
        
        const tempActivity: Activity = {
          id: activityId || 'a1',
          title: 'Lecture active',
          type: 'lecture_active',
          introduction: `
# Bienvenue dans cette activité de lecture active

Dans cette activité, vous allez lire attentivement le contenu du chapitre puis prendre des notes sur les concepts clés.

## Objectifs
- Comprendre les concepts fondamentaux présentés dans le chapitre
- Identifier les idées principales et les notions importantes
- Développer une compréhension approfondie du sujet

Cliquez sur "Démarrer l'activité" pour commencer.
`,
          content: `
# Contenu de l'activité

La planche est l'élément fondamental de votre équipement de windsurf. Choisir la bonne planche en fonction de votre niveau et des conditions de navigation est essentiel pour progresser efficacement.

## Types de planches

### Planches d'apprentissage
- **Volume élevé** : 160-220 litres
- **Largeur importante** : 75-100 cm
- **Stabilité maximale** pour faciliter l'équilibre
- **Dérive rétractable** pour naviguer même par vent faible

### Planches freeride
- **Volume moyen** : 100-160 litres
- **Polyvalentes** et accessibles
- **Bonnes performances** dans une large gamme de conditions
- **Idéales pour progresser** après la phase d'initiation

### Planches freestyle
- **Volume plus faible** : 80-110 litres
- **Très maniables** pour réaliser des figures
- **Shape spécifique** avec un outline parallèle
- **Pour niveau intermédiaire à avancé**

### Planches de vagues
- **Volume réduit** : 65-95 litres
- **Très réactives** et maniables
- **Conçues pour surfer les vagues**
- **Pour les riders expérimentés**

## Comment choisir sa planche

Le choix de la planche dépend de plusieurs facteurs :

1. **Votre niveau** : débutant, intermédiaire ou avancé
2. **Votre poids** : plus vous êtes lourd, plus le volume nécessaire est important
3. **Les conditions de navigation** : vent fort ou faible, eau plate ou vagues
4. **Votre style de navigation** : freeride, freestyle, vagues...

### Formule pour déterminer le volume
Une règle simple pour les débutants et intermédiaires :
- **Débutants** : Poids (kg) + 100-120 litres
- **Intermédiaires** : Poids (kg) + 60-80 litres
- **Avancés** : Poids (kg) + 20-40 litres

## Entretien de la planche

Pour prolonger la durée de vie de votre planche :
- Rincez-la à l'eau douce après chaque utilisation en mer
- Évitez l'exposition prolongée au soleil
- Stockez-la à l'horizontale ou à la verticale, jamais sur le rail
- Vérifiez régulièrement l'état des inserts d'aileron et de footstraps

## Exercice pratique

Lors de votre prochaine session, essayez de tester différents types de planches pour ressentir les différences de comportement. Notez vos impressions sur :
- La stabilité
- La facilité à planer
- La maniabilité
- Le confort général

Cette expérience vous aidera à mieux comprendre quel type de planche correspond le mieux à votre style et à vos objectifs.
          `,
          pdfUrl: '',
          courseId: '1',
          courseName: 'Introduction à la psychologie',
          chapterId: 'c2',
          chapterTitle: 'Les fondamentaux',
          previousActivityId: 'a0',
          nextActivityId: 'a2',
          chapterPdfUrl: 'https://fpxwfjicjnrihmmbkwew.supabase.co/storage/v1/object/public/chapters/a682d2f5-a453-450c-befd-dbef55086ffd/1745629048170_psycho-pages-2.pdf',
          conclusion: `
# Félicitations !

Vous avez terminé cette activité de lecture active. Cette étape est essentielle dans votre parcours d'apprentissage.

## Votre progression
En complétant cette activité, vous avez :
- Renforcé votre compréhension des concepts clés
- Développé votre capacité d'analyse et de synthèse
- Consolidé vos connaissances sur le sujet

## Prochaines étapes
Pour compléter cette activité, veuillez remplir le formulaire de feedback ci-dessous. Votre avis est important pour améliorer votre expérience d'apprentissage.
`,
          status: 'not_started'
        };
        
        setActivity(tempActivity);
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Impossible de charger cette activité');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivity();
  }, [activityId]);
  
  const startActivity = async () => {
    if (!activity) return;
    
    setIsCompleting(true);
    try {
      // Simuler un appel API pour marquer l'activité comme en cours
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mettre à jour l'activité localement
      setActivity({
        ...activity,
        status: 'in_progress'
      });
      setStep('lecture');
      setHasStarted(true);
      
      // Dans une implémentation réelle, vous feriez une requête Supabase ici
      // await supabase.from('user_activities').update({ status: 'in_progress' }).eq('id', activityId);
      
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'activité:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const navigateToStep = (targetStep: 'introduction' | 'lecture' | 'prise_de_note' | 'conclusion') => {
    if (hasStarted || targetStep === 'introduction') {
      setStep(targetStep);
    }
  };
  
  const navigateToActivity = (activityId?: string) => {
    if (!activityId) return;
    navigate(`/activities/${activityId}?returnTo=${encodeURIComponent(returnTo || '')}`);
  };
  
  const submitFeedback = async () => {
    if (!activity) return;
    
    try {
      setIsCompleting(true);
      
      // Simuler un appel API pour soumettre le feedback et marquer l'activité comme terminée
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour l'activité localement
      setActivity({
        ...activity,
        status: 'completed'
      });
      
      // Dans une implémentation réelle, vous feriez une requête Supabase ici
      // await supabase.from('user_activities').update({ 
      //   status: 'completed',
      //   feedback_rating: feedback.rating,
      //   feedback_comment: feedback.comment 
      // }).eq('id', activityId);
      
      // Rediriger vers la page du parcours après soumission du feedback
      navigate(`/parcours/${returnTo || activity.courseId}`);
      
    } catch (error) {
      console.error('Erreur lors de la soumission du feedback:', error);
    } finally {
      setIsCompleting(false);
    }
  };
  
  const renderIntroduction = () => {
    if (!activity) return null;
    
    return (
      <div>
        <div 
          className="prose prose-sm sm:prose lg:prose-lg mx-auto mb-8"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(activity.introduction) }}
        />
        <div className="flex justify-center">
          <Button 
            variant="primary" 
            onClick={startActivity}
            isLoading={isCompleting}
            size="lg"
          >
            Démarrer l'activité
          </Button>
        </div>
      </div>
    );
  };



  const renderLectureContent = () => {
    if (!activity) return null;
    
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Lecture du chapitre</h2>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
          <div className="flex items-start mb-4">
            <div className="bg-blue-100 p-2 rounded-md mr-3 mt-1">
              <span className="text-blue-800 text-xl">1️⃣</span>
            </div>
            <div>
              <p className="text-gray-700 mb-2">
                <strong>Lecture initiale (lecture préparatoire et attentive)</strong>
              </p>
              <p className="text-gray-700">
                Lis le chapitre une première fois, sans prendre de notes, en te concentrant vraiment sur ce que tu lis.
              </p>
            </div>
          </div>
          
          <div className="pl-12 mb-4">
            <p className="text-gray-700 font-medium mb-2">✅ À faire :</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Lis dans le calme, en te mettant en condition d'attention</li>
              <li>Cherche à comprendre le sens général du chapitre</li>
              <li>Essaie d'identifier les grandes parties, les idées principales, les concepts importants</li>
              <li>Ne t'arrête pas trop longtemps sur un point difficile : l'objectif ici est d'avoir une vue d'ensemble, pas encore de tout maîtriser</li>
            </ul>
          </div>
          
          <div className="flex items-start">
            <div className="bg-amber-100 p-2 rounded-md mr-3">
              <span className="text-amber-800 text-xl">🏁</span>
            </div>
            <div>
              <p className="text-gray-700 font-medium">
                Objectif : construire une première représentation mentale du chapitre avant de commencer à prendre des notes
              </p>
            </div>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="p-8 text-center">
            <h3 className="text-xl font-medium mb-4">Document du chapitre</h3>
            <p className="text-gray-600 mb-6">
              Le document PDF est disponible pour consultation. Cliquez sur le bouton ci-dessous pour l'ouvrir.
            </p>
            
            {activity.chapterPdfUrl ? (
              <a 
                href={activity.chapterPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Voir le PDF
              </a>
            ) : (
              <div className="text-amber-600 p-4 bg-amber-50 rounded-md inline-block">
                Le document PDF n'est pas disponible pour le moment.
              </div>
            )}
            
            <div className="mt-6 text-sm text-gray-500">
              Le PDF s'ouvrira dans un nouvel onglet. Si vous avez des difficultés à l'ouvrir, vérifiez les paramètres de votre navigateur.
            </div>
          </div>
        </div>

        
        <div className="flex justify-center mt-8">
          <Button 
            variant="primary" 
            onClick={() => navigateToStep('prise_de_note')}
            size="lg"
          >
            Passer à la prise de notes
          </Button>
        </div>
      </div>
    );
  };

  const renderPriseDeNoteContent = () => {
    if (!activity) return null;
    
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Prise de notes</h2>
        
        {/* Introduction à la méthode en 3 temps */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
          <h3 className="text-xl font-semibold mb-3">La méthode HALPI en 3 temps</h3>
          <p className="text-gray-700 mb-4">
            Cette méthode te propose une structure en 3 zones complémentaires pour organiser tes notes de façon efficace. Chaque zone a un objectif précis et t'aide à structurer ta pensée.
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <p className="font-medium text-blue-700">1️⃣ Outlines : la structure du chapitre</p>
              <p className="text-sm text-gray-600">Un plan hiérarchisé qui reprend la structure logique du chapitre, avec titres et sous-titres.</p>
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <p className="font-medium text-blue-700">2️⃣ Boxes : les concepts clés</p>
              <p className="text-sm text-gray-600">Des boîtes thématiques qui expliquent les notions importantes avec tes mots.</p>
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <p className="font-medium text-blue-700">3️⃣ Questions : vérification et préparation</p>
              <p className="text-sm text-gray-600">Des questions pour clarifier tes doutes et anticiper les évaluations.</p>
            </div>
          </div>
        </div>
        
        {/* Mise en page verticale pour les trois étapes de prise de notes */}
        <div className="flex flex-col space-y-6">
          {/* Étape 1: Résumé en Outlines */}
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <h3 className="text-lg font-medium text-blue-700 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">1</span>
              Résumé en Outlines
            </h3>
            <div className="mb-3">
              <div className="flex flex-wrap space-x-2 mb-2">
                <button className="p-1 border border-gray-300 rounded hover:bg-gray-100" title="Titre principal">
                  <span className="font-bold">H1</span>
                </button>
                <button className="p-1 border border-gray-300 rounded hover:bg-gray-100" title="Sous-titre">
                  <span className="font-medium">H2</span>
                </button>
                <button className="p-1 border border-gray-300 rounded hover:bg-gray-100" title="Bullet point">
                  <span>•</span>
                </button>
                <button className="p-1 border border-gray-300 rounded hover:bg-gray-100" title="Numérotation">
                  <span>1.</span>
                </button>
                <button className="p-1 border border-gray-300 rounded hover:bg-gray-100" title="Indentation">
                  <span>↳</span>
                </button>
                <p className="text-sm text-gray-600 mb-1">Pourquoi la température reste-t-elle constante pendant un changement d'état alors qu'on continue à chauffer ?</p>
                <p className="text-sm text-gray-600 italic">→ À revoir avec le prof / dans une animation interactive</p>
              </div>
              
              <div className="border-l-4 border-purple-300 pl-3 py-1">
                <p className="font-medium text-purple-700 mb-1">🎓 Questions d'examen probables :</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-800">Décris l'organisation des particules dans les trois états de la matière.</p>
                    <p className="text-gray-600 italic">→ Solide : fixes, serrées – Liquide : mobiles, proches – Gaz : mobiles, espacées</p>
                  </div>
                  <div>
                    <p className="text-gray-800">Que montre une courbe de température lors d'un changement d'état ?</p>
                    <p className="text-gray-600 italic">→ Un palier horizontal où la température reste constante malgré l'apport d'énergie</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1. Questions personnelles (facultatif)</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md min-h-[120px]"
                  placeholder="Qu'est-ce qui n'est toujours pas clair pour toi après avoir rempli les deux premières zones ?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2. Questions d'examen probables (obligatoire)</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md min-h-[120px]"
                  placeholder="Que pourrait-on te demander en contrôle à propos de ce chapitre ? Essaie d'y répondre brièvement."
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm">
              <p className="flex items-center text-blue-800 font-medium mb-1">
                <span className="mr-2">💡</span> Conseil
              </p>
              <p className="text-gray-700">
                Formuler des questions d'examen est un excellent moyen de te préparer aux évaluations. Pense aux questions que ton professeur pourrait poser et entraîne-toi à y répondre.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          <Button 
            variant="primary" 
            onClick={() => navigateToStep('conclusion')}
            size="lg"
          >
            Terminer l'activité
          </Button>
        </div>
      </div>
    );
  };

  const renderConclusion = () => {
    if (!activity) return null;
    
    return (
      <div>
        <div 
          className="prose prose-sm sm:prose lg:prose-lg mx-auto mb-8"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(activity.conclusion) }}
        />
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
          <h3 className="text-lg font-medium mb-4">Votre feedback sur cette activité</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment évaluez-vous cette activité ?</label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${feedback.rating === rating ? 'bg-primary-100 text-primary-700 border-2 border-primary-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires (optionnel)</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Partagez votre expérience avec cette activité..."
              value={feedback.comment}
              onChange={e => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
            />
          </div>
          
          <Button 
            variant="primary" 
            onClick={submitFeedback}
            isLoading={isCompleting}
            disabled={feedback.rating === 0}
            className="w-full"
          >
            Soumettre et terminer
          </Button>
        </div>
      </div>
    );
  };

  // Fonction simplifiée pour convertir le markdown en HTML
  // Dans une implémentation réelle, utilisez une bibliothèque comme marked.js
  const markdownToHtml = (markdown: string) => {
    let html = markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gm, '<em>$1</em>')
      .replace(/\n- (.*)/gm, '<ul><li>$1</li></ul>')
      .replace(/<\/ul><ul>/gm, '');
    
    // Remplacer les paragraphes
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      if (!p.startsWith('<h') && !p.startsWith('<ul>')) {
        return `<p>${p}</p>`;
      }
      return p;
    }).join('');
    
    return html;
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }
  
  if (error || !activity) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{error || 'Activité non trouvée'}</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to={`/parcours/${returnTo || activity.courseId}`} className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4">
          <ChevronLeft size={16} className="mr-1" />
          Retour au parcours
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`
                text-xs font-medium px-2.5 py-0.5 rounded-full
                ${activity.type === 'lecture_active' ? 'bg-blue-100 text-blue-800' : 
                  activity.type === 'quiz' ? 'bg-accent-100 text-accent-800' : 
                  activity.type === 'pratique_deliberee' ? 'bg-success-100 text-success-800' : 
                  'bg-primary-100 text-primary-800'}
              `}>
                {activity.type === 'lecture_active' ? 'Lecture active' : 
                 activity.type === 'quiz' ? 'Quiz' : 
                 activity.type === 'pratique_deliberee' ? 'Pratique délibérée' : 
                 'Vidéo'}
              </span>
              <span className="text-sm text-gray-500">
                {activity.courseName} • {activity.chapterTitle}
              </span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">{activity.title}</h1>

          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div 
            className={`flex flex-col items-center ${step === 'introduction' ? 'text-primary-600 font-medium' : 'text-gray-500'} cursor-pointer`}
            onClick={() => navigateToStep('introduction')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step === 'introduction' ? 'bg-primary-100 border-2 border-primary-500' : hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>1</div>
            <span className="text-xs">Introduction</span>
          </div>
          <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
          <div 
            className={`flex flex-col items-center ${step === 'lecture' ? 'text-primary-600 font-medium' : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={() => hasStarted && navigateToStep('lecture')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step === 'lecture' ? 'bg-primary-100 border-2 border-primary-500' : (step === 'prise_de_note' || step === 'conclusion') && hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>2</div>
            <span className="text-xs">Lecture</span>
          </div>
          <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
          <div 
            className={`flex flex-col items-center ${step === 'prise_de_note' ? 'text-primary-600 font-medium' : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={() => hasStarted && navigateToStep('prise_de_note')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step === 'prise_de_note' ? 'bg-primary-100 border-2 border-primary-500' : step === 'conclusion' && hasStarted ? 'bg-gray-300' : 'bg-gray-100'}`}>3</div>
            <span className="text-xs">Prise de note</span>
          </div>
          <div className="flex-1 h-[2px] mx-2 bg-gray-200"></div>
          <div 
            className={`flex flex-col items-center ${step === 'conclusion' ? 'text-primary-600 font-medium' : hasStarted ? 'text-gray-500' : 'text-gray-400'} ${hasStarted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={() => hasStarted && navigateToStep('conclusion')}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step === 'conclusion' ? 'bg-primary-100 border-2 border-primary-500' : 'bg-gray-100'}`}>4</div>
            <span className="text-xs">Conclusion</span>
          </div>
        </div>
      </div>

      {/* Activity content */}
      <Card className="p-6">
        {step === 'introduction' && renderIntroduction()}
        {step === 'lecture' && renderLectureContent()}
        {step === 'prise_de_note' && renderPriseDeNoteContent()}
        {step === 'conclusion' && renderConclusion()}
      </Card>
      
      {/* Navigation entre activités */}
      {(step === 'lecture' || step === 'prise_de_note') && (
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={() => {
              if (activity?.previousActivityId) {
                navigateToActivity(activity.previousActivityId);
              }
            }}
            disabled={!activity?.previousActivityId}
            className="flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            Activité précédente
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              if (activity?.nextActivityId) {
                navigateToActivity(activity.nextActivityId);
              }
            }}
            disabled={!activity?.nextActivityId}
            className="flex items-center gap-1 ml-auto"
          >
            Activité suivante
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
