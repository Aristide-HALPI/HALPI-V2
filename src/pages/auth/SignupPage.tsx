import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { supabase } from '../../lib/supabaseClient';

const SignupPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        setError(error.message || 'Échec de l\'inscription');
      } else if (data) {
        // Créer le profil utilisateur dans la base de données
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            { 
              id: data.id,
              first_name: firstName,
              last_name: lastName,
              daily_time_goal: 60,
              weekly_time_goal: 300,
              availability: {}, // JSON vide mais valide
              created_at: new Date()
            }
          ]);
        
        if (profileError) {
          console.error('Erreur lors de la création du profil:', profileError);
          setError('Votre compte a été créé, mais nous n\'avons pas pu configurer votre profil');
        } else {
          navigate('/profile');
        }
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Inscription</h1>
          <p className="mt-2 text-gray-600">
            Créez votre compte pour commencer votre apprentissage
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  label="Prénom"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  leftIcon={<User size={18} className="text-gray-500" />}
                  fullWidth
                />
              </div>
              
              <div>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  label="Nom"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  leftIcon={<User size={18} className="text-gray-500" />}
                  fullWidth
                />
              </div>
            </div>
            
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={18} className="text-gray-500" />}
                fullWidth
              />
              <p className="mt-1 text-xs text-gray-500">
                Le mot de passe doit contenir au moins 8 caractères
              </p>
            </div>
            
            <div>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirmer le mot de passe"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock size={18} className="text-gray-500" />}
                fullWidth
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                J'accepte les{' '}
                <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                  politique de confidentialité
                </Link>
              </label>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
            >
              S'inscrire
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà inscrit ?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Se connecter
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
