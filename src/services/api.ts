import { supabase } from '../lib/supabaseClient';

// URL de base de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Service pour communiquer avec l'API FastAPI
 */
export const apiService = {
  /**
   * Obtient le token d'authentification pour les requêtes API
   */
  async getAuthToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  },

  /**
   * Effectue une requête GET vers l'API
   */
  async get<T>(endpoint: string): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Effectue une requête POST vers l'API
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Effectue une requête PATCH vers l'API
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Services spécifiques pour le profil utilisateur
   */
  profile: {
    /**
     * Récupère le profil de l'utilisateur
     */
    async getProfile() {
      return apiService.get('/profile');
    },

    /**
     * Met à jour le profil de l'utilisateur
     */
    async updateProfile(profileData: any) {
      return apiService.patch('/profile/settings', profileData);
    },

    /**
     * Récupère la progression des cours de l'utilisateur
     */
    async getCourseProgress() {
      return apiService.get('/profile/course-progress');
    },

    /**
     * Soumet un feedback d'examen
     */
    async submitExamFeedback(feedbackData: any) {
      return apiService.post('/profile/exam-feedback', feedbackData);
    }
  }
};

export default apiService;
