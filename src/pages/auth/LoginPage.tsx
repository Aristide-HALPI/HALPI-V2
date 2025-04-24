import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Échec de la connexion');
      } else if (data) {
        navigate('/profile');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Connexion</h1>
          <p className="mt-2 text-gray-600">
            Accédez à votre espace d'apprentissage personnalisé
          </p>
        </div>
        
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md flex items-start gap-2 text-error-800">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                id="email"
                name="email"
                type="email"
                label="Adresse email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={18} className="text-gray-500" />}
                fullWidth
              />
            </div>
            
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                label="Mot de passe"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={18} className="text-gray-500" />}
                fullWidth
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>
              
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
            >
              Se connecter
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                S'inscrire
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
