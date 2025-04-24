import { useTheme } from '../../contexts/ThemeContext';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
}

const Logo = ({ size = 24, className = '', iconOnly = false }: LogoProps) => {
  const { theme } = useTheme();
  
  // Si on veut seulement l'icône
  if (iconOnly) {
    return (
      <div className={`text-gold ${className}`}>
        <GraduationCap size={size} />
      </div>
    );
  }
  
  // Si on veut le texte HALPI avec les bonnes couleurs
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GraduationCap size={size} className="text-gold" />
      <span className="text-2xl font-heading font-bold">
        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>H</span>
        <span className="text-gold">A</span>
        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>LP</span>
        <span className="text-gold">I</span>
      </span>
    </div>
  );
};

export default Logo;
