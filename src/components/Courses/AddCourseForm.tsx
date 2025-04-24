import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface AddCourseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddCourseForm = ({ onSuccess, onCancel }: AddCourseFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    exam_date: '',
    difficulty: 'moyen', // facile, moyen, difficile, très difficile, inconnu
    estimated_time: '10-15', // tranches d'heures ou 'inconnu'
    importance: 'moyen', // faible, moyen, élevé, inconnu
  });
  
  // Références pour les champs de date
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  
  // États pour les parties de la date
  const [dateDay, setDateDay] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateYear, setDateYear] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Mise à jour de la date complète lorsque les parties changent
  useEffect(() => {
    if (dateDay && dateMonth && dateYear && dateYear.length === 4) {
      // Vérification de la validité de la date
      const day = parseInt(dateDay, 10);
      const month = parseInt(dateMonth, 10) - 1; // Les mois commencent à 0 en JavaScript
      const year = parseInt(dateYear, 10);
      
      const date = new Date(year, month, day);
      
      // Vérifier si la date est valide
      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        const formattedDate = `${year}-${dateMonth.padStart(2, '0')}-${dateDay.padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, exam_date: formattedDate }));
      }
    } else {
      // Si une des parties est vide, on vide la date complète
      setFormData(prev => ({ ...prev, exam_date: '' }));
    }
  }, [dateDay, dateMonth, dateYear]);
  
  // Initialisation des parties de date si exam_date est déjà défini
  useEffect(() => {
    if (formData.exam_date) {
      const [year, month, day] = formData.exam_date.split('-');
      setDateYear(year);
      setDateMonth(month);
      setDateDay(day);
    }
  }, []);
  
  // Gestion des touches spéciales pour la navigation entre les champs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'day' | 'month' | 'year') => {
    // Si on appuie sur Backspace sur un champ vide, on va au champ précédent
    if (e.key === 'Backspace') {
      if (field === 'month' && e.currentTarget.value === '') {
        dayRef.current?.focus();
      } else if (field === 'year' && e.currentTarget.value === '') {
        monthRef.current?.focus();
      }
    }
    // Si on appuie sur Tab, on empêche le comportement par défaut et on va au champ suivant
    else if (e.key === 'Tab' && !e.shiftKey) {
      if (field === 'day') {
        e.preventDefault();
        monthRef.current?.focus();
      } else if (field === 'month') {
        e.preventDefault();
        yearRef.current?.focus();
      }
    }
    // Si on appuie sur Shift+Tab, on empêche le comportement par défaut et on va au champ précédent
    else if (e.key === 'Tab' && e.shiftKey) {
      if (field === 'year') {
        e.preventDefault();
        monthRef.current?.focus();
      } else if (field === 'month') {
        e.preventDefault();
        dayRef.current?.focus();
      }
    }
  };
  
  // Validation et formatage des entrées numériques
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>, field: 'day' | 'month' | 'year') => {
    const value = e.target.value.replace(/\D/g, ''); // Garder uniquement les chiffres
    
    if (field === 'day') {
      // Limiter à 2 chiffres et à 31 jours maximum
      if (value.length <= 2) {
        const day = parseInt(value || '0', 10);
        if (day <= 31) {
          setDateDay(value);
          // Passer automatiquement au mois si 2 chiffres sont entrés
          if (value.length === 2 && day > 0) {
            monthRef.current?.focus();
          }
        }
      }
    } else if (field === 'month') {
      // Limiter à 2 chiffres et à 12 mois maximum
      if (value.length <= 2) {
        const month = parseInt(value || '0', 10);
        if (month <= 12) {
          setDateMonth(value);
          // Passer automatiquement à l'année si 2 chiffres sont entrés
          if (value.length === 2 && month > 0) {
            yearRef.current?.focus();
          }
        }
      }
    } else if (field === 'year') {
      // Limiter à 4 chiffres
      if (value.length <= 4) {
        setDateYear(value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("Vous devez être connecté pour ajouter un cours");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Validation des données
      if (!formData.name.trim()) {
        throw new Error("Le nom du cours est requis");
      }
      
      if (!formData.exam_date) {
        throw new Error("La date de l'examen est requise");
      }
      
      // Insertion du cours dans la base de données
      const { data, error: insertError } = await supabase
        .from('courses')
        .insert({
          name: formData.name,
          description: `Cours de ${formData.name}`,
          level: 'custom',
          image_url: 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        })
        .select('id')
        .single();
      
      if (insertError) throw insertError;
      
      if (!data?.id) {
        throw new Error("Erreur lors de la création du cours");
      }
      
      const courseId = data.id;
      
      // Création de l'association utilisateur-cours
      const { error: userCourseError } = await supabase
        .from('user_courses')
        .insert({
          user_id: user.id,
          course_id: courseId,
          exam_date: new Date(formData.exam_date).toISOString(),
          difficulty: formData.difficulty,
          estimated_time: formData.estimated_time === 'inconnu' ? null : parseInt(formData.estimated_time.split('-')[0]),
          importance: formData.importance,
          content_type: 'uploaded'
        });
      
      if (userCourseError) throw userCourseError;
      
      // Succès - informer le parent
      onSuccess();
      
      // Rediriger vers la page de détails du cours pour ajouter des chapitres
      navigate(`/courses/${courseId}`);
      
    } catch (err: any) {
      console.error('Error adding course:', err);
      setError(err.message || "Une erreur est survenue lors de l'ajout du cours");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Ajouter un nouveau cours</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-base font-medium text-gray-800 mb-2">
            Nom du cours
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ex: Introduction au droit civil"
            className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
            required
          />
        </div>
        
        <div>
          <label htmlFor="exam_date" className="block text-base font-medium text-gray-800 mb-2">
            Date de l'examen
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative w-16">
              <input
                type="text"
                ref={dayRef}
                value={dateDay}
                onChange={(e) => handleDateInput(e, 'day')}
                onKeyDown={(e) => handleKeyDown(e, 'day')}
                placeholder="JJ"
                maxLength={2}
                className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-center"
                required
              />
            </div>
            <span className="text-gray-500">/</span>
            <div className="relative w-16">
              <input
                type="text"
                ref={monthRef}
                value={dateMonth}
                onChange={(e) => handleDateInput(e, 'month')}
                onKeyDown={(e) => handleKeyDown(e, 'month')}
                placeholder="MM"
                maxLength={2}
                className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-center"
                required
              />
            </div>
            <span className="text-gray-500">/</span>
            <div className="relative w-24">
              <input
                type="text"
                ref={yearRef}
                value={dateYear}
                onChange={(e) => handleDateInput(e, 'year')}
                onKeyDown={(e) => handleKeyDown(e, 'year')}
                placeholder="AAAA"
                maxLength={4}
                className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-center"
                required
              />
            </div>
            <Calendar className="text-gray-500" size={18} />
            
            {/* Champ caché pour la validation du formulaire */}
            <input 
              type="hidden" 
              name="exam_date" 
              value={formData.exam_date} 
              required 
            />
          </div>
          
          <p className="mt-2 text-sm text-gray-600">
            Sélectionnez la date de votre examen pour que HALPI puisse optimiser votre planning de révision.
          </p>
        </div>
        
        <div>
          <label htmlFor="importance" className="block text-base font-medium text-gray-800 mb-2">
            Importance du cours (coefficient/crédits)
          </label>
          <select
            id="importance"
            name="importance"
            value={formData.importance}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 appearance-none bg-white"
          >
            <option value="faible">Faible (coefficient/crédits bas)</option>
            <option value="moyen">Moyen</option>
            <option value="eleve">Élevé (coefficient/crédits important)</option>
            <option value="inconnu">Je ne sais pas</option>
          </select>
          <p className="mt-2 text-sm text-gray-600">
            Cette information nous aide à prioriser vos révisions en fonction de l'importance relative de chaque cours dans votre cursus. 
            Un ordre d'idée approximatif est suffisant, vous pourrez toujours ajuster cette valeur plus tard.
          </p>
        </div>
        
        <div>
          <label htmlFor="difficulty" className="block text-base font-medium text-gray-800 mb-2">
            Difficulté estimée
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 appearance-none bg-white"
          >
            <option value="facile">Facile</option>
            <option value="moyen">Moyen</option>
            <option value="difficile">Difficile</option>
            <option value="tres-difficile">Très difficile</option>
            <option value="inconnu">Je ne sais pas</option>
          </select>
          <p className="mt-2 text-sm text-gray-600">
            Cette estimation nous aide à calibrer votre parcours de révision. 
            Un ordre d'idée approximatif est suffisant, vous pourrez toujours ajuster cette valeur plus tard.
          </p>
        </div>
        
        <div>
          <label htmlFor="estimated_time" className="block text-base font-medium text-gray-800 mb-2">
            Temps d'étude estimé (heures)
          </label>
          <div className="relative">
            <select
              id="estimated_time"
              name="estimated_time"
              value={formData.estimated_time}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 appearance-none bg-white"
            >
              <option value="5-10">5 à 10 heures</option>
              <option value="10-15">10 à 15 heures</option>
              <option value="15-20">15 à 20 heures</option>
              <option value="20+">Plus de 20 heures</option>
              <option value="inconnu">Je ne sais pas</option>
            </select>
            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Cette information nous aide à mieux répartir vos sessions d'étude. 
            Un ordre d'idée approximatif est suffisant, vous pourrez toujours ajuster cette valeur plus tard.
          </p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Création en cours...' : 'Créer le cours'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddCourseForm;
