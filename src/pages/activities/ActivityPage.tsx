import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

interface Activity {
  id: string;
  title: string;
  type: 'lecture_active' | 'quiz' | 'pratique_deliberee' | 'video';
  content: string;
  estimatedTime: number;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterTitle: string;
  nextActivityId?: string;
  previousActivityId?: string;
  completed: boolean;
}

const ActivityPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Dans une implémentation réelle, nous récupérerions les données depuis Supabase
        // Pour l'instant, utilisons des données temporaires
        const tempActivity: Activity = {
          id: activityId || 'a1',
          title: 'Les planches de windsurf',
          type: 'lecture_active',
          content: `
# Les planches de windsurf

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
          estimatedTime: 20,
          courseId: '1',
          courseName: 'Les fondamentaux du windsurf',
          chapterId: 'c2',
          chapterTitle: 'Équipement',
          nextActivityId: 'a5',
          previousActivityId: 'a3',
          completed: false
        };
        
        setActivity(tempActivity);
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Impossible de charger cette activité');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivity();
  }, [activityId]);
  
  const markAsCompleted = async () => {
    if (!activity) return;
    
    setIsCompleting(true);
    try {
      // Dans une implémentation réelle, nous mettrions à jour Supabase
      // const { error } = await supabase
      //   .from('user_activities')
      //   .upsert({
      //     user_id: user.id,
      //     activity_id: activity.id,
      //     completed: true,
      //     completed_at: new Date().toISOString()
      //   });
      
      // if (error) throw error;
      
      // Simulation de la mise à jour
      setTimeout(() => {
        setActivity(prev => prev ? { ...prev, completed: true } : null);
        setIsCompleting(false);
      }, 1000);
    } catch (err) {
      console.error('Error marking activity as completed:', err);
      setIsCompleting(false);
    }
  };
  
  const navigateToActivity = (activityId?: string) => {
    if (!activityId) return;
    navigate(`/activities/${activityId}`);
  };
  
  const renderActivityContent = () => {
    if (!activity) return null;
    
    switch (activity.type) {
      case 'lecture_active':
        return (
          <div className="prose prose-primary max-w-none">
            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(activity.content) }} />
          </div>
        );
      case 'quiz':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz à implémenter</h3>
            <p className="text-gray-600">Cette fonctionnalité sera disponible prochainement.</p>
          </div>
        );
      case 'pratique_deliberee':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activité pratique à implémenter</h3>
            <p className="text-gray-600">Cette fonctionnalité sera disponible prochainement.</p>
          </div>
        );
      case 'video':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vidéo à implémenter</h3>
            <p className="text-gray-600">Cette fonctionnalité sera disponible prochainement.</p>
          </div>
        );
      default:
        return null;
    }
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
  
  if (loading) {
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
        <Link to={`/parcours/${activity.courseId}`} className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4">
          <ChevronLeft size={16} className="mr-1" />
          Retour au cours
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
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <Clock size={16} />
              <span>{activity.estimatedTime} min</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity content */}
      <Card className="p-6">
        {renderActivityContent()}
      </Card>
      
      {/* Navigation and completion */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            leftIcon={<ChevronLeft size={16} />}
            onClick={() => navigateToActivity(activity.previousActivityId)}
            disabled={!activity.previousActivityId}
          >
            Précédent
          </Button>
          <Button 
            variant="outline" 
            rightIcon={<ChevronRight size={16} />}
            onClick={() => navigateToActivity(activity.nextActivityId)}
            disabled={!activity.nextActivityId}
          >
            Suivant
          </Button>
        </div>
        
        <div>
          {activity.completed ? (
            <div className="flex items-center gap-2 text-success-600">
              <CheckCircle size={18} />
              <span>Activité terminée</span>
            </div>
          ) : (
            <Button 
              variant="primary" 
              onClick={markAsCompleted}
              isLoading={isCompleting}
            >
              Marquer comme terminé
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
