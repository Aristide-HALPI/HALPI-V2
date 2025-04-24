import { useNavigate } from 'react-router-dom';
import { Wind, BookOpen, BarChart2, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary-600 to-primary-900 opacity-90"></div>
        <div 
          className="absolute inset-0 z-0 bg-[url('https://images.pexels.com/photos/1430665/pexels-photo-1430665.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')]"
          style={{ backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'overlay' }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-white z-10">
          <div className="max-w-2xl">
            <div className="flex items-center mb-6 gap-2">
              <Logo size={32} />
              <h1 className="text-2xl font-heading font-bold">HALPI</h1>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              L'IA au service de votre progression en windsurf
            </h2>
            
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Une méthode pédagogique rigoureuse, des parcours adaptés et un suivi personnalisé pour maîtriser le windsurf plus efficacement.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                variant="accent" 
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowRight size={18} />}
              >
                Commencer gratuitement
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                onClick={() => navigate('/login')}
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">
            L'apprentissage intelligent du windsurf
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Notre plateforme utilise l'intelligence artificielle pour créer des parcours d'apprentissage 
            personnalisés qui s'adaptent en temps réel à vos progrès.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`${feature.bgColor} rounded-lg inline-flex p-3 mb-4`}>
                <feature.icon size={24} className={feature.iconColor} />
              </div>
              
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-700 rounded-xl shadow-xl overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-3xl font-heading font-bold text-white mb-3">
                  Prêt à progresser en windsurf ?
                </h2>
                <p className="text-primary-100 text-lg mb-6">
                  Rejoignez des milliers d'apprenants qui perfectionnent leurs techniques de windsurf grâce à notre méthode d'apprentissage.
                </p>
                <Button 
                  size="lg" 
                  variant="accent" 
                  onClick={() => navigate('/signup')}
                >
                  Démarrer maintenant
                </Button>
              </div>
              
              <div className="flex-shrink-0 flex justify-center">
                <img 
                  src="https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Windsurf training" 
                  className="w-64 h-64 object-cover rounded-lg shadow-lg" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const features = [
  {
    title: 'Cours structurés',
    description: 'Des modules de cours complets, organisés par niveaux, avec des vidéos et exercices pratiques.',
    icon: BookOpen,
    bgColor: 'bg-primary-100',
    iconColor: 'text-primary-700',
  },
  {
    title: 'Suivi des performances',
    description: 'Visualisez vos progrès grâce à des statistiques détaillées et identifiez vos points forts et axes d\'amélioration.',
    icon: BarChart2,
    bgColor: 'bg-secondary-100',
    iconColor: 'text-secondary-700',
  },
  {
    title: 'Planning personnalisé',
    description: 'Un calendrier d\'apprentissage qui s\'adapte à votre rythme, vos disponibilités et vos objectifs.',
    icon: Calendar,
    bgColor: 'bg-accent-100',
    iconColor: 'text-accent-700',
  },
  {
    title: 'IA pédagogique',
    description: 'Notre IA analyse votre progression et ajuste les exercices pour optimiser votre apprentissage.',
    icon: Wind,
    bgColor: 'bg-success-100',
    iconColor: 'text-success-700',
  },
  {
    title: 'Accompagnement coach',
    description: 'Bénéficiez de sessions de coaching personnalisées avec des experts du windsurf (option premium).',
    icon: MessageSquare,
    bgColor: 'bg-warning-100',
    iconColor: 'text-warning-700',
  },
  {
    title: 'Communauté d\'entraide',
    description: 'Partagez vos expériences et apprenez des autres membres de la communauté HALPI.',
    icon: Wind,
    bgColor: 'bg-error-100',
    iconColor: 'text-error-700',
  },
];

export default HomePage;
