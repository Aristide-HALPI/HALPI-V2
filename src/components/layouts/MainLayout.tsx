import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Calendar, GraduationCap, User, 
  HelpCircle, Menu, X, LogOut, 
  Sun, Moon, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../common/Logo.tsx';
import { supabase } from '../../lib/supabaseClient';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer le prénom de l'utilisateur depuis le profil
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erreur lors de la récupération du profil:', error);
          return;
        }
        
        if (data && data.first_name) {
          setFirstName(data.first_name);
        }
      } catch (err) {
        console.error('Erreur:', err);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle window resize to close mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const NavItem = ({ 
    to, icon: Icon, label 
  }: { 
    to: string; 
    icon: React.ElementType; 
    label: string;
  }) => {
    const isActive = location.pathname === to;
    
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
          isActive 
            ? theme === 'dark' 
              ? 'bg-gold/20 text-gold font-medium' 
              : 'bg-primary-50 text-primary-700 font-medium'
            : theme === 'dark'
              ? 'text-white/80 hover:bg-white/10'
              : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon 
          size={20} 
          className={isActive 
            ? theme === 'dark' ? 'text-gold' : 'text-primary-700' 
            : theme === 'dark' ? 'text-white/80' : 'text-gray-500'} 
        />
        {!isSidebarCollapsed && (
          <>
            <span>{label}</span>

          </>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-light dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-dark shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo and menu button */}
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
                <Link to="/" className="flex items-center gap-2">
                  <Logo size={32} />
                </Link>
              </div>
            </div>
            
            {/* Welcome message and user navigation */}
            <div className="flex items-center gap-4">
              {/* Welcome message */}
              <div className="hidden md:block">
                <p className="text-gray-700 dark:text-gray-200 font-medium">
                  Bienvenue {firstName || 'Apprenant'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Theme toggle button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  aria-label="Déconnexion"
                >
                  <LogOut size={20} />
                </button>
              </div>
              

            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div 
        className={`fixed inset-0 z-20 transition-opacity ease-in-out duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
        
        <div 
          className={`fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl transform transition ease-in-out duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="px-4 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={28} />
              </div>
              <button
                type="button"
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              <NavItem to="/profile" icon={User} label="Profil" />
              <NavItem to="/courses" icon={BookOpen} label="Mes Cours" />
              <NavItem to="/parcours" icon={GraduationCap} label="Mes Parcours" />
              <NavItem to="/agenda" icon={Calendar} label="Mon Agenda" />
              <NavItem to="/accompagnement" icon={Users} label="Accompagnement" />
              <NavItem to="/support" icon={HelpCircle} label="Aide & Support" />
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-600 font-medium px-4 py-2 w-full hover:bg-red-50 rounded-lg"
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for desktop */}
        <aside className={`hidden lg:flex lg:flex-col ${theme === 'dark' ? 'bg-dark text-white' : 'bg-white'} transition-all ${
          isSidebarCollapsed ? 'lg:w-16' : 'lg:w-56'
        }`}>
          <div className="flex-1 flex flex-col pt-5 pb-4">
            <div className="px-3 space-y-1">
              <NavItem to="/profile" icon={User} label="Profil" />
              <NavItem to="/courses" icon={BookOpen} label="Mes Cours" />
              <NavItem to="/parcours" icon={GraduationCap} label="Mes Parcours" />
              <NavItem to="/agenda" icon={Calendar} label="Mon Agenda" />
              <NavItem to="/accompagnement" icon={Users} label="Accompagnement" />
              <NavItem to="/support" icon={HelpCircle} label="Aide & Support" />
            </div>
          </div>
          
          {/* Toggle sidebar button */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Menu size={20} />
              {!isSidebarCollapsed && <span className="ml-2">Réduire</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-light focus:outline-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
