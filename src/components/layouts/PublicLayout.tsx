import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from '../common/Logo.tsx';

const PublicLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      {!isHomePage && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-xl font-heading font-semibold text-gray-900">HALPI</span>
              </Link>
              
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className={`text-sm font-medium ${
                    location.pathname === '/login'
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Inscription
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Logo size={24} />
              <span className="text-lg font-heading font-semibold text-gray-900">HALPI</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <Link to="/about" className="text-sm text-gray-600 hover:text-primary-600">
                À propos
              </Link>
              <Link to="/contact" className="text-sm text-gray-600 hover:text-primary-600">
                Contact
              </Link>
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-primary-600">
                Confidentialité
              </Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-primary-600">
                Conditions d'utilisation
              </Link>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} HALPI. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
