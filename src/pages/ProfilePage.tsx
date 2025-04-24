import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/common/Tabs';
import Card from '../components/common/Card';
// Importation directe des composants depuis leur chemin absolu
import ProgressTable from '../components/Profile/ProgressTable';
import SettingsForm from '../components/Profile/SettingsForm';
import ExamFeedbackForm from '../components/Profile/ExamFeedbackForm';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User as LucideUser, Settings, Award, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  institution?: string;
  study_field?: string;
  academic_year?: string;
  revision_pref_start?: string;
  revision_pref_end?: string;
  availability?: Record<string, string[]>;
  daily_time_goal?: number;
  weekly_time_goal?: number;
  created_at?: string;
}

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Impossible de charger votre profil');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600">Gérez vos informations personnelles et vos préférences d'apprentissage</p>
      </div>
      
      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
            {profile?.first_name && profile?.last_name ? (
              <span className="text-2xl font-medium">
                {profile.first_name[0]}{profile.last_name[0]}
              </span>
            ) : (
              <LucideUser size={32} />
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-heading font-bold text-gray-900">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            
            {profile?.institution && (
              <p className="mt-1 text-gray-600">
                {profile.institution}
              </p>
            )}
            
            {profile?.study_field && profile?.academic_year && (
              <p className="mt-1 text-gray-600">
                {profile.study_field} • {profile.academic_year}
              </p>
            )}
          </div>
        </div>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" icon={<LucideUser size={16} />}>
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="settings" icon={<Settings size={16} />}>
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="exams" icon={<Award size={16} />}>
            Examens
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="overview">
            <ProgressTable userId={user?.id || ''} />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsForm profile={profile} />
          </TabsContent>
          
          <TabsContent value="exams">
            <ExamFeedbackForm userId={user?.id || ''} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
