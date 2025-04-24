import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../common/Button';
import Card from '../common/Card';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  institution_type?: string;
  institution?: string;
  study_field?: string;
  academic_year?: string;
  platform_usage?: string;
  availability?: Record<string, string[]>;
  daily_time_goal?: number;
  weekly_time_goal?: number;
}

interface SettingsFormProps {
  profile: UserProfile | null;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ profile }) => {
  // Styles communs pour les champs de formulaire
  const inputStyles = "w-full rounded-md border border-gray-400 shadow-sm py-2.5 px-3 font-medium text-gray-800 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50";
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    institution_type: profile?.institution_type || '',
    institution: profile?.institution || '',
    study_field: profile?.study_field || '',
    academic_year: profile?.academic_year || '',
    platform_usage: profile?.platform_usage || '',
    daily_time_goal: profile?.daily_time_goal || 60,
    weekly_time_goal: profile?.weekly_time_goal ? profile.weekly_time_goal / 60 : 5, // Conversion en heures
  });
  
  // États pour les unités de temps
  const [dailyTimeUnit, setDailyTimeUnit] = useState<'minutes' | 'heures'>('minutes');
  const [weeklyTimeUnit, setWeeklyTimeUnit] = useState<'minutes' | 'heures'>('heures');
  
  // État pour savoir si c'est la première sauvegarde
  const [isFirstSave, setIsFirstSave] = useState(false);
  
  // Déterminer si c'est la première sauvegarde (une seule fois au chargement)
  useEffect(() => {
    if (profile) {
      setIsFirstSave(!profile.first_name || profile.first_name === '');
    }
  }, [profile]);
  
  const [availability, setAvailability] = useState<Record<string, boolean[]>>(
    {
      lundi: [false, false, false, false, false, false],
      mardi: [false, false, false, false, false, false],
      mercredi: [false, false, false, false, false, false],
      jeudi: [false, false, false, false, false, false],
      vendredi: [false, false, false, false, false, false],
      samedi: [false, false, false, false, false, false],
      dimanche: [false, false, false, false, false, false],
    }
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Convertir les disponibilités du format de la base de données au format du formulaire
  useEffect(() => {
    if (profile?.availability) {
      const newAvailability = { ...availability };
      
      Object.entries(profile.availability).forEach(([day, slots]) => {
        if (day in newAvailability) {
          slots.forEach(slot => {
            const slotIndex = getSlotIndex(slot);
            if (slotIndex !== -1) {
              newAvailability[day as keyof typeof newAvailability][slotIndex] = true;
            }
          });
        }
      });
      
      setAvailability(newAvailability);
    }
  }, [profile]); // Uniquement quand le profil change
  
  const getSlotIndex = (timeSlot: string): number => {
    switch (timeSlot) {
      case '6h-10h': return 0;
      case '10h-14h': return 1;
      case '14h-18h': return 2;
      case '18h-22h': return 3;
      case '22h-2h': return 4;
      case '2h-6h': return 5;
      default: return -1;
    }
  };
  
  const getSlotName = (index: number): string => {
    switch (index) {
      case 0: return '6h-10h';
      case 1: return '10h-14h';
      case 2: return '14h-18h';
      case 3: return '18h-22h';
      case 4: return '22h-2h';
      case 5: return '2h-6h';
      default: return '';
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gestion du changement d'unité de temps
  const handleTimeUnitChange = (unit: 'minutes' | 'heures', type: 'daily' | 'weekly') => {
    if (type === 'daily') {
      // Convertir la valeur selon la nouvelle unité
      if (unit === 'heures' && dailyTimeUnit === 'minutes') {
        // Conversion minutes -> heures
        setFormData(prev => ({ ...prev, daily_time_goal: Math.round((prev.daily_time_goal / 60) * 10) / 10 }));
      } else if (unit === 'minutes' && dailyTimeUnit === 'heures') {
        // Conversion heures -> minutes
        setFormData(prev => ({ ...prev, daily_time_goal: Math.round(prev.daily_time_goal * 60) }));
      }
      setDailyTimeUnit(unit);
    } else {
      // Convertir la valeur selon la nouvelle unité
      if (unit === 'heures' && weeklyTimeUnit === 'minutes') {
        // Conversion minutes -> heures
        setFormData(prev => ({ ...prev, weekly_time_goal: Math.round((prev.weekly_time_goal / 60) * 10) / 10 }));
      } else if (unit === 'minutes' && weeklyTimeUnit === 'heures') {
        // Conversion heures -> minutes
        setFormData(prev => ({ ...prev, weekly_time_goal: Math.round(prev.weekly_time_goal * 60) }));
      }
      setWeeklyTimeUnit(unit);
    }
  };
  
  const handleAvailabilityChange = (day: string, slotIndex: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].map((checked, i) => i === slotIndex ? !checked : checked)
    }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    // Convertir les disponibilités du format du formulaire au format de la base de données
    const availabilityForDB: Record<string, string[]> = {};
    
    Object.entries(availability).forEach(([day, slots]) => {
      availabilityForDB[day] = slots
        .map((checked, index) => checked ? getSlotName(index) : null)
        .filter(Boolean) as string[];
    });
    
    // Convertir les valeurs en minutes pour le stockage selon les unités choisies
    const formDataToSubmit = {
      ...formData,
      daily_time_goal: Math.round(dailyTimeUnit === 'heures' ? formData.daily_time_goal * 60 : formData.daily_time_goal),
      weekly_time_goal: Math.round(weeklyTimeUnit === 'heures' ? formData.weekly_time_goal * 60 : formData.weekly_time_goal)
    };
    
    // Vérifier que les valeurs sont des nombres valides
    if (isNaN(formDataToSubmit.daily_time_goal) || isNaN(formDataToSubmit.weekly_time_goal)) {
      setError('Les objectifs de temps doivent être des nombres valides');
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...formDataToSubmit,
          availability: availabilityForDB
        })
        .eq('id', profile.id);
      
      if (error) {
        console.error('Supabase error:', error);
        setError(`Erreur lors de la mise à jour: ${error.message || 'Veuillez vérifier vos données'}`);
        setIsLoading(false);
        return;
      }
      
      setSuccess(true);
      
      // Marquer que ce n'est plus la première sauvegarde
      setIsFirstSave(false);
      
      // Faire défiler jusqu'au message de succès (en bas de la page)
      setTimeout(() => {
        const formElement = document.getElementById('profile-settings-form');
        if (formElement) {
          const formBottom = formElement.getBoundingClientRect().bottom;
          window.scrollTo({ top: formBottom - 300, behavior: 'smooth' });
        }
      }, 500);
      
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Une erreur est survenue lors de la mise à jour de votre profil');
      setIsLoading(false);
    }
  };
  
  const timeSlots = [
    { id: '6h-10h', label: '6h - 10h' },
    { id: '10h-14h', label: '10h - 14h' },
    { id: '14h-18h', label: '14h - 18h' },
    { id: '18h-22h', label: '18h - 22h' },
    { id: '22h-2h', label: '22h - 2h' },
    { id: '2h-6h', label: '2h - 6h' },
  ];
  
  const days = [
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ];
  
  return (
    <Card className="p-6">
      
      <form id="profile-settings-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-5">Informations personnelles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={inputStyles}
                required
              />
            </div>
            
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={inputStyles}
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-5">Informations académiques</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="institution_type" className="block text-base font-medium text-gray-800 mb-2">
                Type d'établissement
              </label>
              <select
                id="institution_type"
                name="institution_type"
                value={formData.institution_type}
                onChange={handleInputChange}
                className={inputStyles}
              >
                <option value="">Sélectionnez le type</option>
                <option value="Université">Université</option>
                <option value="Haute École">Haute École</option>
                <option value="Centre de formation">Centre de formation</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="institution" className="block text-base font-medium text-gray-800 mb-2">
                Nom de l'établissement
              </label>
              <input
                type="text"
                id="institution"
                name="institution"
                value={formData.institution}
                onChange={handleInputChange}
                placeholder="Nom de votre établissement"
                className={inputStyles}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="study_field" className="block text-sm font-medium text-gray-700 mb-1">
                Domaine d'études
              </label>
              <input
                type="text"
                id="study_field"
                name="study_field"
                value={formData.study_field}
                onChange={handleInputChange}
                placeholder="Ex: Droit, Médecine, Psychologie, Sciences informatiques..."
                className={inputStyles}
              />
            </div>
            
            <div>
              <label htmlFor="academic_year" className="block text-base font-medium text-gray-800 mb-2">
                Niveau d'études
              </label>
              {formData.institution_type === "Centre de formation" ? (
                <select
                  id="academic_year"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  className={inputStyles}
                >
                  <option value="">Sélectionnez votre année</option>
                  <option value="Année 1">Année 1</option>
                  <option value="Année 2">Année 2</option>
                  <option value="Année 3">Année 3</option>
                  <option value="Année 4">Année 4</option>
                  <option value="Année 5">Année 5</option>
                </select>
              ) : (
                <select
                  id="academic_year"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleInputChange}
                  className={inputStyles}
                >
                  <option value="">Sélectionnez votre niveau</option>
                  <option value="Bac 1">Bac 1</option>
                  <option value="Bac 2">Bac 2</option>
                  <option value="Bac 3">Bac 3</option>
                  <option value="Master 1">Master 1</option>
                  <option value="Master 2">Master 2</option>
                  <option value="Doctorat">Doctorat</option>
                  <option value="Autre">Autre</option>
                </select>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="platform_usage" className="block text-base font-medium text-gray-800 mb-2">
              Utilisation de la plateforme
            </label>
            <select
              id="platform_usage"
              name="platform_usage"
              value={formData.platform_usage}
              onChange={handleInputChange}
              className={inputStyles}
            >
              <option value="">Sélectionnez votre mode d'utilisation</option>
              <option value="Révision chaque semaine">Révision chaque semaine</option>
              <option value="Révision pour la période d'examen">Révision pour la période d'examen</option>
            </select>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-5">Préférences d'apprentissage</h3>
          

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="daily_time_goal" className="block text-base font-medium text-gray-800 mb-2">
                Objectif de temps quotidien
              </label>
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <input
                    type="number"
                    id="daily_time_goal"
                    name="daily_time_goal"
                    min="0"
                    step={dailyTimeUnit === 'heures' ? '0.5' : '5'}
                    value={formData.daily_time_goal}
                    onChange={handleInputChange}
                    className={inputStyles}
                  />
                </div>
                <div className="w-32">
                  <select 
                    value={dailyTimeUnit}
                    onChange={(e) => handleTimeUnitChange(e.target.value as 'minutes' | 'heures', 'daily')}
                    className={`${inputStyles} appearance-none bg-white`}
                  >
                    <option value="minutes">minutes</option>
                    <option value="heures">heures</option>
                  </select>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">Temps d'étude que vous souhaitez consacrer chaque jour</p>
            </div>
            
            <div>
              <label htmlFor="weekly_time_goal" className="block text-base font-medium text-gray-800 mb-2">
                Objectif de temps hebdomadaire
              </label>
              <div className="flex space-x-2">
                <div className="flex-grow">
                  <input
                    type="number"
                    id="weekly_time_goal"
                    name="weekly_time_goal"
                    min="0"
                    step={weeklyTimeUnit === 'heures' ? '0.5' : '5'}
                    value={formData.weekly_time_goal}
                    onChange={handleInputChange}
                    className={inputStyles}
                  />
                </div>
                <div className="w-32">
                  <select 
                    value={weeklyTimeUnit}
                    onChange={(e) => handleTimeUnitChange(e.target.value as 'minutes' | 'heures', 'weekly')}
                    className={`${inputStyles} appearance-none bg-white`}
                  >
                    <option value="minutes">minutes</option>
                    <option value="heures">heures</option>
                  </select>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">Temps d'étude total que vous souhaitez atteindre chaque semaine</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-base font-medium text-gray-800 mb-3">Moments de productivité optimale</h4>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez les créneaux horaires où vous êtes généralement le plus productif pour étudier
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                      Jour
                    </th>
                    {timeSlots.map(slot => (
                      <th key={slot.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {slot.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {days.map(day => (
                    <tr key={day}>
                      <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700">
                        {day}
                      </td>
                      {timeSlots.map((slot, index) => (
                        <td key={`${day}-${slot.id}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <input
                            type="checkbox"
                            id={`${day}-${slot.id}`}
                            checked={availability[day][index]}
                            onChange={() => handleAvailabilityChange(day, index)}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border border-gray-400 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            {isFirstSave ? 'Vos informations ont été enregistrées avec succès.' : 'Vos modifications ont été enregistrées avec succès.'}
          </div>
        )}
        
        <div className="flex justify-end mt-8">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : isFirstSave ? 'Enregistrer les informations' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default SettingsForm;
