import { Link, useLocation } from 'react-router-dom';
import { 
  User, 
  BookOpen, 
  Route, 
  Calendar, 
  Users, 
  HelpCircle, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const menuItems = [
    { icon: User, label: 'Mon profil', path: '/profile' },
    { icon: BookOpen, label: 'Mes cours', path: '/courses' },
    { icon: Route, label: 'Mes parcours', path: '/paths' },
    { icon: Calendar, label: 'Mon agenda', path: '/calendar' },
    { icon: Users, label: 'Accompagnement', path: '/accompaniments' },
  ];

  return (
    <div className="h-screen w-56 bg-[#1E1E1E] fixed left-0 top-0 flex flex-col text-white">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-gold" />
          <span className="text-2xl font-bold">
            <span className="text-white">H</span>
            <span className="text-gold">A</span>
            <span className="text-white">LP</span>
            <span className="text-gold">I</span>
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "bg-gold/20 text-gold"
                    : "text-white/80 hover:bg-white/10"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 space-y-2">
        <button className="flex items-center gap-3 px-4 py-2 w-full text-white/80 hover:bg-white/10 rounded-lg transition-colors">
          <HelpCircle className="h-5 w-5" />
          <span>Aide</span>
        </button>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-2 w-full text-white/80 hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}