import { useState } from 'react';
import { Calendar, Clock, MessageCircle, Video, Users, CheckCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface Coach {
  id: string;
  name: string;
  role: string;
  avatar: string;
  specialties: string[];
  rating: number;
  availability: boolean;
}

interface CoachingSession {
  id: string;
  type: 'video' | 'message' | 'group';
  date: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  coachId: string;
  coachName: string;
  duration: number;
  topic: string;
}

const AccompagnementPage = () => {
  const [activeTab, setActiveTab] = useState<'coaches' | 'sessions'>('coaches');
  
  // Données temporaires pour les coachs
  const coaches: Coach[] = [
    {
      id: '1',
      name: 'Sophie Martin',
      role: 'Coach senior',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      specialties: ['Technique de base', 'Navigation par vent fort', 'Préparation physique'],
      rating: 4.8,
      availability: true
    },
    {
      id: '2',
      name: 'Thomas Dubois',
      role: 'Coach expert',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      specialties: ['Freestyle', 'Compétition', 'Matériel avancé'],
      rating: 4.9,
      availability: false
    },
    {
      id: '3',
      name: 'Julie Lefebvre',
      role: 'Coach débutant',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      specialties: ['Initiation', 'Sécurité', 'Choix d\'équipement'],
      rating: 4.7,
      availability: true
    }
  ];
  
  // Données temporaires pour les sessions de coaching
  const coachingSessions: CoachingSession[] = [
    {
      id: 's1',
      type: 'video',
      date: '2025-04-25T14:00:00',
      status: 'upcoming',
      coachId: '1',
      coachName: 'Sophie Martin',
      duration: 30,
      topic: 'Amélioration de la technique de jibe'
    },
    {
      id: 's2',
      type: 'message',
      date: '2025-04-20T10:00:00',
      status: 'completed',
      coachId: '3',
      coachName: 'Julie Lefebvre',
      duration: 15,
      topic: 'Conseils sur le choix de la voile'
    },
    {
      id: 's3',
      type: 'group',
      date: '2025-05-05T16:00:00',
      status: 'upcoming',
      coachId: '2',
      coachName: 'Thomas Dubois',
      duration: 60,
      topic: 'Atelier groupe: Techniques avancées de freestyle'
    }
  ];
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i} 
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Accompagnement</h1>
        <p className="text-gray-600">Bénéficiez d'un coaching personnalisé pour progresser plus rapidement</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'coaches' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            onClick={() => setActiveTab('coaches')}
          >
            Nos coachs
          </button>
          <button
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'sessions' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            onClick={() => setActiveTab('sessions')}
          >
            Mes sessions
          </button>
        </nav>
      </div>
      
      {/* Coaches Tab */}
      {activeTab === 'coaches' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => (
            <Card key={coach.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={coach.avatar} 
                    alt={coach.name} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{coach.name}</h3>
                    <p className="text-sm text-gray-500">{coach.role}</p>
                    {renderStars(coach.rating)}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Spécialités</h4>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.map((specialty, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className={`flex items-center gap-1 text-sm ${coach.availability ? 'text-success-600' : 'text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${coach.availability ? 'bg-success-500' : 'bg-gray-300'}`}></span>
                    {coach.availability ? 'Disponible' : 'Non disponible'}
                  </span>
                  
                  <Button 
                    variant="default" 
                    size="sm"
                    disabled={!coach.availability}
                  >
                    Prendre rendez-vous
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Mes sessions de coaching</h2>
            <Button variant="default" size="sm">
              Nouvelle session
            </Button>
          </div>
          
          {coachingSessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune session</h3>
              <p className="mt-1 text-sm text-gray-500">Commencez par réserver une session avec un coach.</p>
              <div className="mt-6">
                <Button variant="default" size="sm">
                  Réserver une session
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {coachingSessions.map((session) => (
                <Card key={session.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`
                        p-3 rounded-full
                        ${session.type === 'video' ? 'bg-blue-100' : 
                          session.type === 'message' ? 'bg-green-100' : 
                          'bg-purple-100'}
                      `}>
                        {session.type === 'video' ? 
                          <Video className="h-6 w-6 text-blue-600" /> : 
                          session.type === 'message' ? 
                          <MessageCircle className="h-6 w-6 text-green-600" /> : 
                          <Users className="h-6 w-6 text-purple-600" />
                        }
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{session.topic}</h3>
                          <span className={`
                            text-xs font-medium px-2.5 py-0.5 rounded-full
                            ${session.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                              session.status === 'completed' ? 'bg-success-100 text-success-800' : 
                              'bg-error-100 text-error-800'}
                          `}>
                            {session.status === 'upcoming' ? 'À venir' : 
                              session.status === 'completed' ? 'Terminée' : 
                              'Annulée'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500">
                          Coach: {session.coachName}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-1 h-4 w-4" />
                            {formatDate(session.date)}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="mr-1 h-4 w-4" />
                            {session.duration} min
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {session.status === 'upcoming' ? (
                        <>
                          <Button variant="outline" size="sm">
                            Annuler
                          </Button>
                          <Button variant="default" size="sm">
                            {session.type === 'video' ? 'Rejoindre' : 
                              session.type === 'message' ? 'Discuter' : 
                              'Voir détails'}
                          </Button>
                        </>
                      ) : session.status === 'completed' ? (
                        <div className="flex items-center text-success-600">
                          <CheckCircle className="mr-1 h-4 w-4" />
                          <span className="text-sm font-medium">Terminée</span>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm">
                          Reprogrammer
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccompagnementPage;
