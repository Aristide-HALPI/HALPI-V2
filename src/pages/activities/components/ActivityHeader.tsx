import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Activity {
  id: string;
  title: string;
  courseId: string;
  // Autres propriétés nécessaires
}

interface ActivityHeaderProps {
  activity: Activity;
  returnTo?: string | null;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ activity, returnTo }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <Link 
          to={`/parcours/${returnTo || activity.courseId}`}
          className="text-gray-600 hover:text-gray-900 flex items-center mr-4"
        >
          <ChevronLeft size={20} />
          <span>Retour au parcours</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{activity.title}</h1>
    </div>
  );
};

export default ActivityHeader;
