import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ExternalLink } from 'lucide-react';

export function Calendar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-dark-blue mb-8">Mon Agenda</h1>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center text-gray-600">
            Chargement de l'agenda...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-dark-blue">Mon Agenda</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-semibold mb-6">Gérez votre emploi du temps HALPI</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Accédez à votre agenda HALPI pour visualiser vos séances d'accompagnement, planifier vos révisions 
          et organiser votre temps d'étude de manière optimale. Cliquez sur le bouton ci-dessous pour ouvrir 
          l'application agenda dans une nouvelle fenêtre.
        </p>
        <a
          href="https://halpi-agenda.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Ouvrir l'agenda HALPI
        </a>
      </div>
    </div>
  );
}