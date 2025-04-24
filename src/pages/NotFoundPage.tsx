import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md text-center">
        <h1 className="text-9xl font-heading font-bold text-primary-500">404</h1>
        <h2 className="mt-4 text-3xl font-heading font-bold text-gray-900">Page non trouvée</h2>
        <p className="mt-2 text-lg text-gray-600">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="primary"
            leftIcon={<Home size={18} />}
            onClick={() => window.location.href = '/'}
          >
            Retour à l'accueil
          </Button>
          
          <Button 
            variant="outline"
            leftIcon={<ArrowLeft size={18} />}
            onClick={() => window.history.back()}
          >
            Page précédente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
