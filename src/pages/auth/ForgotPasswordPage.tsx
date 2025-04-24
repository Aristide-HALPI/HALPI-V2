import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { resetPassword } = useAuth();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }
    
    setError(null);
    setSuccess(false);
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message || 'Une erreur est survenue');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'envoi de l\'email');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Mot de passe oublié</h1>
          <p className="mt-2 text-gray-600">
            Nous vous enverrons un lien pour réinitialiser votre mot de passe
          </p>
        </div>
        
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md flex items-start gap-2 text-error-800">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-md flex items-start gap-2 text-success-800">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email envoyé avec succès</p>
                <p className="text-sm">Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.</p>
              </div>
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
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              disabled={success}
            >
              Envoyer le lien de réinitialisation
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Retour à la connexion
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
