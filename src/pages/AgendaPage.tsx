import { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Clock, MapPin, Book, Activity, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Configuration du localisateur pour le calendrier
moment.locale('fr');
const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'cours' | 'pratique' | 'examen' | 'coaching';
  location?: string;
  courseId?: string;
  courseName?: string;
  description?: string;
  completed?: boolean;
}

const AgendaPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { user } = useAuth();
  const calendarRef = useRef<any>(null);
  
  // Styles personnalisés pour les événements du calendrier
  const eventStyleGetter = (event: Event) => {
    let backgroundColor = '';
    let borderColor = '';
    
    switch (event.type) {
      case 'cours':
        backgroundColor = 'rgba(59, 130, 246, 0.1)';
        borderColor = '#3b82f6';
        break;
      case 'pratique':
        backgroundColor = 'rgba(16, 185, 129, 0.1)';
        borderColor = '#10b981';
        break;
      case 'examen':
        backgroundColor = 'rgba(239, 68, 68, 0.1)';
        borderColor = '#ef4444';
        break;
      case 'coaching':
        backgroundColor = 'rgba(168, 85, 247, 0.1)';
        borderColor = '#a855f7';
        break;
      default:
        backgroundColor = 'rgba(107, 114, 128, 0.1)';
        borderColor = '#6b7280';
    }
    
    return {
      style: {
        backgroundColor,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '4px',
        color: '#1f2937',
        fontWeight: 500,
        opacity: event.completed ? 0.6 : 1,
      }
    };
  };
  
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      try {
        // Dans une implémentation réelle, nous récupérerions les événements depuis Supabase
        // const { data, error } = await supabase
        //   .from('user_events')
        //   .select('*')
        //   .eq('user_id', user.id);
        
        // if (error) throw error;
        
        // Pour l'instant, utilisons des données temporaires
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const tempData: Event[] = [
          {
            id: '1',
            title: 'Lecture: Choix de l\'équipement',
            start: new Date(today.setHours(10, 0, 0, 0)),
            end: new Date(today.setHours(11, 0, 0, 0)),
            type: 'cours',
            courseId: '1',
            courseName: 'Les fondamentaux du windsurf',
            description: 'Découvrez comment choisir l\'équipement adapté à votre niveau et aux conditions de navigation.'
          },
          {
            id: '2',
            title: 'Session pratique: Waterstart',
            start: new Date(tomorrow.setHours(14, 0, 0, 0)),
            end: new Date(tomorrow.setHours(16, 0, 0, 0)),
            type: 'pratique',
            location: 'Plage de La Baule',
            courseId: '1',
            courseName: 'Les fondamentaux du windsurf',
            description: 'Pratiquez la technique du waterstart dans des conditions de vent modéré.'
          },
          {
            id: '3',
            title: 'Coaching personnalisé',
            start: new Date(dayAfterTomorrow.setHours(11, 0, 0, 0)),
            end: new Date(dayAfterTomorrow.setHours(12, 0, 0, 0)),
            type: 'coaching',
            description: 'Session de coaching personnalisé avec un instructeur pour améliorer votre technique de jibe.'
          },
          {
            id: '4',
            title: 'Examen: Fondamentaux du windsurf',
            start: new Date(nextWeek.setHours(9, 0, 0, 0)),
            end: new Date(nextWeek.setHours(11, 0, 0, 0)),
            type: 'examen',
            courseId: '1',
            courseName: 'Les fondamentaux du windsurf',
            description: 'Évaluation finale des compétences acquises durant le cours "Les fondamentaux du windsurf".'
          }
        ];
        
        setEvents(tempData);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Impossible de charger votre agenda');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);
  
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
  };
  
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (calendarRef.current) {
      const { onNavigate } = calendarRef.current.props;
      onNavigate(action);
    }
  };
  
  const handleViewChange = (view: 'month' | 'week' | 'day') => {
    setSelectedView(view);
  };
  
  const formatEventTime = (event: Event) => {
    return `${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}`;
  };
  
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'cours':
        return <Book size={18} />;
      case 'pratique':
        return <Activity size={18} />;
      case 'examen':
        return <CalendarIcon size={18} />;
      case 'coaching':
        return <Clock size={18} />;
      default:
        return <CalendarIcon size={18} />;
    }
  };
  
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'cours':
        return 'text-blue-600';
      case 'pratique':
        return 'text-green-600';
      case 'examen':
        return 'text-red-600';
      case 'coaching':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'cours':
        return 'Cours';
      case 'pratique':
        return 'Pratique';
      case 'examen':
        return 'Examen';
      case 'coaching':
        return 'Coaching';
      default:
        return 'Événement';
    }
  };
  
  const getDayEvents = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return events.filter(event => 
      event.start >= start && event.start <= end
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
  };
  
  const todayEvents = getDayEvents(selectedDate);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Mon Agenda</h1>
        <p className="text-gray-600">Gérez votre planning d'apprentissage et vos activités</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendrier */}
        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            {/* Contrôles du calendrier */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<ChevronLeft size={16} />}
                  onClick={() => handleNavigate('PREV')}
                  aria-label="Mois précédent"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleNavigate('TODAY')}
                >
                  Aujourd'hui
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => handleNavigate('NEXT')}
                  aria-label="Mois suivant"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={selectedView === 'month' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleViewChange('month')}
                >
                  Mois
                </Button>
                <Button 
                  variant={selectedView === 'week' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleViewChange('week')}
                >
                  Semaine
                </Button>
                <Button 
                  variant={selectedView === 'day' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleViewChange('day')}
                >
                  Jour
                </Button>
              </div>
            </div>
            
            {/* Calendrier */}
            <div className="h-[600px]">
              <Calendar
                ref={calendarRef}
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                view={selectedView}
                onView={(view) => setSelectedView(view as any)}
                onSelectEvent={handleSelectEvent}
                onNavigate={(date) => setSelectedDate(date)}
                eventPropGetter={eventStyleGetter}
                messages={{
                  month: 'Mois',
                  week: 'Semaine',
                  day: 'Jour',
                  today: 'Aujourd\'hui',
                  previous: 'Précédent',
                  next: 'Suivant',
                  agenda: 'Agenda',
                  date: 'Date',
                  time: 'Heure',
                  event: 'Événement',
                  noEventsInRange: 'Aucun événement dans cette période',
                  showMore: (total) => `+ ${total} autres`
                }}
                formats={{
                  monthHeaderFormat: 'MMMM YYYY',
                  dayHeaderFormat: 'dddd D MMMM',
                  dayRangeHeaderFormat: ({ start, end }) => 
                    `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM YYYY')}`
                }}
              />
            </div>
          </Card>
        </div>
        
        {/* Panneau latéral */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-full">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {moment(selectedDate).format('dddd D MMMM')}
              </h2>
              <p className="text-sm text-gray-500">
                {todayEvents.length} événement{todayEvents.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {todayEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600">Aucun événement prévu pour cette journée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEvent?.id === event.id 
                        ? 'border-primary-300 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${getEventTypeColor(event.type)}`}>
                        {getEventTypeIcon(event.type)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        event.type === 'cours' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'pratique' ? 'bg-green-100 text-green-800' :
                        event.type === 'examen' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>{formatEventTime(event)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.courseName && (
                      <div className="mt-2 text-xs text-primary-600 font-medium">
                        {event.courseName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {selectedEvent && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedEvent.title}
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`p-1 rounded-full ${getEventTypeColor(selectedEvent.type)} bg-opacity-10`}>
                      {getEventTypeIcon(selectedEvent.type)}
                    </span>
                    <span>{getEventTypeLabel(selectedEvent.type)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-gray-500" />
                    <span>{moment(selectedEvent.start).format('dddd D MMMM • HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}</span>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-gray-500" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  
                  {selectedEvent.courseName && (
                    <div className="flex items-center gap-2 text-sm">
                      <Book size={16} className="text-gray-500" />
                      <span>{selectedEvent.courseName}</span>
                    </div>
                  )}
                </div>
                
                {selectedEvent.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {selectedEvent.courseId && (
                    <Button 
                      variant="default" 
                      size="sm"
                      as="a"
                      href={`/parcours/${selectedEvent.courseId}`}
                    >
                      Aller au cours
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;
