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
   * Effectue une requête POST multipart pour l'upload de fichiers
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('Non authentifié');
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas spécifier Content-Type pour que le navigateur ajoute le boundary correct
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur ${response.status}`);
    }
    
    return response.json();
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
  },
  
  /**
   * Services spécifiques pour les chapitres
   */
  chapters: {
    /**
     * Extrait le contenu d'un chapitre et le convertit en JSON
     * @param chapterId ID du chapitre à extraire
     * @returns Résultat de l'extraction avec le contenu JSON
     */
    async extractContent(chapterId: string): Promise<{ success: boolean; chapter_id: string; json_data: any }> {
      return apiService.post('/chapters/extract', { chapter_id: chapterId });
    },
    
    /**
     * Extrait le contenu de tous les chapitres d'un cours
     * @param courseId ID du cours dont les chapitres doivent être extraits
     * @returns Résultat de l'extraction avec le nombre de chapitres traités
     */
    async extractAllCourseContent(courseId: string): Promise<{ success: boolean; course_id: string; processed_count: number }> {
      return apiService.post('/chapters/extract-all', { course_id: courseId });
    },
    
    /**
     * Télécharge un fichier et l'associe à un chapitre existant
     * @param chapterId ID du chapitre
     * @param file Fichier à télécharger (PDF, DOCX, PPTX)
     * @returns Résultat de l'opération avec l'URL du fichier stocké
     */
    async uploadChapterFile(chapterId: string, file: File) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chapter_id', chapterId);
      
      return apiService.postFormData('/chapters/upload', formData);
    }
  }
};

export default apiService;
