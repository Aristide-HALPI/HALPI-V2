import { useState } from 'react';
import { User, Mail, GraduationCap, Building2, BookOpen, PenSquare, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Profile() {
  const { userData, updateUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    institution: userData?.institution || '',
    fieldOfStudy: userData?.fieldOfStudy || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserData(formData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dark-blue">Mon Profil</h1>
        <button
          onClick={() => {
            if (isEditing) {
              setFormData({
                firstName: userData?.firstName || '',
                lastName: userData?.lastName || '',
                email: userData?.email || '',
                institution: userData?.institution || '',
                fieldOfStudy: userData?.fieldOfStudy || '',
              });
            }
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors"
        >
          {isEditing ? (
            <>
              <span>Annuler</span>
            </>
          ) : (
            <>
              <PenSquare className="w-4 h-4" />
              <span>Modifier</span>
            </>
          )}
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
              <User className="w-16 h-16 text-gold" />
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  />
                ) : (
                  <p className="text-gray-900">{userData?.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  />
                ) : (
                  <p className="text-gray-900">{userData?.lastName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{userData?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Établissement
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  />
                ) : (
                  <p className="text-gray-900">{userData?.institution}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domaine d'étude
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fieldOfStudy}
                    onChange={(e) => setFormData(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                  />
                ) : (
                  <p className="text-gray-900">{userData?.fieldOfStudy}</p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-gold text-white px-6 py-2 rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}